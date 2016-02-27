angular.module('RecipesWithYou.Controllers', [])

.controller('App.Controller', function(Auth, $ionicSideMenuDelegate, $log, $window) {
  var vm = this;
  vm.toggleLeftSideMenu = function() {
    var profile = Auth.getProfile();
    if(profile) {
      vm.authenticated = true;
      vm.profile = profile;
    }
    $ionicSideMenuDelegate.toggleLeft();
  }

  vm.signOut = function(){
    $log.info('Signing out');
    Auth.logout();
    vm.profile = {};
    vm.authenticated = false;
    $window.location = '/';
  }
})

.controller('Profile.Controller', function(User, Auth, Profile, $scope, $log, $localstorage) {
  var vm = this;
  vm.error = null;
  vm.authenticated = false;
  vm.newNotExisting = true;
  vm.activity = {};
  vm.profile = {};

  var profile = Auth.getProfile();
  if(profile) {
    vm.authenticated = true;
    if (profile.birthdate) {
      var date = new Date(Date.parse(profile.birthdate));
      profile.birthdate = date;
    }
    createDatePickerObject(profile);
    vm.profile = profile;
  }

  function createDatePickerObject(profile) {
    vm.datepickerObject = {
      titleLabel: 'Select Birthdate',  //Optional
      closeLabel: 'Close',  //Optional
      setLabel: 'Set',  //Optional
      setButtonType : 'button-positive',  //Optional
      todayButtonType : 'button-hidden',  //Optional
      closeButtonType : 'button-stable',  //Optional
      inputDate: profile.birthdate,  //Optional
      templateType: 'popup', //Optional
      showTodayButton: false, //Optional
      from: new Date(1916, 1, 1), //Optional
      to: new Date(),  //Optional
      callback: function (val) {
        if(val){
          $log.debug('Selected birthdate: ', val);
          vm.profile.birthdate = val;
          vm.updateProfile();
        }
      },
      dateFormat: 'MMMM, dd yyyy', //Optional
      closeOnSelect: true, //Optional
    };
  }

  vm.toggleNewOrExistingUser = function() {
    vm.newNotExisting = !vm.newNotExisting;
  }
  vm.doLogin = function() {
    Auth.login(vm.loginData, function(err, data){
      if(err) {
        $log.error('doLogin', err);
        vm.loginData.password = '';
        vm.loginData.password2 = '';
      } else {
        Profile.get({}, function(data){
          var profile = data;
          if (data.birthdate) {
            var date = new Date(Date.parse(data.birthdate));
            profile.birthdate = date;
          }
          createDatePickerObject(profile);
          vm.profile = profile;
          vm.authenticated = true;
          $localstorage.setObject('profile', vm.profile);
          $localstorage.set('authenticated', true);
        })
      }
    })
  }
  vm.registerUser = function() {
    if (vm.loginData.password === vm.loginData.password2) {
      var user = new User({
        email: vm.loginData.email,
        password: vm.loginData.password
      });
      user.$save(vm.doLogin);
    }
  }
  vm.updateProfile = function() {
    if(vm.profile && vm.profile._id && vm.authenticated){
      var profile = new Profile(vm.profile);
      profile.$save(function(data) {
        if(data) {
          $log.debug('updatedProfile', data);
        }
      });
    }
  }
  vm.rangeColor = function() {
    if(vm.profile && vm.profile.activityLevel){
      var rangeColor = '';
      if(vm.profile.activityLevel.toString() === '1') {
        rangeColor = '';
      }
      if(vm.profile.activityLevel.toString() === '2') {
        rangeColor = 'range-positive';
      }
      if(vm.profile.activityLevel.toString() === '3') {
        rangeColor = 'range-energized';
      }
      if(vm.profile.activityLevel.toString() === '4') {
        rangeColor = 'range-assertive';
      }
      return rangeColor;
    }
  }

  vm.activityDescriptions = [
    {short: 'Sedentary', long: 'Very little exercise or activity'},
    {short: 'Lightly Active', long: 'Light exercise or activity'},
    {short: 'Active', long: 'Frequent exercise or activity'},
    {short: 'Athlete', long: 'Very frequent exercise or activity'}
  ]

})

.controller('Recipes.Controller', function(Recipe, Auth, $scope, $log, $window, $ionicHistory) {
  var vm = this;
  getMany(vm, Recipe, 'recipes', Auth, $scope, $log);

  vm.createNew = function() {
    $ionicHistory.clearCache().then(function() {
      $window.location.href = '#/app/recipe/new';
    });
  }
})

.controller('Foods.Controller', function(Food, Auth, $scope, $log, $window, $ionicHistory) {
  var vm = this;
  getMany(vm, Food, 'foods', Auth, $scope, $log);

  vm.createNew = function() {
    $ionicHistory.clearCache().then(function() {
      $window.location.href = '#/app/food/new';
    });
  }
})

.controller('Recipe.Controller', function(Recipe, Food, Auth, $stateParams, $log, $ionicActionSheet, $ionicModal, $ionicPopup, $ionicHistory, $scope, $window) {
  var vm = this;
  vm.recipe = new Recipe({});
  vm.foodItems = [];
  vm.newIngredient = null;
  vm.mealplanning = {};
  vm.saveNewRecipe = function() {
    vm.recipe.$save(function(data){
      $log.debug('Saved', data);
      if(data._id){
        $window.location.href = '#/app/recipe/'+data._id;
      }
    });
  }
  vm.postLoad = function() {
    vm.recipe.mealTypes.forEach(function(type) {
      if(type !== 'breakfast' && type !== 'lunch' && type !== 'dinner' && type !== 'snack') {
        vm.mealtype = type;
      } else {
        vm.mealplanning[type] = true;
      }
    });
    $log.debug('post load', vm.mealplanning);
  }
  vm.toggleMealPlanning = function() {
    var mealtypes = [];
    Object.keys(vm.mealplanning).forEach(function(key) {
      if (vm.mealplanning[key]) mealtypes.push(key);
    });
    if (vm.mealtype) {
      mealtypes.push(vm.mealtype);
    }
    vm.recipe.mealTypes = mealtypes;
    $log.debug('toggleMealPlanning done', vm.recipe);
    if(vm.recipe.id) Recipe.update({_id: vm.recipe.id}, vm.recipe);
  }

  $scope.$watch('vm.mealtype', function() {
    vm.toggleMealPlanning();
  })

  getSingle(vm, Recipe, 'recipe', Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window);
  getMany(vm, Food, 'foodItems', Auth, $scope, $log);
  vm.canEdit = false;

  vm.moveIngredient = function(item, fromIndex, toIndex) {
    //Move the item in the array
    $log.debug('move ingredient', item);
    vm.recipe.ingredients.splice(fromIndex, 1);
    vm.recipe.ingredients.splice(toIndex, 0, item);
  };

  vm.removeIngredient = function(fromIndex) {
    //Move the item in the array
    $log.debug('remove ingredient', fromIndex);
    vm.recipe.ingredients.splice(fromIndex, 1);
    if(vm.recipe.id) Recipe.update({_id: vm.recipe.id}, vm.recipe);
  };

  vm.selectIngredient = function(food) {
    vm.newIngredient = food;
    vm.addToRecipe = JSON.parse(JSON.stringify(food));
    if(vm.addToRecipe.fraction.numerator) {
      vm.addToRecipe.fraction.string = vm.addToRecipe.fraction.numerator + '/' + vm.addToRecipe.fraction.denominator;
    }
  };

  vm.addIngredientToRecipe = function() {
    vm.recipe.ingredients = vm.recipe.ingredients || [];
    var recipeFormattedIngredient = {
      foodItem: vm.newIngredient,
      fraction: {
        numerator: vm.addToRecipe.fraction.numerator || 0,
        denominator:  vm.addToRecipe.fraction.denominator || 2
      },
      qty: vm.addToRecipe.qty,
      unit: vm.addToRecipe.unit
    }
    $log.debug('Adding ingredient', recipeFormattedIngredient);
    vm.recipe.ingredients.push(recipeFormattedIngredient);
    vm.addToRecipe = null;
    vm.newIngredient = null;
    vm.foodItems = [];
    vm.hideAddIngredient();
    $log.debug('Recipe ingredients', vm.recipe.ingredients);
    if(vm.recipe.id) Recipe.update({_id: vm.recipe.id}, vm.recipe);
  }

  vm.changeFraction = function() {
    if(vm.addToRecipe && vm.addToRecipe){
      var fraction = vm.addToRecipe.fraction.string.split('/');
      vm.addToRecipe.fraction.numerator = Number(fraction[0]);
      if(fraction[1]) {
        vm.addToRecipe.fraction.denominator = Number(fraction[1]);
      } else {
        vm.addToRecipe.fraction.denominator = 2;
      }
    }
  }

  $ionicModal.fromTemplateUrl('templates/ingredient.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    vm.ingredientModal = modal;
  });

  vm.showAddIngredient = function() {
    vm.ingredientModal.show();
  };

  vm.hideAddIngredient = function() {
    vm.ingredientModal.hide();
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    vm.ingredientModal.remove();
  });
  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {
    vm.newIngredient = null;
    vm.query.search = '';
    vm.query.filter = '';
  });

  vm.recordChange = function() {
    if(vm.recipe.id) Recipe.update({_id: vm.recipe.id}, vm.recipe);
  }

})

.controller('Food.Controller', function(Food, Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window) {
  var vm = this;
  vm.food = new Food({});
  vm.saveNewFood = function() {
    vm.food.$save(function(data){
      $log.debug('Saved', data);
      if(data._id){
        $window.location.href = '#/app/food/'+data._id;
      }
    });
  }
  getSingle(vm, Food, 'food', Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window);

  vm.changeFraction = function() {
    var fraction = vm.food.fraction.string.split('/');
    vm.food.fraction.numerator = Number(fraction[0]);
    if(fraction[1]) {
      vm.food.fraction.denominator = Number(fraction[1]);
    } else {
      vm.food.fraction.denominator = 2;
    }
    vm.recordChange();
  }

  vm.recordChange = function() {
    if(vm.food.id) Food.update({_id: vm.food.id}, vm.food);
  }
});

// Private
function getSingle(vm, Model, modelName, Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window) {
  var profile = Auth.getProfile();
  if(profile) {
    vm.authenticated = true;
    vm.profile = profile;
  }

  var ModelName = modelName.charAt(0).toUpperCase() + modelName.substr(1).toLowerCase();
  vm.editMode = false;
  vm.editButtonText = 'Edit';

  vm.toggleEditMode = function() {
    vm.editMode = !vm.editMode;
    if(vm.editMode) {
      vm.editButtonText = 'View';
    }else{
      vm.editButtonText = 'Edit';
    }
    $log.debug('Set edit mode to ' + vm.editMode);
  }
  if ($stateParams.id) {
    Model.get({ _id: $stateParams.id }, function(data) {
      vm[modelName] = data;
      $log.debug(modelName, vm[modelName]);
      if (vm.postLoad) vm.postLoad();
    });
  }

  vm.showActions = {};
  vm.showActions[modelName] = function() {
    var buttons = [
     { text: vm.editButtonText }
    ]
    $ionicActionSheet.show({
      buttons: buttons,
      destructiveText: 'Delete',
      titleText: '',
      cancelText: 'Cancel',
      cancel: function() {
          // add cancel code..
        },
      buttonClicked: function(index) {
       $log.debug('Clicked action sheet button ' + index);
       if(index === 0) {
         vm.toggleEditMode();
       }
       return true;
      },
      destructiveButtonClicked: function() {
        $log.debug('Clicked action sheet delete');
        var alertPopup = $ionicPopup.confirm({
         title: 'Confirm Delete',
         template: 'Are you sure?'
       });

        alertPopup.then(function(deleteIt) {
          if (deleteIt) {
            $log.debug('Deleting item', modelName, vm[modelName]);
            Model.delete({_id: vm[modelName]._id}, function(){
              $ionicHistory.clearCache().then(function() {
                $window.location.href = '#/app/' + modelName + 's';
              });
            });
          }
        });

       return true;
      }
    });
  }
}

function getMany(vm, Model, modelName, Auth, $scope, $log) {
  vm[modelName] = [];
  vm.showSearch = true;
  vm.queryIsRunning = false;

  var profile = Auth.getProfile();
  if(profile) {
    vm.authenticated = true;
    vm.profile = profile;
  }

  vm.query = {
    skip: 0,
    limit: 20,
    search: '',
    filter: '',
    type: ''
  };

  vm.lastQuery = {
    query: null,
    response: null
  }

  var doQuery = function(loadmore) {
    if(!vm.queryIsRunning){
      $log.debug('Running query', vm.query);
      vm.queryIsRunning = true;
      Model.query(vm.query, function(data) {
        vm.lastQuery.query = vm.query;
        vm.lastQuery.response = data;
        if(loadmore) {
          data.forEach(function(record) {
            vm[modelName].push(record);
          });
        } else {
          vm[modelName] = data;
        }
        $scope.$broadcast('scroll.infiniteScrollComplete');
        vm.queryIsRunning = false;;
      });
    }else{
      $log.debug('NOT Running query', vm.query);
    }
  }

  $scope.$watch('vm.query.search', function() {
    vm.query.skip = 0;
    vm.lastQuery = {
      query: null,
      response: null
    }
    doQuery();
  });

  $scope.$watch('vm.query.filter', function() {
    vm.query.skip = 0;
    vm.lastQuery = {
      query: null,
      response: null
    }
    doQuery();
  });

  $scope.$watch('vm.query.type', function() {
    vm.query.skip = 0;
    vm.lastQuery = {
      query: null,
      response: null
    }
    doQuery();
  });

  vm.loadMore = function() {
    vm.query.skip = vm[modelName].length;
    doQuery(true);
  }

  vm.moreDataCanBeLoaded = function() {
    if(vm.lastQuery.response && vm.lastQuery.response.length < vm.lastQuery.query.limit) {
      $log.debug('More data cannot be loaded', vm.lastQuery);
      return false;
    }
    return true;
  }
}

function getMeasureString(object){
    var string = '';
    if(object.qty){
      string += object.qty;
    }
    if(object.fraction && object.fraction.numerator && object.fraction.denominator){
      if(string) string += ' ';
      string += '' + object.fraction.numerator + '/' + object.fraction.denominator;
    }
    if(object.unit){
      string += ' ' + unitsOfMeasure[object.unit];
    }else{
      //hack to enable diff'ing items with no unitsOfMeasu
      string += ' ' + 'l';
    }
    return string;
  }

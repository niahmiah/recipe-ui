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
    vm.recipe = new Recipe({
      author: vm.profile.id,
      name: 'New Recipe'
    });

    vm.recipe.$save(function(recipe) {
      $log.debug('Saved recipe', recipe);
      $ionicHistory.clearCache().then(function() {
        $window.location.href = '#/app/recipe/' + recipe._id;
      });
    });
  }
})

.controller('Foods.Controller', function(Food, Auth, $scope, $log, $window, $ionicHistory) {
  var vm = this;
  getMany(vm, Food, 'foods', Auth, $scope, $log);

  vm.createNew = function() {
    vm.food = new Food({
      source: vm.profile.id,
      name: 'New Item'
    });

    vm.food.$save(function(food) {
      $log.debug('Saved food', food);
      $ionicHistory.clearCache().then(function() {
        $window.location.href = '#/app/food/' + food._id;
      });
    });
  }
})

.controller('Recipe.Controller', function(Recipe, Food, Auth, $stateParams, $log, $ionicActionSheet, $ionicModal, $ionicPopup, $ionicHistory, $scope, $window) {
  var vm = this;
  vm.recipe = new Recipe({});
  vm.foodItems = [];
  vm.newIngredient = null;
  vm.mealplanning = {};
  vm.postLoad = function() {
    vm.recipe.mealTypes.forEach(function(type) {
      vm.mealplanning[type] = true;
      if(type !== 'breakfast' && type !== 'lunch' && type !== 'dinner' && type !== 'snack') {
        vm.mealtype = type;
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
    if(vm.recipe.name) vm.recipe.$save();
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
    vm.recalculateNutrition();
    vm.recipe.$save();
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
      qty: vm.addToRecipe.qty
    }
    $log.debug('Adding ingredient', recipeFormattedIngredient);
    vm.recipe.ingredients.push(recipeFormattedIngredient);
    vm.addToRecipe = null;
    vm.newIngredient = null;
    vm.foodItems = [];
    vm.hideAddIngredient();
    $log.debug('Recipe ingredients', vm.recipe.ingredients);
    vm.recalculateNutrition();
    vm.recipe.$save();
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
  });

  vm.recalculateNutrition = function(){
    var nutritionInfo = {};
    vm.recipe.ingredients.forEach(function(ingr){
      // multiply nutrition info based on measure.js conversion
      var servingMultiplier = 1;

      var ingrMsrString = getMeasureString(ingr.foodItem) || '';
      var ingrSrv = 0;
      var ingrSrvType = 'mass';
      if(['oz', 'lb'].indexOf(ingr.foodItem.unit) > -1){
        ingrSrv = measure(ingrMsrString).ounces();
      }else{
        ingrSrvType = 'volume';
        ingrSrv = measure(ingrMsrString).milliliters();
      }

      var recipeIngrMsrString = getMeasureString(ingr) || '';
      var recipeInrgSrv = 0;
      var recipeIngrSrvType = 'mass';
      if(['oz', 'lb'].indexOf(ingr.unit) > -1){
        recipeInrgSrv = measure(recipeIngrMsrString).ounces();
      }else{
        recipeIngrSrvType = 'volume';
        recipeInrgSrv = measure(recipeIngrMsrString).milliliters();
      }


      // console.log('measure:', ingr.foodItem.name, ingrMsrString, recipeIngrMsrString);
      // console.log('vals in millis', ingrSrv, recipeInrgSrv);
      if(ingrSrvType !== recipeIngrSrvType){
        alert('Invalid measurement conversion for: ' + ingr.foodItem.name + '\n\nNutritional information will not be correct for this recipe.');
        servingMultiplier = 0;
      }else{
        servingMultiplier = (recipeInrgSrv / ingrSrv) / vm.recipe.servings;
      }

      // console.log('multiplier', servingMultiplier);
      // console.log('before', ingr.foodItem.nutrition);

      var ingrfoodItemNutrition = multiplyObject(ingr.foodItem.nutrition, servingMultiplier);
      // console.log('after', ingr.foodItem.nutrition);
      //divide by servings #
      // console.log('Adding values from', ingr.foodItem.nutrition);
      nutritionInfo = addObjects([nutritionInfo, ingrfoodItemNutrition]);
    });
    vm.recipe.nutrition = nutritionInfo;
    $log.debug('updated nutrition info', vm.recipe.nutrition);
  };

})

.controller('Food.Controller', function(Food, Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window) {
  var vm = this;
  vm.food = new Food({});
  getSingle(vm, Food, 'food', Auth, $stateParams, $log, $ionicActionSheet, $ionicPopup, $ionicHistory, $window);

  vm.changeFraction = function() {
    var fraction = vm.food.fraction.string.split('/');
    vm.food.fraction.numerator = Number(fraction[0]);
    if(fraction[1]) {
      vm.food.fraction.denominator = Number(fraction[1]);
    } else {
      vm.food.fraction.denominator = 2;
    }
    vm.food.$save();
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

  Model.get({ _id: $stateParams.id }, function(data) {
    vm[modelName] = data;
    $log.debug(modelName, vm[modelName]);
    if(vm[modelName].name === 'New Item' ||
      vm[modelName].name === 'New Recipe' &&
      ((vm.food && vm.food.source && vm.food.source.id === vm.profile.id) ||
      (vm.recipe && vm.recipe.author && vm.recipe.author.id === vm.profile.id))) {
        $log.debug('Set edit mode to true');
      vm.editMode = true;
      vm.editButtonText = 'View';
    }
    if (vm.postLoad) vm.postLoad();
  });

  vm.showActions = {};
  vm.showActions[modelName] = function() {
    $ionicActionSheet.show({
      buttons: [
       { text: vm.editButtonText }
      ],
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

  var profile = Auth.getProfile();
  if(profile) {
    vm.authenticated = true;
    vm.profile = profile;
  }

  vm.query = {
    skip: 0,
    limit: 20,
    search: '',
    filter: ''
  };

  var doQuery = function(loadmore) {
    $log.debug('Running query', vm.query);
    Model.query(vm.query, function(data) {
      if(loadmore) {
        data.forEach(function(record) {
          vm[modelName].push(record);
        });
        $scope.$broadcast('scroll.infiniteScrollComplete');
      } else {
        vm[modelName] = data;
      }
    });
  }

  $scope.$watch('vm.query.search', function() {
    vm.query.skip = 0;
    doQuery();
  });

  $scope.$watch('vm.query.filter', function() {
    vm.query.skip = 0;
    doQuery();
  });

  vm.loadMore = function() {
    vm.query.skip = vm.query.skip + vm.query.limit;
    doQuery(true);
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

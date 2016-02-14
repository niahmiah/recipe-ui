angular.module('NutritionTracker.Controllers', [])

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

.controller('Recipes.Controller', function(Recipe, $scope, $log) {
  var vm = this;
  getMany(vm, Recipe, 'recipes', $scope, $log);
})

.controller('Foods.Controller', function(Food, $scope, $log) {
  var vm = this;
  getMany(vm, Food, 'foods', $scope, $log);
})

.controller('Recipe.Controller', function(Recipe, $stateParams, $log, $ionicActionSheet) {
  var vm = this;
  getSingle(vm, Recipe, 'recipe', $stateParams, $log, $ionicActionSheet);
})

.controller('Food.Controller', function(Food, $stateParams, $log, $ionicActionSheet) {
  var vm = this;
  getSingle(vm, Food, 'food', $stateParams, $log, $ionicActionSheet);
});

// Private
function getSingle(vm, Model, modelName, $stateParams, $log, $ionicActionSheet) {
  Model.get({ _id: $stateParams.id }, function(data) {
    vm[modelName] = data;
    $log.debug(modelName, vm[modelName]);
  });
  vm.showActions = {};
  vm.showActions[modelName] = function() {
    $ionicActionSheet.show({
     buttons: [
       { text: 'Edit' }
     ],
     destructiveText: 'Delete',
     titleText: '',
     cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     buttonClicked: function(index) {
       return true;
     }
   });
  }
}

function getMany(vm, Model, modelName, $scope, $log) {
  vm[modelName] = [];

  vm.shouldShowDelete = false;
  vm.shouldShowReorder = false;
  vm.listCanSwipe = false

  vm.showSearch = true;

  vm.query = {
    skip: 0,
    limit: 20,
    search: ''
  };

  var doQuery = function(loadmore) {
    $log.debug('Running query', vm.query);
    Model.query(vm.query , function(data) {
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

  vm.loadMore = function() {
    vm.query.skip = vm.query.skip + vm.query.limit;
    doQuery(true);
  }
}

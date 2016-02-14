// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// the name of this angular module is also set in a <body> attribute in index.html
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('NutritionTracker', ['ionic', 'ionic-datepicker', 'ngResource', 'ngCookies', 'NutritionTracker.Config', 'NutritionTracker.Controllers', 'NutritionTracker.Factories'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
  $ionicConfigProvider.backButton.previousTitleText(false);
  $ionicConfigProvider.backButton.text('').icon('ion-ios-arrow-back');
  $stateProvider

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'App.Controller',
    controllerAs: 'vm'
  })

  .state('app.profile', {
    url: '/profile',
    views: {
      'menuContent': {
        templateUrl: 'templates/profile.html',
        controller: 'Profile.Controller',
        controllerAs: 'vm'
      }
    }
  })

  .state('app.foods', {
    url: '/foods',
    views: {
      'menuContent': {
        templateUrl: 'templates/foods.html',
        controller: 'Foods.Controller',
        controllerAs: 'vm'
      }
    }
  })

  .state('app.food', {
    url: '/food/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/food.html',
        controller: 'Food.Controller',
        controllerAs: 'vm'
      }
    }
  })

  .state('app.recipes', {
    url: '/recipes',
    views: {
      'menuContent': {
        templateUrl: 'templates/recipes.html',
        controller: 'Recipes.Controller',
        controllerAs: 'vm'
      }
    }
  })

  .state('app.recipe', {
    url: '/recipe/:id',
    views: {
      'menuContent': {
        templateUrl: 'templates/recipe.html',
        controller: 'Recipe.Controller',
        controllerAs: 'vm'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/app/recipes');
});
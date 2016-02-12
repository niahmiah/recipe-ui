angular.module('NutritionTracker.Factories', ['ngResource', 'NutritionTracker.Config'])

  .factory('Recipe', function($resource, $serverAddress) {
    return $resource($serverAddress + '/recipe/:_id')
  })

  .factory('Food', function($resource, $serverAddress) {
    return $resource($serverAddress + '/foodItem/:_id')
  })

  .factory('User', function($resource, $serverAddress) {
    return $resource($serverAddress + '/user/:_id')
  })

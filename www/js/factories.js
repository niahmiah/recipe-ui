angular.module('RecipesWithYou.Factories', ['ngResource', 'RecipesWithYou.Config'])

  .factory('Recipe', function($resource, $serverAddress) {
    return $resource($serverAddress + '/recipe/:_id')
  })

  .factory('Food', function($resource, $serverAddress) {
    return $resource($serverAddress + '/foodItem/:_id')
  })

  .factory('User', function($resource, $serverAddress) {
    return $resource($serverAddress + '/user/:_id')
  })

  .factory('Profile', function($resource, $serverAddress) {
    return $resource($serverAddress + '/profile/:_id')
  })

  .factory('Auth', function($http, $serverAddress, $httpParamSerializer, $window, $log) {
    return {
      login: function(credentials, cb) {
        var req = {
          method: 'POST',
          url: $serverAddress + '/oauth/token',
          headers: {
            Authorization: 'Basic '+window.btoa('webApp:sauce'),
            'Content-type': 'application/x-www-form-urlencoded; charset=utf-8'
          },
          data: $httpParamSerializer({
            'grant_type': 'password',
            username: credentials.email,
            password: credentials.password,
            'client_id': 'webApp'
          })
        };
        $http(req).then(function(data){
            $log.debug(data);
            $http.defaults.headers.common.Authorization = 'Bearer ' + data.data.access_token;
            $window.localStorage['access_token'] = data.data.access_token;
            cb(null, data);
        }).catch(cb);
      },
      getProfile: function() {
        if($window.localStorage.access_token) {
          var profile = $window.localStorage.profile;
          $http.defaults.headers.common.Authorization = 'Bearer ' + $window.localStorage['access_token'];
          return angular.fromJson(profile);
        }
      },
      logout: function() {
        $window.localStorage.clear();
      }
    }
  })

  .factory('$localstorage', ['$window', function($window) {
    return {
      set: function(key, value) {
        $window.localStorage[key] = value;
      },
      get: function(key, defaultValue) {
        return $window.localStorage[key] || defaultValue;
      },
      setObject: function(key, value) {
        $window.localStorage[key] = angular.toJson(value);
      },
      getObject: function(key) {
        return angular.fromJson($window.localStorage[key] || '{}');
      }
    }
  }]);

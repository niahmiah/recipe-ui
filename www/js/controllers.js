angular.module('NutritionTracker.Controllers', [])

.controller('App.Controller', function(User) {
  var vm = this;
})

.controller('Recipes.Controller', function(Recipe, $scope) {
  var vm = this;
  vm.showSearch = false;
  vm.toggleSearch = function toggleSearch() {
    vm.showSearch = !vm.showSearch;
    vm.search = '';
  };
  $scope.$watch('vm.search', function() {
    Recipe.query({search: vm.search}, function(data) {
      vm.recipes = data;
    });
  });
})

.controller('Recipe.Controller', function(Recipe, $stateParams) {
  var vm = this;
  Recipe.get({ _id: $stateParams.recipeId }, function(data) {
    vm.recipe = data;
    console.log(vm.recipe);
  });
})

.controller('Foods.Controller', function(Food, $scope) {
  var vm = this;
  vm.showSearch = false;
  vm.toggleSearch = function toggleSearch() {
    vm.showSearch = !vm.showSearch;
    vm.search = '';
  };
  $scope.$watch('vm.search', function() {
    Food.query({search: vm.search}, function(data) {
      vm.foods = data;
    });
  });
})

.controller('Food.Controller', function(Food, $stateParams) {
  var vm = this;
  Food.get({ _id: $stateParams.foodId }, function(data) {
    vm.food = data;
    console.log(vm.food);
  });
})

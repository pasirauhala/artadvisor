'use strict';

angular.module('main').controller('SplashController', SplashController);

SplashController.$inject = [
	'$window',
	'$scope',
	'$resource',
	'$state',
	'Authentication',
	'API',
	'$http',
	'LangSvc'
];

function SplashController($window, $scope, $resource, $state, Authentication, API, $http, LangSvc) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.languages = ['en', 'fi', 'se', 'de'];
  $window.hasFooter = false;

  // Active language
  $scope.activeLang = function(lang) {
    // Return
    return lang === LangSvc.getLanguage();
  };
  // Select
  $scope.selectLang = function(lang) {
    // Set lang
    LangSvc.setLanguage(lang);

    // If there's user
    if (Authentication.token) {
      // Set lang
      // Update
      API.put('me', { user: { lang: lang } }).then(function(response) {
      // Set lang
        $state.go('authentication');
      });
    } else {
      // Set lang
      $http.post('/lang', { lang: lang }).then(function(response) {
        // Go
        $state.go('authentication');
      });
    }
  };
}

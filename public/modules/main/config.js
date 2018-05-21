'use strict';

// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
	// Init module configuration options
	var applicationModuleName = 'mean';
	var applicationModuleVendorDependencies = [
		'ngResource',
		'ngAnimate',
		'ui.router',
		'ui.utils',
		'wu.masonry',
		'angularMoment',
		'duScroll',
		'infinite-scroll',
		'hmTouchEvents',
		'uiGmapgoogle-maps',
		'checklist-model',
		'ngFileUpload',
		'ngTagsInput',
		'ngMask',
		'geolocation',
		'datePicker',
		'720kb.tooltips',
		'720kb.socialshare'
	];

	// Add a new vertical module
	var registerModule = function(moduleName, dependencies) {
		// Create angular module
		angular.module(moduleName, dependencies || []);
		// Add the module to the AngularJS configuration file
		angular.module(applicationModuleName).requires.push(moduleName);
	};

	return {
		applicationModuleName: applicationModuleName,
		applicationModuleVendorDependencies: applicationModuleVendorDependencies,
		registerModule: registerModule
	};
})();

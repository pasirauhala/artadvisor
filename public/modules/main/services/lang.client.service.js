'use strict';

// Language Service
angular.module('main').factory('LangSvc', LanguageService);

LanguageService.$inject = [
	'Authentication',
	'APP_KEYS'
];

function LanguageService(Authentication, APP_KEYS) {
	var language = 'en',
			service = {
        init: init,
        getLanguage: getLanguage,
        setLanguage: setLanguage
    	};

  init();

  return service;

  ////////////////////////////////////////////////

  function init() {
  	var userLang = $.cookie(APP_KEYS.cookieLangKey);

  	if (Authentication.token) {
  		Authentication.promise.then(function(auth) {
	  		if (auth.user) {
	  			language = setLanguage(auth.user.lang);
	  		}
  		});
		} else {
			if (userLang) {
				language = userLang;
			}
		}
  }

  function getLanguage() {
  	return language;
  }

  function setLanguage(lang) {
  	language = lang;
  	// reset language cookie
  	$.cookie(APP_KEYS.cookieLangKey, lang, { expires: 30, path: '/' });

  	return getLanguage();
  }
}

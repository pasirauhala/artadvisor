'use strict';

// Language filter
angular.module('main').filter('lang', langFilter);

langFilter.$inject = ['translations', 'LangSvc'];

function langFilter(translations, LangSvc) {

  // Args char
  var argsChar = '%%';

  var replaceArgs = function(str, args) {
    // Counter
    var c = 0;
    // Find
    while (true) {
      // If found
      var pos = str.indexOf(argsChar);
      // If there's any
      if (pos >= 0 && (typeof args[c] !== 'undefined')) {
        // Replace
        str = str.replace(argsChar, args[c]);
        // Increment
        c++;
      } else {
        // Quit
        break;
      }
    }
    // Return
    return str;
  };

  var translate = function(input, args, lang, key) {
    var userLang = LangSvc.getLanguage();

    lang = lang || 'en';

    // Fix
    if (userLang === 'se') {
      userLang = 'sv';
    }

    // If no input
    if (!input) {
      return '';
    }
    
    // If input has | and 4
    var trans = input.split('|');
    // If 4
    if (trans.length === 4) {
      // Use it
      var langs = { en: 0, fi: 1, sv: 2, de: 3 };
      // Return
      return replaceArgs(trans[langs[userLang]], args);
    }

    // If already english
    if (userLang === lang) {
      // Return
      return replaceArgs(input, args);
    }

    // Clean
    var clean = angular.element.trim(input.toLowerCase());
    // Loop through translations
    for (var i = 0; i < translations.length; i++) {
      // If match
      if (translations[i][lang].toLowerCase() === clean) {
        // Rturn
        return replaceArgs(translations[i][userLang], args);
      }
    }

    // Return original
    return replaceArgs(input, args);
  };

	// Find the english text
  return translate;
}

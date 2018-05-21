'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  q = require('q'),
  request = require('request'),
  errorHandler = require('../errors.server.controller'),
  mongoose = require('mongoose'),
  passport = require('passport'),
  generator = require('./helpers/generator.server.helper'),
  api = require('./helpers/api.server.helper'),
  Exhibition = mongoose.model('Exhibition'),
  Venue = mongoose.model('Venue'),
  Gallery = mongoose.model('Gallery'),
  User = mongoose.model('User'),
  City = mongoose.model('City'),
  Country = mongoose.model('Country'),
  moment = require('moment'),
  help = require('./help.server.controller').help;

var accented = {'Á':'A','Ă':'A','Ắ':'A','Ặ':'A','Ằ':'A','Ẳ':'A','Ẵ':'A','Ǎ':'A','Â':'A','Ấ':'A','Ậ':'A','Ầ':'A','Ẩ':'A','Ẫ':'A','Ä':'A','Ǟ':'A','Ȧ':'A','Ǡ':'A','Ạ':'A','Ȁ':'A','À':'A','Ả':'A','Ȃ':'A','Ā':'A','Ą':'A','Å':'A','Ǻ':'A','Ḁ':'A','Ⱥ':'A','Ã':'A','Ꜳ':'AA','Æ':'AE','Ǽ':'AE','Ǣ':'AE','Ꜵ':'AO','Ꜷ':'AU','Ꜹ':'AV','Ꜻ':'AV','Ꜽ':'AY','Ḃ':'B','Ḅ':'B','Ɓ':'B','Ḇ':'B','Ƀ':'B','Ƃ':'B','Ć':'C','Č':'C','Ç':'C','Ḉ':'C','Ĉ':'C','Ċ':'C','Ƈ':'C','Ȼ':'C','Ď':'D','Ḑ':'D','Ḓ':'D','Ḋ':'D','Ḍ':'D','Ɗ':'D','Ḏ':'D','ǲ':'D','ǅ':'D','Đ':'D','Ƌ':'D','Ǳ':'DZ','Ǆ':'DZ','É':'E','Ĕ':'E','Ě':'E','Ȩ':'E','Ḝ':'E','Ê':'E','Ế':'E','Ệ':'E','Ề':'E','Ể':'E','Ễ':'E','Ḙ':'E','Ë':'E','Ė':'E','Ẹ':'E','Ȅ':'E','È':'E','Ẻ':'E','Ȇ':'E','Ē':'E','Ḗ':'E','Ḕ':'E','Ę':'E','Ɇ':'E','Ẽ':'E','Ḛ':'E','Ꝫ':'ET','Ḟ':'F','Ƒ':'F','Ǵ':'G','Ğ':'G','Ǧ':'G','Ģ':'G','Ĝ':'G','Ġ':'G','Ɠ':'G','Ḡ':'G','Ǥ':'G','Ḫ':'H','Ȟ':'H','Ḩ':'H','Ĥ':'H','Ⱨ':'H','Ḧ':'H','Ḣ':'H','Ḥ':'H','Ħ':'H','Í':'I','Ĭ':'I','Ǐ':'I','Î':'I','Ï':'I','Ḯ':'I','İ':'I','Ị':'I','Ȉ':'I','Ì':'I','Ỉ':'I','Ȋ':'I','Ī':'I','Į':'I','Ɨ':'I','Ĩ':'I','Ḭ':'I','Ꝺ':'D','Ꝼ':'F','Ᵹ':'G','Ꞃ':'R','Ꞅ':'S','Ꞇ':'T','Ꝭ':'IS','Ĵ':'J','Ɉ':'J','Ḱ':'K','Ǩ':'K','Ķ':'K','Ⱪ':'K','Ꝃ':'K','Ḳ':'K','Ƙ':'K','Ḵ':'K','Ꝁ':'K','Ꝅ':'K','Ĺ':'L','Ƚ':'L','Ľ':'L','Ļ':'L','Ḽ':'L','Ḷ':'L','Ḹ':'L','Ⱡ':'L','Ꝉ':'L','Ḻ':'L','Ŀ':'L','Ɫ':'L','ǈ':'L','Ł':'L','Ǉ':'LJ','Ḿ':'M','Ṁ':'M','Ṃ':'M','Ɱ':'M','Ń':'N','Ň':'N','Ņ':'N','Ṋ':'N','Ṅ':'N','Ṇ':'N','Ǹ':'N','Ɲ':'N','Ṉ':'N','Ƞ':'N','ǋ':'N','Ñ':'N','Ǌ':'NJ','Ó':'O','Ŏ':'O','Ǒ':'O','Ô':'O','Ố':'O','Ộ':'O','Ồ':'O','Ổ':'O','Ỗ':'O','Ö':'O','Ȫ':'O','Ȯ':'O','Ȱ':'O','Ọ':'O','Ő':'O','Ȍ':'O','Ò':'O','Ỏ':'O','Ơ':'O','Ớ':'O','Ợ':'O','Ờ':'O','Ở':'O','Ỡ':'O','Ȏ':'O','Ꝋ':'O','Ꝍ':'O','Ō':'O','Ṓ':'O','Ṑ':'O','Ɵ':'O','Ǫ':'O','Ǭ':'O','Ø':'O','Ǿ':'O','Õ':'O','Ṍ':'O','Ṏ':'O','Ȭ':'O','Ƣ':'OI','Ꝏ':'OO','Ɛ':'E','Ɔ':'O','Ȣ':'OU','Ṕ':'P','Ṗ':'P','Ꝓ':'P','Ƥ':'P','Ꝕ':'P','Ᵽ':'P','Ꝑ':'P','Ꝙ':'Q','Ꝗ':'Q','Ŕ':'R','Ř':'R','Ŗ':'R','Ṙ':'R','Ṛ':'R','Ṝ':'R','Ȑ':'R','Ȓ':'R','Ṟ':'R','Ɍ':'R','Ɽ':'R','Ꜿ':'C','Ǝ':'E','Ś':'S','Ṥ':'S','Š':'S','Ṧ':'S','Ş':'S','Ŝ':'S','Ș':'S','Ṡ':'S','Ṣ':'S','Ṩ':'S','Ť':'T','Ţ':'T','Ṱ':'T','Ț':'T','Ⱦ':'T','Ṫ':'T','Ṭ':'T','Ƭ':'T','Ṯ':'T','Ʈ':'T','Ŧ':'T','Ɐ':'A','Ꞁ':'L','Ɯ':'M','Ʌ':'V','Ꜩ':'TZ','Ú':'U','Ŭ':'U','Ǔ':'U','Û':'U','Ṷ':'U','Ü':'U','Ǘ':'U','Ǚ':'U','Ǜ':'U','Ǖ':'U','Ṳ':'U','Ụ':'U','Ű':'U','Ȕ':'U','Ù':'U','Ủ':'U','Ư':'U','Ứ':'U','Ự':'U','Ừ':'U','Ử':'U','Ữ':'U','Ȗ':'U','Ū':'U','Ṻ':'U','Ų':'U','Ů':'U','Ũ':'U','Ṹ':'U','Ṵ':'U','Ꝟ':'V','Ṿ':'V','Ʋ':'V','Ṽ':'V','Ꝡ':'VY','Ẃ':'W','Ŵ':'W','Ẅ':'W','Ẇ':'W','Ẉ':'W','Ẁ':'W','Ⱳ':'W','Ẍ':'X','Ẋ':'X','Ý':'Y','Ŷ':'Y','Ÿ':'Y','Ẏ':'Y','Ỵ':'Y','Ỳ':'Y','Ƴ':'Y','Ỷ':'Y','Ỿ':'Y','Ȳ':'Y','Ɏ':'Y','Ỹ':'Y','Ź':'Z','Ž':'Z','Ẑ':'Z','Ⱬ':'Z','Ż':'Z','Ẓ':'Z','Ȥ':'Z','Ẕ':'Z','Ƶ':'Z','Ĳ':'IJ','Œ':'OE','ᴀ':'A','ᴁ':'AE','ʙ':'B','ᴃ':'B','ᴄ':'C','ᴅ':'D','ᴇ':'E','ꜰ':'F','ɢ':'G','ʛ':'G','ʜ':'H','ɪ':'I','ʁ':'R','ᴊ':'J','ᴋ':'K','ʟ':'L','ᴌ':'L','ᴍ':'M','ɴ':'N','ᴏ':'O','ɶ':'OE','ᴐ':'O','ᴕ':'OU','ᴘ':'P','ʀ':'R','ᴎ':'N','ᴙ':'R','ꜱ':'S','ᴛ':'T','ⱻ':'E','ᴚ':'R','ᴜ':'U','ᴠ':'V','ᴡ':'W','ʏ':'Y','ᴢ':'Z','á':'a','ă':'a','ắ':'a','ặ':'a','ằ':'a','ẳ':'a','ẵ':'a','ǎ':'a','â':'a','ấ':'a','ậ':'a','ầ':'a','ẩ':'a','ẫ':'a','ä':'a','ǟ':'a','ȧ':'a','ǡ':'a','ạ':'a','ȁ':'a','à':'a','ả':'a','ȃ':'a','ā':'a','ą':'a','ᶏ':'a','ẚ':'a','å':'a','ǻ':'a','ḁ':'a','ⱥ':'a','ã':'a','ꜳ':'aa','æ':'ae','ǽ':'ae','ǣ':'ae','ꜵ':'ao','ꜷ':'au','ꜹ':'av','ꜻ':'av','ꜽ':'ay','ḃ':'b','ḅ':'b','ɓ':'b','ḇ':'b','ᵬ':'b','ᶀ':'b','ƀ':'b','ƃ':'b','ɵ':'o','ć':'c','č':'c','ç':'c','ḉ':'c','ĉ':'c','ɕ':'c','ċ':'c','ƈ':'c','ȼ':'c','ď':'d','ḑ':'d','ḓ':'d','ȡ':'d','ḋ':'d','ḍ':'d','ɗ':'d','ᶑ':'d','ḏ':'d','ᵭ':'d','ᶁ':'d','đ':'d','ɖ':'d','ƌ':'d','ı':'i','ȷ':'j','ɟ':'j','ʄ':'j','ǳ':'dz','ǆ':'dz','é':'e','ĕ':'e','ě':'e','ȩ':'e','ḝ':'e','ê':'e','ế':'e','ệ':'e','ề':'e','ể':'e','ễ':'e','ḙ':'e','ë':'e','ė':'e','ẹ':'e','ȅ':'e','è':'e','ẻ':'e','ȇ':'e','ē':'e','ḗ':'e','ḕ':'e','ⱸ':'e','ę':'e','ᶒ':'e','ɇ':'e','ẽ':'e','ḛ':'e','ꝫ':'et','ḟ':'f','ƒ':'f','ᵮ':'f','ᶂ':'f','ǵ':'g','ğ':'g','ǧ':'g','ģ':'g','ĝ':'g','ġ':'g','ɠ':'g','ḡ':'g','ᶃ':'g','ǥ':'g','ḫ':'h','ȟ':'h','ḩ':'h','ĥ':'h','ⱨ':'h','ḧ':'h','ḣ':'h','ḥ':'h','ɦ':'h','ẖ':'h','ħ':'h','ƕ':'hv','í':'i','ĭ':'i','ǐ':'i','î':'i','ï':'i','ḯ':'i','ị':'i','ȉ':'i','ì':'i','ỉ':'i','ȋ':'i','ī':'i','į':'i','ᶖ':'i','ɨ':'i','ĩ':'i','ḭ':'i','ꝺ':'d','ꝼ':'f','ᵹ':'g','ꞃ':'r','ꞅ':'s','ꞇ':'t','ꝭ':'is','ǰ':'j','ĵ':'j','ʝ':'j','ɉ':'j','ḱ':'k','ǩ':'k','ķ':'k','ⱪ':'k','ꝃ':'k','ḳ':'k','ƙ':'k','ḵ':'k','ᶄ':'k','ꝁ':'k','ꝅ':'k','ĺ':'l','ƚ':'l','ɬ':'l','ľ':'l','ļ':'l','ḽ':'l','ȴ':'l','ḷ':'l','ḹ':'l','ⱡ':'l','ꝉ':'l','ḻ':'l','ŀ':'l','ɫ':'l','ᶅ':'l','ɭ':'l','ł':'l','ǉ':'lj','ſ':'s','ẜ':'s','ẛ':'s','ẝ':'s','ḿ':'m','ṁ':'m','ṃ':'m','ɱ':'m','ᵯ':'m','ᶆ':'m','ń':'n','ň':'n','ņ':'n','ṋ':'n','ȵ':'n','ṅ':'n','ṇ':'n','ǹ':'n','ɲ':'n','ṉ':'n','ƞ':'n','ᵰ':'n','ᶇ':'n','ɳ':'n','ñ':'n','ǌ':'nj','ó':'o','ŏ':'o','ǒ':'o','ô':'o','ố':'o','ộ':'o','ồ':'o','ổ':'o','ỗ':'o','ö':'o','ȫ':'o','ȯ':'o','ȱ':'o','ọ':'o','ő':'o','ȍ':'o','ò':'o','ỏ':'o','ơ':'o','ớ':'o','ợ':'o','ờ':'o','ở':'o','ỡ':'o','ȏ':'o','ꝋ':'o','ꝍ':'o','ⱺ':'o','ō':'o','ṓ':'o','ṑ':'o','ǫ':'o','ǭ':'o','ø':'o','ǿ':'o','õ':'o','ṍ':'o','ṏ':'o','ȭ':'o','ƣ':'oi','ꝏ':'oo','ɛ':'e','ᶓ':'e','ɔ':'o','ᶗ':'o','ȣ':'ou','ṕ':'p','ṗ':'p','ꝓ':'p','ƥ':'p','ᵱ':'p','ᶈ':'p','ꝕ':'p','ᵽ':'p','ꝑ':'p','ꝙ':'q','ʠ':'q','ɋ':'q','ꝗ':'q','ŕ':'r','ř':'r','ŗ':'r','ṙ':'r','ṛ':'r','ṝ':'r','ȑ':'r','ɾ':'r','ᵳ':'r','ȓ':'r','ṟ':'r','ɼ':'r','ᵲ':'r','ᶉ':'r','ɍ':'r','ɽ':'r','ↄ':'c','ꜿ':'c','ɘ':'e','ɿ':'r','ś':'s','ṥ':'s','š':'s','ṧ':'s','ş':'s','ŝ':'s','ș':'s','ṡ':'s','ṣ':'s','ṩ':'s','ʂ':'s','ᵴ':'s','ᶊ':'s','ȿ':'s','ɡ':'g','ᴑ':'o','ᴓ':'o','ᴝ':'u','ť':'t','ţ':'t','ṱ':'t','ț':'t','ȶ':'t','ẗ':'t','ⱦ':'t','ṫ':'t','ṭ':'t','ƭ':'t','ṯ':'t','ᵵ':'t','ƫ':'t','ʈ':'t','ŧ':'t','ᵺ':'th','ɐ':'a','ᴂ':'ae','ǝ':'e','ᵷ':'g','ɥ':'h','ʮ':'h','ʯ':'h','ᴉ':'i','ʞ':'k','ꞁ':'l','ɯ':'m','ɰ':'m','ᴔ':'oe','ɹ':'r','ɻ':'r','ɺ':'r','ⱹ':'r','ʇ':'t','ʌ':'v','ʍ':'w','ʎ':'y','ꜩ':'tz','ú':'u','ŭ':'u','ǔ':'u','û':'u','ṷ':'u','ü':'u','ǘ':'u','ǚ':'u','ǜ':'u','ǖ':'u','ṳ':'u','ụ':'u','ű':'u','ȕ':'u','ù':'u','ủ':'u','ư':'u','ứ':'u','ự':'u','ừ':'u','ử':'u','ữ':'u','ȗ':'u','ū':'u','ṻ':'u','ų':'u','ᶙ':'u','ů':'u','ũ':'u','ṹ':'u','ṵ':'u','ᵫ':'ue','ꝸ':'um','ⱴ':'v','ꝟ':'v','ṿ':'v','ʋ':'v','ᶌ':'v','ⱱ':'v','ṽ':'v','ꝡ':'vy','ẃ':'w','ŵ':'w','ẅ':'w','ẇ':'w','ẉ':'w','ẁ':'w','ⱳ':'w','ẘ':'w','ẍ':'x','ẋ':'x','ᶍ':'x','ý':'y','ŷ':'y','ÿ':'y','ẏ':'y','ỵ':'y','ỳ':'y','ƴ':'y','ỷ':'y','ỿ':'y','ȳ':'y','ẙ':'y','ɏ':'y','ỹ':'y','ź':'z','ž':'z','ẑ':'z','ʑ':'z','ⱬ':'z','ż':'z','ẓ':'z','ȥ':'z','ẕ':'z','ᵶ':'z','ᶎ':'z','ʐ':'z','ƶ':'z','ɀ':'z','ﬀ':'ff','ﬃ':'ffi','ﬄ':'ffl','ﬁ':'fi','ﬂ':'fl','ĳ':'ij','œ':'oe','ﬆ':'st','ₐ':'a','ₑ':'e','ᵢ':'i','ⱼ':'j','ₒ':'o','ᵣ':'r','ᵤ':'u','ᵥ':'v','ₓ':'x'};
var ascii = function(str) {
  // Return
  return str.replace(/[^A-Za-z0-9\[\] ]/g, function(a) {
    return accented[a] || a;
  });
};

exports.location = {

  ascii: ascii,

  toArrayTranslations: function(translations) {
    // Translations
    var thisTranslations = [];
    // Loop through translations
    _.forEach(translations, function(translatedText, lang) {
      // Add
      thisTranslations.push({
        lang: lang,
        value: translatedText
      });
    });
    // Return
    return thisTranslations;
  },

  translationsToMongooseFormat: function(translations) {
    var mongooseFormat = [];
    // Loop through translations
    _.forEach(translations || {}, function(value, lang) {
      mongooseFormat.push({
        value: value,
        lang: lang
      });
    });
    // Return
    return mongooseFormat;
  },

  // Fetch or update cities
  fetchOrUpdateCities: function(done, toUpdate) {
    // Get all cities
    Venue.find({}).exec(function(err, venues) {
      // Cities
      var cities = [],
          toFix = {
            helsnki: 'Helsinki'
          };
      // Ucfirst
      var ucfirst = function(str) {
        // Return
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
      };
      // Check if mixed
      var getMixed = function(city) {
        // To check for mixed, split with space
        var address = city.split(' '),
            line1 = _.isUndefined(address[1]) ? '' : address[0];
        // Return
        return line1 ? {
          line1: line1.replace(',', ''),
          city: address[1],
          orig: ucfirst(city)
        } : null;
      };

      // UPdated
      var updated = [],
          unique = [];
      // Updated
      var update = function(venue, line1, city, type) {
        // The city
        city = ucfirst(city);
        // If to update
        if (!!toUpdate) {
          // Create promise
          var deferred = q.defer();
          // Add to promises
          updated.push(deferred.promise);
          // Save
          venue.address.line1 = line1;
          venue.address.city = city;

          // Save
          venue.save(function(err, venue) {
            // Resolve
            deferred.resolve(venue);
          });
        } else {
          // Push
          updated.push({
            name: venue.name,
            permalink: venue.permalink,
            line1: line1,
            city: city,
            type: type,
            orig: {
              line1: venue.address.line1,
              city: venue.address.city
            }
          });
        }
      };

      // Loop venues
      (venues || []).forEach(function(venue) {
        // Get city
        var city = ((venue.address || {}).city || ''),
            mixed = getMixed(city);
        // If mixed
        if (mixed) {
          // Push
          update(venue, [venue.address.line1, mixed.line1].join(', '), mixed.city, 'mixed');
        } else {
          // Check if to fix
          var fix = toFix[city.toLowerCase()];
          // If to fix
          if (fix) {
            // Push
            update(venue, venue.address.line1, fix, 'fix');
          } else {
            // Check case
            var cased = ucfirst(venue.address.city);
            // If doesn't matchf
            if (cased !== venue.address.city) {
              // Update
              update(venue, venue.address.line1, cased, 'case');
            } else {
              // Add to unique
              if (unique.indexOf(cased) < 0) {
                // Add
                unique.push(cased);
              }
            }
          }
        }
      });

      // If to update
      if (!!toUpdate) {
        // Wait
        q.all(updated).then(function() {
          // Done
          done({
            total: venues.length,
            updated: updated.length
          });
        });
        // If not promises
      } else {
        // Sort unique
        unique.sort();
        // Sort by city
        updated.sort(function(a, b) {
          // If less than b
          if (a.city < b.city) {
            // Return -1
            return -1;
          }
          // If greater
          if (a.city > b.city) {
            // Return 1
            return 1;
          }
          // Return 0
          return 0;
        });
        // Done
        done({
          total: venues.length,
          update: updated,
          unique: unique
        });
      }
    });
  },

  translateCity: function(cityName) {
    // Languages
    var langs = ['en', 'fi', 'sv', 'de'],
        url = 'https://maps.googleapis.com/maps/api/geocode/json?address=%city%&language=%lang%&key=' + 
              // 'AIzaSyD1-fr89w8ywE1V_4SXzDnqFeDM2HjuWcs',
              'AIzaSyAD5JfBfN4WYscjEHB6C-8q88LTFwzn5JM',
        deferred = q.defer(),
        translations = [],
        langComponents = {},
        location = {};
    // Fetching translations
    console.log('Fetching translations for ' + cityName);
    // Translate
    var translate = function(city, langComponents) {
      // Lower cased
      var lcase = (city || '').toLowerCase(),
          asciid = ascii(lcase);
      // Translated
      var translated = {
        name: city,
        lcase: lcase,
        ascii: asciid,
        lang: 'en',
        translations: {},
        country: {
          code: '',
          name: '',
          translations: {}
        }
      };
      // City keys
      var cityKeys = [
        'administrative_area_level_3',
        'administrative_area_level_2',
        'administrative_area_level_1',
        'locality'
      ];
      // Legitimate key and fallback key
      var legitKey = '',
          fallbackKey = '';
      // Loop through lang components
      var loopLangComponents = function(callback) {
        // Loop through langs
        langs.forEach(function(lang) {
          // Loop through components
          (langComponents[lang] || []).forEach(function(component, key, components) {
            // Call
            var result = callback(lang, component, components);
          });
        });
      };
      // Find legit key and inject fallback
      loopLangComponents(function(lang, component, components) {
        // If there's no legitKey and long_name matches
        if (!legitKey && 
            ascii((component.long_name || '').toLowerCase()) === asciid) {
          // Use legit key
          legitKey = component.types[0] || '';
          // Set lang
          translated.lang = lang;
        }
        // Loop through cityKeys
        for (var i = 0; i < cityKeys.length; i++) {
          // If key matches
          if (component.types.indexOf(cityKeys[i]) >= 0) {
            // Found fallback
            fallbackKey = cityKeys[i];
          }
        }
        // If country
        if (component.types.indexOf('country') >= 0) {
          // If english
          if (lang === 'en') {
            // Use it
            translated.country.code = component.short_name;
            translated.country.name = component.long_name;
          }
          // Use
          translated.country.translations[lang] = component.long_name;
        }
      });
      // If there's legitKey
      if (legitKey || fallbackKey) {
        // Loop
        loopLangComponents(function(lang, component, components) {
          // Use
          if (component.types.indexOf(legitKey || fallbackKey) >= 0) {
            // Add to translated
            translated.translations[lang] = component.long_name;
          }
        });
      }
      // Return
      return translated;
    };

    // Loop through languages
    langs.forEach(function(lang) {
      // Create promise
      var translateDeferred = q.defer(),
          thisUrl = url.replace('%city%', cityName)
                       .replace('%lang%', lang);
      // Add to translations
      translations.push(translateDeferred.promise);
      // Fetching
      console.log('Fetching ' + thisUrl);
      // Fetch
      request({
        url: thisUrl,
        headers: {
          'Cache-Control': 'no-cache'
        },
        json: true
      }, function(err, response, body) {
        // Get result
        if (!err && 
            response.statusCode === 200 &&
            body.results &&
            body.results[0] &&
            body.results[0].address_components) {
          // Add to langComponents
          langComponents[lang] = body.results[0].address_components;
          // If there's no location yet
          if (_.isUndefined(location.lat)) {
            // Set it
            location = body.results[0].geometry.location || {};
          }
        } else {
          // If there's err
          console.log(cityName, lang, err, body);
        }
        // Always resolve to move next
        translateDeferred.resolve();
      });
    });
    // Next
    var next = function() {
      // Set translatedCity
      var translatedCity = translate(cityName, langComponents);
      // Set coords
      translatedCity.coordinates = location;
      // Resolve
      deferred.resolve(translatedCity);
    };
    // Wait for all
    q.all(translations).then(next, next);
    // Return the promise
    return deferred.promise;
  },

  degToRad: function(deg) {
    return deg * (Math.PI/180);
  },

  distance: function(coordsA, coordsB) {
    var R = 6371; // Radius of the earth in km
    var dLat = exports.location.degToRad(coordsB.lat-coordsA.lat); 
    var dLon = exports.location.degToRad(coordsB.lng-coordsA.lng); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(exports.location.degToRad(coordsA.lat)) * Math.cos(exports.location.degToRad(coordsB.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  },

  current: function(req, res) {
    // Done
    var done = function(city) {
      api.json(res, city || {});
    };
    var findNearestCity = function() {
      // Get coords
      var coords = (function(arrCoords) {
        // Return
        return {
          lat: arrCoords[0] || 0,
          lng: arrCoords[1] || 0
        };
      })((req.query.coords || '').split(','));
      // If there's any
      if (coords.lat && coords.lng) {
        // Find
        City.find({ }).deepPopulate(['country']).exec(function(err, cities) {
          // Set cities
          cities = cities || [];
          // Loop through cities
          cities.forEach(function(city, i) {
            // Set distance from coords
            city.distance = exports.location.distance(city.coordinates, coords);
          });
          // Sort by distance
          cities.sort(function(a, b) {
            // Return distance
            return a.distance - b.distance;
          });
          // Use first
          done(cities[0]);
        });
      } else {
        done();
      }
    };
    // If there's token
    if (false) { // req.token) {
      // Check for city
      User.findOne({ _id: req.token.user._id })
        .deepPopulate([
          'city',
            'city.country'
        ])
        .exec(function(err, user) {
          // If there's any
          if (!err && user && user.city) {
            // Done
            done(user.city);
          } else {
            findNearestCity();
          }
        });
    } else {
      findNearestCity();
    }
  },

  changeCurrent: function(req, res) {
    // Only if there's user and id
    if (req.token && req.body.id) {
      // Find user
      User.findOne({ _id: req.token.user._id }).exec(function(err, user) {
        // Set city
        user.city = req.body.id || null;
        // Save
        user.save(function(err, user) {
          // Resolve
          api.success(res, 'City successfully saved');
        });
      });
    } else {
      // Error
      api.success(res, 'Invalid token or city', true);
    }
  },

  findCity: function(name, save) {
    // Get name
    var deferred = q.defer(),
        lcase = name.toLowerCase(),
        askeed = ascii(lcase),
        error = function(message) {
          // Resolve
          deferred.resolve({
            success: false,
            error: message
          });
        },
        done = function(city) {
          // Resolve
          deferred.resolve(city || {});
        };
    // If there's nothing
    if (!lcase) {
      // Print
      error('City name is required');
    } else {
      // Check from list
      City.findOne({ ascii: askeed })
        .deepPopulate(['country'])
        .exec(function(err, city) {
          // If there's any
          if (!err && city) {
            // Print
            done(city);
          } else {
            // Translate
            exports.location.translateCity(lcase).then(function(translated) {
              // Match if name exists in translations
              var keys = Object.keys(translated.translations),
                  asciid = ascii(translated.name.toLowerCase()),
                  validCity = false;
              // Loop through keys
              for (var i = 0; i < keys.length; i++) {
                // Translation
                var translation = translated.translations[keys[i]];
                // If found
                if (asciid === ascii(translation.toLowerCase())) {
                  // Set as name
                  translated.name = translation;
                  translated.lcase = translation.toLowerCase();
                  validCity = true;
                  break;
                }
              }
              // If not valid city
              if (!validCity) {
                // Error
                error('City does not exist');
                return false;
              }

              // Check if country is supported
              Country.findOne({ code: (translated.country.code || '').toUpperCase() }).exec(function(err, country) {
                // If not found
                if (err || !country) {
                  // Error
                  error('Entered city is from a country that is currently not supported');
                } else {
                  // Set country
                  translated.country = country;
                  // Set city translations
                  translated.translations = exports.location.translationsToMongooseFormat(translated.translations);
                  // If save
                  if (!!save) {
                    // Create the City
                    (new City({
                      name: translated.name,
                      lcase: translated.lcase,
                      ascii: ascii(translated.lcase),
                      translations: translated.translations,
                      coordinates: translated.coordinates,
                      country: country._id || country.id || country
                    })).save(function(err, city) {
                      // Done
                      done(translated);
                    });
                  } else {
                    // Done
                    done(translated);
                  }
                }
              });
            });
          }
        });
    }
    // Return promise
    return deferred.promise;
  },

  // Find a city
  city: function(req, res) {
    // Find city
    exports.location.findCity(req.query.name || '').then(function(result) {
      // Print
      api.json(res, result || {});
    });
  },

  cities: function(req, res) {
    // Set default limit
    req.query.limit = req.query.limit || 50;
    // Execute
    api.find(res, City, null, null, req.query, [
      'country'
    ]);
  },

  refreshCities: function(req, res) {
    // Find cities
    City.find({ }).exec(function(err, cities) {
      // Promises
      var promises = [];
      // Loop through cities
      (cities || []).forEach(function(city) {
        // Create promise
        var deferred = q.defer();
        // Add to promises
        promises.push(deferred.promise);
        // Update
        city.ascii = exports.location.ascii(city.lcase);
        // Save
        city.save(function(err, refreshedCity) {
          // Resolve
          deferred.resolve(refreshedCity || null);
        });
      });
      // Wait
      q.all(promises).then(function() {
        // Done
        api.success(res, 'Cities successfully refreshed');
      });
    });
  },

  countries: function(req, res) {
    // Search
    var filters = {};
    // If there's q
    if (req.query.q) {
      // search
      var search = new RegExp(req.query.q, 'i');
      // Set filters
      filters = {
        name: search
      };
    }
    // Execute
    api.find(res, Country, filters, null, req.query);
  },

  /**
   * Update city lang
   */
  lang: function(req, res) {
    // Done
    var done = function() {
      api.json(res, {
        message: 'Completed lang updates'
      });
    };
    // Get cities
    City.find({ }).deepPopulate(['country']).exec(function(err, cities) {
      // If there are cities
      if (!err && cities && cities.length) {
        // Loop through cities
        help.series(cities, function(city) {
          // Create promise
          var deferredCity = q.defer();
          // Find venues
          Venue.find({
            'address.city': city.name
          }).exec(function(err, venues) {
            // Done
            var doneVenue = function() {
              // Updated
              console.log('Updated ' + venues.length + ' venue/s with city ' + city.name);
              // Done
              deferredCity.resolve(venues);
            };
            // Loop through venues
            if (!err && venues && venues.length) {
              // Use series
              help.series(venues, function(venue) {
                // Create promise
                var deferredVenue = q.defer();
                // Update
                console.log('Updating ' + venue.name + '..');
                // Update
                venue.address.lang = city.lang;
                venue.address.country = city.country._id || city.country.id || null;

                venue.save(function(err, venue) {
                  // Save
                  console.log('Updated address for ' + venue.name);
                  deferredVenue.resolve(venue);
                });

                // Return the promise
                return deferredVenue.promise;
              }, function(next) {
                // Move next
                console.log('Updating next..');
                next();
                // Resolve
              }).then(doneVenue, doneVenue);
            } else {
              // Move next
              doneVenue(null);
            }
          });
          // Return promise
          return deferredCity.promise;
          // Next
        }, function(next) {
          // Move next
          next();
          // Complete
        }).then(done, done);
      } else {
        // Done
        done();
      }
    });
  },

  // Translations
  translations: function(req, res) {
    // Loop through
    var Model = (req.query.model === 'country') ? Country : City,
        all = [];
    // Find
    Model.find({ }).exec(function(err, models) {
      // Loop
      (models || []).forEach(function(model) {
        // Trans
        var trans = {};
        // Loop through trans
        model.translations.forEach(function(t) {
          // Set
          trans[t.lang] = t.value;
        });
        // Add
        all.push(trans);
      });
      // Print
      api.json(res, all);
    });
  }

};

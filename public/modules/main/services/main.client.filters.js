'use strict';

// Plain to HTML filter
angular.module('main').filter('plainToHtml', ['$sce', function($sce) {
  // Return function
  return function(input) {
    // If not set
    if (!input) return '';
    // Html
    var arrHtml = [];
    // Split by lines
    var lines = input.split('\n');
    // Loop through lines
    for (var i in lines) {
      // Trim first
      var line = lines[i].trim();
      // If there's any
      if (line) {
        // Replace
        line = line.replace(/(http|ftp|https):\/\/([\w\-_]+(?:(?:\.[\w\-_]+)+))([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g, function(e) {
          // Find first ://
          var find = e.indexOf('://');
          return '<a href="'+e+'" target="_blank">'+e.substr(find+3)+'</a>';
        });
        // Push to arrHtml
        arrHtml.push(line);
      } else {
        arrHtml.push('');
      }
    }
    // Return
    return $sce.trustAsHtml('<p>' + arrHtml.join('<br />') + '</p>');
  };
}]);
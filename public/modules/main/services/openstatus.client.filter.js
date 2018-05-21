'use strict';

angular.module('main').filter('openstatus', ['moment', '$window', '$filter', function(moment, $window, $filter) {

  return function(input) {

    if (input && input.openByAppointment) {
      // Return
      return 'Open by appointment only';
    }

    var combineRange = function(start, end) {
      // Convert to int
      start = parseInt(start);
      end = parseInt(end);
      // Has minutes
      var hasMins = true; //(start % 100) || (end % 100);

      // If there are minutes
      //if (hasMins) {
        // Use full hour format
      var result = $filter('time')(start + '') + ' to ' + $filter('time')(end + '');
      //} else {
        // Use short hour
      //  result = (start / 100) + ' to ' + (end / 100);
      //}
      
      // Return
      return result;
    };

    var combineHours = function(hours) {
      // All
      var allHours = [];
      // Loop through ours
      for (var k in hours) {
        // If there's no range
        if (!hours[k].start || !hours[k].end) {
          // Skip
          continue;
        }
        // Push
        allHours.push('from ' + combineRange(hours[k].start, hours[k].end));
      }
      var label = '';
      // Loop through all hours
      for (var l in allHours) {
        l = parseInt(l);
        if (l > 0) {
          // Append
          label += ((allHours.length > 2) ? ', ' : ' ');
          // If last
          if (l === allHours.length - 1) {
            label += 'and ';
          }
        }
        label += allHours[l];
      }
      // Return
      return label;
    };

    // Get today
    var today = moment(), weekday = today.isoWeekday() - 1;
    // Check for special hours
    // If there are special hours
    if (input.specialHours) {
      for (var i in input.specialHours) {
        // Get specialHour
        var specialHour = input.specialHours[i];
        // If there's nothing
        if (!specialHour.startHour || !specialHour.endHour) {
          // Skip
          continue;
        }
        // Get date
        if (moment(specialHour.date, 'DD.MM.YYYY').format('YYYYMMDD') === today.format('YYYYMMDD')) {
          // Check for opens
          return 'Open today on special hours from ' + combineRange(specialHour.startHour, specialHour.endHour);
        }
      }
    }
    // Check for opening hours
    if (input.openingHours) {
      for (var j in input.openingHours) {
        // Get
        var openingHour = input.openingHours[j];
        // If day matches
        if (openingHour.day === weekday) {
          // Combine
          var combine = combineHours(openingHour.hours);
          // If there's nothing, skip
          if (!combine) {
            continue;
          }
          // There's match
          return 'Open today ' + combine;
        }
      }
    }
    // Closed
    return 'Closed today';
  };
}]);
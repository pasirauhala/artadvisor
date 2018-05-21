'use strict';

angular.module('main').filter('openinghours', ['moment', '$window', '$filter', function(moment, $window, $filter) {

  return function(input) {
    
    // If openByAppointment
    if (input && input.openByAppointment) {
      return 'Open by appointment only';
    }

    if (input && input.openingHours) {
      input = input.openingHours;
    }

    // If there's nothing
    if (!input || !input.length) {
      // Return nothing
      return '';
    }

    // Get current date
    var current = moment();
    // Current day
    var day = current.isoWeekday() - 1;

    // Days
    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    var openingHours = {};

    var combineHours = function(start, end) {
      // Convert to int
      start = parseInt(start);
      end = parseInt(end);
      // Has minutes
      var hasMins = (start % 100) || (end % 100);
      // If there are minutes
      if (hasMins) {
        // Use full hour format
        return $filter('time')(start + '') + ' - ' + $filter('time')(end + '');
      } else {
        // Use short hour
        return (start / 100) + ' - ' + (end / 100);
      }
    };

    // Loop
    for (var i in input) {
      // Get weekday
      var weekday = weekdays[input[i].day];
      // If not set
      if (typeof openingHours[weekday] === 'undefined') {
        // Set it
        openingHours[weekday] = {
          day: weekday,
          ranges: []
        };
      }
      // If there are hours
      if (input[i].hours) {
        // Loop through hours
        for (var j in input[i].hours) {
          // Get range
          var range = input[i].hours[j];
          // If there's no start or end
          if (!range.start || !range.end) {
            // Skip
            continue;
          }
          // Push
          openingHours[weekday].ranges.push(combineHours(range.start, range.end));
        }
      }
    }

    var getLabel = function(ranges) {
      // Return
      return ranges.length ? ranges.join(', ') : 'closed';
    };

    // Week order
    var weekOrder = [];
    // Loop
    for (var k in weekdays) {
      var wkday = openingHours[weekdays[k]];
      // Set schedule
      wkday.schedule = getLabel(wkday.ranges);
      weekOrder.push(wkday);
    }

    var finalDays = [], startDay = weekOrder[0], endDay = weekOrder[0];

    var combineRange = function() {
      if (startDay.day !== endDay.day) {
        // Multiple
        return startDay.day.substr(0, 3) + ' - ' + endDay.day.substr(0, 3) + ' ' + startDay.schedule;
      } else {
        // Return single
        return startDay.day + 's ' + startDay.schedule;
      }
    };

    // Loop through order
    for (var l = 1; l < weekOrder.length; l++) {
      // This day
      var thisDay = weekOrder[l];
      // If this day doesn't match start day
      if (thisDay.schedule !== startDay.schedule) {
        // Combine
        finalDays.push(combineRange());
        // Set this day as start
        startDay = thisDay;
      }
      // Set end
      endDay = thisDay;
      if (l === weekOrder.length - 1) {
        // Push
        finalDays.push(combineRange());
      }
    }
    // Return
    return finalDays.join(', ');
  };

}]);
'use strict';

/**
 * Dynamic calendar
 * Fully customizable calendar utilizing moment.js
 * @author Ronald Borla
 */

// Calendar directive
angular.module('main').directive('calendar', ['moment', function(moment) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {
    // Weekdays
    var weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Constants
    var DEFAULT_START_OF_WEEK = 1;

    // Set parent
    $scope.parent = $scope.$parent;

    // Get start of week
    var getStartOfWeek = function(startOfWeek) {
      for (var i in weekdays) {
        // Parse i
        i = parseInt(i);
        // Check
        if (parseInt(startOfWeek) === (i + 1) ||
            weekdays[i].toLowerCase().indexOf(startOfWeek) === 0) {
          // Return
          return (i + 1);
        }
      }
      // 1 is default for Monday
      return DEFAULT_START_OF_WEEK;
    };

    // Options
    var options = {
      startOfWeek: getStartOfWeek($attr.startOfWeek || DEFAULT_START_OF_WEEK)
    };

    // Set month
    $scope.month = $attr.month ? moment($attr.month + '-01') : moment();

    // Set weekdays
    $scope.weekdays = [];

    // Initialize weekdays
    (function initializeWeekdays() {
      // Weekday count
      var weekdaysCount = weekdays.length, weekStart = options.startOfWeek;
      // Loop
      while (weekdaysCount > 0) {
        // Add to weekdays
        $scope.weekdays.push(moment().isoWeekday(weekStart));
        // Increment weekStart
        weekStart++;
        // If exceed length
        if (weekStart > weekdays.length) {
          // Reset to 1
          weekStart = 1;
        }
        weekdaysCount--;
      }
    })();

    // Monthdays
    var monthDays = $scope.month.daysInMonth();
    // Get start of month
    var startOfMonth = $scope.month.clone().startOf('month');
    // First weekday of the month
    var firstWeekday = startOfMonth.isoWeekday();

    // Reorder week according to startOfWeek
    var weekOrder = [], weekCounter = weekdays.length;
    while (weekCounter > 0) {
      // Correct weekday
      var correctWeekday = options.startOfWeek + (weekdays.length - weekCounter);
      // If correct weekday exceeds length
      if (correctWeekday > weekdays.length) {
        // Reduce by difference
        correctWeekday = correctWeekday - weekdays.length;
      }
      // Push
      weekOrder.push(correctWeekday);
      weekCounter--;
    }

    $scope.alert = function(obj) {
      console.log(obj);
    };

    // Weeks
    $scope.weeks = [];

    // Day counter
    var dayCounter = 0;

    // Is active
    $scope.isActive = function(date) {
      // Match
      return (date && $scope.date) ? (date.format('YYYY-MM-DD') === $scope.date.format('YYYY-MM-DD')) : false;
    };

    // Fill
    var fill = true;

    // While true
    while (fill) {
      // Set days
      var days = [];
      // Loop through weekorder
      for (var k in weekOrder) {
        // Check if next day matches current week
        if (((dayCounter > 0) || (firstWeekday === weekOrder[k])) && fill) {
          // Clone
          var date = startOfMonth.clone().add(dayCounter, 'days');
          // Add date
          days.push(date);
          // Increment dayCounter
          dayCounter++;
          // If exceeds
          if (dayCounter >= monthDays) {
            // Remove fill
            fill = false;
          }
        } else {
          // Add null to days
          days.push(null);
        }
      }
      // Add to weeks
      $scope.weeks.push(days);

      // console.log(days);
    }

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };
  // Return directive
  return {
    link: link,
    scope: {
      date: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
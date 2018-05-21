'use strict';

/**
 * Comments directive for Art Advisor
 * @author Ronald Borla
 */

// Comments directive
angular.module('main').directive('comments', ['API', '$window', 'Authentication', '$state', function(API, $window, Authentication, $state) {
  /**
   * Use link
   */
  var link = function($scope, $element, $attr, $controller, $transclude) {
    // All comments
    $scope.comments = [];
    // Set count
    $scope.count = 0;

    $scope.query = {
      start: $attr.start || 0,
      limit: $attr.limit || 5,
      earliest: null
    };

    $scope.last = false;

    // Reset
    $scope.reset = function() {
      // Reset comments
      $scope.comments = [];
      // Set start
      $scope.query.start = $attr.start || 0;
      // Return scope
      return $scope;
    };

    var $thisScope = $scope;

    // Push comment
    $scope.pushComment = function(comment, first) {
      // To comments
      if (!!first) {
        $scope.comments.unshift(comment);
        // Set as earliest
        $scope.query.earliest = comment.created || null;
      } else {
        $scope.comments.push(comment);
      }
      // Increment start
      $scope.query.start++;
    };

    $scope.busy = false;

    // Load comments
    $scope.load = function() {
      // If busy
      if ($scope.busy) {
        return false;
      }
      $scope.busy = true;
      // Do load
      API.get($scope.source, $scope.query).then(function(response) {

        $scope.last = !!response.data.last;

        // Set count
        $scope.count = response.data.count;
        // If there's data
        if (response.data.data) {
          // Push
          for (var i in response.data.data) {
            // Push comment
            $scope.pushComment(response.data.data[i], true);
          }
        }
        $scope.busy = false;
      });
      // Return scope
      return $scope;
    };

    // Submit comment
    $scope.submit = function() {
      // If busy
      if ($scope.busy || !angular.element.trim($scope.content)) {
        return false;
      }
      $scope.busy = true;
      // Post
      API.post($scope.source, { content: $scope.content }).then(function(response) {
        // Push comment
        $scope.pushComment(response.data);
        $scope.count++;
        $scope.busy = false;

        $scope.content = '';
      });
    };

    // Can delete
    $scope.canRemove = function(comment) {
      // Return
      return Authentication.token &&
            ((comment.owner === Authentication.user._id || comment.owner._id === Authentication.user._id) ||
             $window.admin ||
             ($scope.owners && ($scope.owners.indexOf(Authentication.user._id) >= 0)));
    };

    // Delete comment
    $scope.remove = function(comment) {
      // Sure
      if (!confirm('Are you sure you want to remove this comment?\n\nPress OK to proceed')) {
        return false;
      }
      // Delete by using source
      API.delete($scope.source + '/' + comment._id).then(function(response) {
        // Found
        var index = '';
        // Loop through comments
        for (var i in $scope.comments) {
          // If found
          if ($scope.comments[i]._id === comment._id) {
            // Found
            index = i;
            break;
          }
        }
        // Remove
        $scope.comments.splice(index, 1);
      });
    };

    // Artist page
    $scope.artistPage = function(comment, defaultPage) {
      // If not artist
      if (!comment.owner.isArtist) {
        // Return defaultPage
        return defaultPage || '';
      }
      // Return state
      return $state.href('artist', { username: comment.owner.username });
    };

    // Owner name
    $scope.ownerName = function(comment) {
      // Return
      return comment.owner.name.full;
    };

    // Watch for commentSource
    $scope.$watch('source', function(current, prev) {
      if (current !== prev) {
        // Do load
        $scope.reset().load();
      }
    });

    if ($scope.source) {
      // Load
      $scope.reset().load();
    }

    $transclude($scope, function(clone, scope) {
      $element.append(clone);
    });
  };
  // Return directive
  return {
    link: link,
    scope: {
      source: '=',
      owners: '='
    },
    restrict: 'E',
    transclude: true
  };
}]);
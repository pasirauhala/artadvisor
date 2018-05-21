'use strict';

angular.module('main').controller('ArtViewController', ArtViewController);

ArtViewController.$inject = [
	'$scope',
	'$resource',
	'$document',
	'API',
	'$window',
	'$timeout'
];

function ArtViewController($scope, $resource, $document, API, $window, $timeout) {
  // This provides Authentication context.
  //$scope.authentication = Authentication;

  $scope.arts = [];
  $scope.current = 0;
  $scope.limit = 12;

  var adjustModalPosition = function() {
    // Get wrap
    var wrap = angular.element('#modal .wrap:first');
    // Get window and wrap height
    var winHeight = angular.element($window).height(),
        wrapHeight = wrap.height();
    // Set top
    wrap.css('top', ((winHeight / 2) - (wrapHeight / 2)) + 'px');
  };

  $scope.modal = {
    show: false,
    open: function() {

      angular.element('body').addClass('enclosed');
      this.show = true;

      $timeout(function() {
        adjustModalPosition();
      }, 50);
    },
    close: function() {

      angular.element('body').removeClass('enclosed');
      this.show = false;
    },
    toggle: function() {
      return this.show ? this.close() : this.open();
    }
  };

  $scope.$on('$destroy', function() {
    // console.log('Destroyed!');
    $scope.modal.close();
  });

  $scope.preview = {
    index: 0,
    art: null,
    show: function(index) {
      // If there's nothing
      if (!$scope.arts.length) {
        return false;
      }
      if (!$scope.arts[index]) {
        return false;
      }
      // Get art
      this.art = $scope.arts[index];

      // elem
      var elem = angular.element('#preview');
      elem.addClass('show');

      if ($scope.initialized) {
        $scope.modal.open();
      }

      this.index = index;
      // $document.scrollTo(elem, 20, 400);
    },
    previous: function() {
      this.show(this.index - 1);
    },
    next: function() {
      this.show(this.index + 1);
    }
  };

  $scope.initialized = false;
  $scope.initialize = function() {
    $scope.preview.show(0);
    $scope.initialized = true;
  };

  $scope.ended = false;

  // Loaded
  $scope.loaded = [];

  var getLoadedArtsIds = function() {
    // Ids
    var ids = [];
    // Loop through arts
    ($scope.arts || []).forEach(function(art) {
      // Get id
      ids.push(art.photo.photo.id);
    });
    // Return
    return ids;
  };

  // Find photo in gallery
  var findPhotoInGallery = function(gallery, photo) {
    // Find in gallery
    for (var k in gallery.photos) {
      if (gallery.photos[k].photo === photo.id) {
        // Set photo
        gallery.photos[k].photo = photo;
        // Return
        return gallery.photos[k];
      }
    }
    return null;
  };

  // Populate
  $scope.loadArts = function(done) {

    // If already in loaded
    if ($scope.loaded.indexOf($scope.current) >= 0) {
      // Return
      return false;
    }

    // Add to loaded
    $scope.loaded.push($scope.current);

    // if ($scope.initialized) return false;
    // Use POST API
    API.post('galleries', {
      start: $scope.current,
      limit: $scope.limit,
      exclude: getLoadedArtsIds().join(',')
    }).then(function(response) {

      // If there's any
      var photos = response.data.data;

      if (!photos || !photos.length) {
        $scope.ended = true;
      }

      if (photos.length) {
        for (var i in photos) {
          // Photo
          var photo = photos[i];
          var thePhoto = findPhotoInGallery(photo.gallery, photo);

          if (thePhoto) {
            // Add to arts
            $scope.arts.push({
              exhibition: photo.gallery.exhibition,
              photo: thePhoto
            });
          }
        }
      }
      if (!$scope.initialized) {
        $scope.initialize();
      }
      $scope.current += $scope.limit;
      $scope.limit = 6;
      if (done) done();
    });
  };

  angular.element($window).on('resize', function() {
    adjustModalPosition();
  });

  $scope.brickHeight = function(image) {
    // Set width
    var width = 0;
    // Get device
    switch (device) {
      case 'extraLargeDesktop': width = 304; break;
      case 'largeDesktop': width = 263.993; break;
      case 'desktop': width = 202; break;
      case 'tablet': width = 162.5; break;
      case 'mobile': width = 91.3125; break;
    }
    // Get image ratio
    var ratio = image.width / image.height;
    // Return height
    return width / ratio;
  };

  $scope.reconstruct = function() {
    $timeout(function() {
      $scope.arts = angular.copy($scope.arts);
    }, 1);
  };

  $scope.$on('deviceChanged', function() {
    $scope.reconstruct();
  });

  // $scope.reconstruct();
}

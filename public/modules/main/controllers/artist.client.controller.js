'use strict';

angular.module('main').controller('ArtistController', ArtistController);

ArtistController.$inject = [
	'$rootScope',
	'$scope',
	'$resource',
	'$state',
	'$timeout',
	'API',
	'Authentication',
	'Upload',
	'moment'
];

function ArtistController($rootScope, $scope, $resource, $state, $timeout, API, Authentication, Upload, moment) {
  // This provides Authentication context.
  $scope.auth = Authentication;

  $scope.owner = function() {
    return ($scope.auth && $scope.auth.user && $scope.auth.user._id &&
            $scope.artist && $scope.artist.id && ($scope.auth.user._id === $scope.artist.id));
  };

  // Photos
  $scope.photos = [];

  var uploadCounter = $scope.photos.length;

  $scope.upload = function(files) {
    // Loop
    for (var i in files) {
      var file = files[i];

      uploadCounter++;
      // Set id
      file.uploadId = uploadCounter;

      // Append to photos
      $scope.photos.unshift({
        id: uploadCounter,
        loading: true,
        full: '',
        source: ''
      });

      /* jshint ignore:start */
      // Do upload
      Upload.upload({
        url: '/api/upload',
        fields: { },
        file: file
      }).progress(function(evt) {

      }).success(function(data, status, headers, config) {

        // If success
        if (data.success) {
          // Save photo
          API.post('/me/photo', { source: data.file.full }).then(function(response) {
            // Get the last loading photo
            var lastLoading = -1;

            for (var h in $scope.photos) {
              // If loading
              if ($scope.photos[h].loading) {
                // Set as last
                lastLoading = h;
              } else {
                // Break
                break;
              }
            }

            // If there's any
            if (lastLoading >= 0) {
              // If there's data
              if (response.data && response.data._id) {
                // Change
                $scope.photos[lastLoading] = response.data;
              } else {
                // Error
                // Remove first
                $scope.photos.splice(0, 1);
              }
            }
          });
        } else {
          // Remove first
          $scope.photos.splice(0, 1);
        }

      });
      /* jshint ignore:end */
    }
  };

  // Remove photo
  $scope.removePhoto = function(photo) {
    // Are you sure
    if (confirm('Are you sure you want to remove this photo? Press OK to continue')) {
      // Remove
      API.delete('me/photo/' + (photo._id || photo.id)).then(function(response) {
        // If success
        if (response.data && response.data.success) {
          // Remove
          for (var i in $scope.photos) {
            // If match
            if ($scope.photos[i].id === photo.id) {
              // Remove
              $scope.photos.splice(i, 1);
              break;
            }
          }
        }
      });
    }
  };

  $scope.photo = null;

  // Edit photo
  $scope.editPhoto = function(photo) {
    // Set photo
    $scope.photo = photo;
    // Watch
    $scope.artists.watchPhoto();
  };

  // The artist
  $scope.artists = {
    /**
     * Load artists
     */
    load: function(query) {
      // Get artists with query
      return API.get('artists', {
        q: query,
        'return': 'data'
      });
    },
    /**
     * Tag counter
     */
    tagCounter: 0,
    /**
     * Tag added
     */
    added: function(tag) {
      // Increment
      $scope.artists.tagCounter++;
      // Set id if there's none
      if (!tag._id) {
        tag._id = $scope.artists.tagCounter;
        tag.guest = true;
      }
    },
    // Get ids
    getIds: function() {
      var ids = [];
      // Loop through artsits
      if ($scope.photo.artists && $scope.photo.artists.length) {
        for  (var i in $scope.photo.artists) {
          // Add to ids
          ids.push($scope.photo.artists[i].id);
        }
      }
      // Return ids
      return ids;
    },
    save: function() {
      // If there's delay
      if ($scope.artists.delay) {
        // Cancel
        $timeout.cancel($scope.artists.delay);
      }
      // Set timeout
      $scope.artists.delay = $timeout(function() {
        // Save photo
        API.put('me/photo/' + $scope.photo.id, {
          title: $scope.photo.title,
          artists: $scope.artists.getIds()
        }).then(function(response) {

        });
      }, 1000); // 1 second delay
    },
    watcher: [],
    delay: null,
    watchPhoto: function() {
      // If there's watcher
      if ($scope.artists.watcher.length) {
        // call
        $scope.artists.watcher[0]();
        $scope.artists.watcher[1]();
        // Remove
        $scope.artists.watcher = [];
      }
      // Do watch
      $scope.artists.watcher.push($scope.$watchCollection('photo.artists', function(current, prev) {
        // Make sure the length doesn't match
        if (current && prev && current.length !== prev.length) {
          // Save
          $scope.artists.save();
        }
      }));
      $scope.artists.watcher.push($scope.$watch('photo.title', function(current, prev) {
        // Make sure not the same
        if (current !== prev) {
          // save
          $scope.artists.save();
        }
      }));
    }
  };

  // Set comment source
  $scope.commentSource = '';

  $scope.modal = {
    id: null,
    index: 'id',
    items: [],
    set: function(items, index, id) {
      $timeout(function() {
        $scope.modal.items = items;
        $scope.modal.index = index;
        $scope.modal.id = id;
      }, 1);
    }
  };

  $scope.share = {
    active: false,
    show: function() {
      $scope.share.active = true;


    }
  };

  $scope.menu = {
    back: function() {
    	return /*$rootScope.previousState ? $state.go($rootScope.previousState) :*/ $state.go('landing-now');
    },
    others: function() {
      // Go to report page
      $state.go('report', { url: $state.href($state.current.name, $state.params) });
    },
    recommended: false,
    favorited: false,
    recommend: function() {
      // Set endpoint
      var endpoint = 'artists/' + $state.params.username + '/recommend';
      // Action
      var action = $scope.menu.recommended ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          $scope.menu.recommended = !$scope.menu.recommended;
        }
      });
    },
    favorite: function() {
      // Set endpoint
      var endpoint = 'artists/' + $state.params.username + '/favorite';
      // Action
      var action = $scope.menu.favorited ? API.delete(endpoint) : API.post(endpoint);
      // After action
      action.then(function(response) {
        // If success
        if (response.data.success) {
          $scope.menu.favorited = !$scope.menu.favorited;
        }
      });
    },
    share: function() {

    },
    map: function() {
      // Go to map page
      $state.go('map');
    }
  };

  // Set artist
  $scope.artist = {};

  $scope.touch = new Touch();

  $scope.showAll = false;
  $scope.showExhibition = function($index) {
    // Convert
    $scope.artist.exhibitions[$index].active = !!$scope.artist.exhibitions[$index].active;
    // Check if active
    return ($scope.artist.exhibitions[$index].active !== $scope.showAll);
  };

  // Load
  $scope.loadArtist = function(done) {
    // Get
    API.get('artists/' + $state.params.username).then(function(response) {
      // Set data
      var data = response.data;

      // If there's no id
      if (!data._id || !data.id) {
        // Redirect
        $state.go('404');
        return false;
      }

      // Set favorite
      $scope.menu.favorited = data.favorite;
      // Set recommended
      $scope.menu.recommended = data.recommend;

      // Change comment source
      $scope.commentSource = 'artists/' + data.username + '/comments';

      // Set photos
      $scope.photos = (data.album && data.album.photos) ? data.album.photos : [];
      // Sort photos
      $scope.photos.sort(function(a, b) {
        // Return
        return moment(b.created).isAfter(a.created) ? 1 : -1;
      });

      // Set artist
      $scope.artist = {
        id: data._id || data.id || null,
        name: data.name,
        photo: data.photo || null,
        description: data.description,
        websites: data.websites,

        links: data.links,
        publications: [
          /*
          {
            publisher: 'Helsingin Sanomat',
            authors: ['Timo Valjakka'],
            date: '2014-05-20'
          },
          {
            publisher: 'Edit Media',
            authors: ['Pekka Putkonen'],
            date: '2015-05-25'
          }
          */
        ],

        genres: data.genres,

        // Exhibitions
        exhibitions: data.exhibitions,

        feedback: [
          {
            date: '2015-01-08',
            content: 'Review of the present exhibition at HBL: http://www.hbl.fi/128449032875',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          },
          {
            date: '2015-01-01',
            content: 'Hevoset Taskussa opening event today at 5pm, welcome!',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          },
          {
            date: '2014-12-21',
            content: 'Forum Box was listed as Editor’s Choice venue at  Visit Finland art section. http://www.visitfinland.fi/art/forumbox ',
            author: {
              name: 'Forum Box',
              website: 'http://forum-box.com'
            }
          }
        ]
      };

      /*
      // If there are no images
      if (!$scope.photos.length && !$scope.owner()) {
        // Error
        $state.go('404');
        return false;
      }
      */

    }).catch(function(a, b, c, d) {

      console.log('Error caught');
      console.log(a);
      console.log(b);
      console.log(c);
      console.log(d);

      // Error
      $state.go('404');
    });
  };

  // Load artist
  $scope.loadArtist();
}

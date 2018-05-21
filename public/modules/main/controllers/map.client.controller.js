'use strict';

angular.module('main').controller('MapController', ['$location', '$scope', '$state', 'API', 'MapOptions', 'uiGmapGoogleMapApi', '$timeout', '$window', '$element', 'location', '$q',
  function($location, $scope, $state, API, MapOptions, uiGmapGoogleMapApi, $timeout, $window, $element, location, $q) {

  // Venue types
  $scope.venueTypes = {
    gallery: 'gallery',
    museum: 'museum',
    'public': 'public space',
    other: 'other'
  };

  // Load highlight
  var highlight = null, 
      focusEvent = $location.search().event || '',
      focusVenue = $location.search().venue || '',
      hasFocus = focusEvent || focusVenue;

  /**
   * Overrides Google marker adding label
   */
  var addLabelToMarkers = function(maps, className) {

    maps.Marker.prototype.setLabel = function(label){
      this.label = new MarkerLabel({
        map: this.map,
        marker: this,
        text: label,
        position: this.get('position')
      });
      // Bind position
      maps.event.addListener(this, 'position_changed', function() {
        this.label.set('position', this.get('position'));
      });
    };

    var MarkerLabel = function(options) {
      this.setValues(options);
      this.element = document.createElement('span');
      this.element.className = className;
    };

    MarkerLabel.prototype = angular.element.extend(maps.OverlayView.prototype, {
      onAdd: function() {        
        this.getPanes().overlayImage.appendChild(this.element);
        var self = this;

        maps.event.addListener(this, 'position_changed', function() {
          self.draw();
        });

        // Draw initially
        this.draw();
        // console.log(this);
      },
      draw: function() {
        var text = String(this.get('text'));
        var position = this.getProjection().fromLatLngToDivPixel(this.get('position'));
        var elem = angular.element(this.element);
        // Set style
        elem.html(text).css({
          left: (position.x - (elem.width() / 2)) + 'px',
          top: position.y + 'px'
        });
      }
    });

  };

  $scope.close = function() {
    if ($window.history.length) {
      $window.history.back();
    } else {
      $state.go('landing-now');
    }
  };

  // User's location
  $scope.location = {
    coordinates: null,
    set: function(lat, lng) {
      $scope.location.coordinates = {
        latitude: lat,
        longitude: lng
      };
    }
  };

  // Promises
  var promises = [location.promise, uiGmapGoogleMapApi], focusDeferred = $q.defer();

  // If there's event or venue
  if (hasFocus) {
    // Create new promise
    promises.push(focusDeferred.promise);
  }

  $q.all(promises).then(function() {
    // Position
    var position = new $scope.map.maps.LatLng(location.current.latitude,
                                              location.current.longitude);
    // Set location
    $scope.location.set(location.current.latitude, location.current.longitude);
    // Create marker
    var marker = new $scope.map.maps.Marker({
      position: position, 
      icon: $window.location.origin + root + '/images/marker.png'
    });
    // Add marker
    marker.setMap($scope.map.gmap);

    // If there's highlight
    if (highlight) {
      // Position
      position = new $scope.map.maps.LatLng(highlight.venue.address.coordinates.latitude,
                                            highlight.venue.address.coordinates.longitude);
    }

    // Set center
    $scope.map.gmap.setCenter(position);

    // Initialize directions
    $scope.directions.init();
  });

  $scope.directions = {
    display: null,
    service: null,
    init: function() {
      // Create
      $scope.directions.display = new $scope.map.maps.DirectionsRenderer();
      $scope.directions.service = new $scope.map.maps.DirectionsService();
      // Set map
      $scope.directions.display.setMap($scope.map.gmap);
    },
    request: function(target) {

      if (!$scope.directions.service) {
        return false;
      }

      $scope.directions.service.route({
        origin: new $scope.map.maps.LatLng($scope.location.coordinates.latitude, $scope.location.coordinates.longitude),
        destination: new $scope.map.maps.LatLng(target.latitude, target.longitude),
        travelMode: $scope.map.maps.TravelMode.DRIVING
      }, function(response, status) {

        if (status === $scope.map.maps.DirectionsStatus.OK) {
          $scope.directions.display.setDirections(response);
        }

      });
    }
  };

  $scope.preview = {
    marker: null,
    element: angular.element($element).find('.preview:first'),
    photo: null,
    count: 0,
    current: 0,
    select: function(again) {
      // Set the marker
      var marker = $scope.preview.marker, theName = '';

      if (focusVenue) {
        // Set venue
        var venue = $scope.preview.marker.venue;
        // focusVenue
        $scope.preview.focusVenue = true;
        // Set venue
        $scope.preview.venue = venue;
        $scope.preview.description = venue.description;
        theName = venue.name;
        // If there's photo
        if (venue && venue.album && venue.album.photos && venue.album.photos[0]) {
          // Set it
          $scope.preview.photo = venue.album.photos[0];
        } else {
          // Set empty
          $scope.preview.photo = null;
        }
        // Set distance
        $scope.preview.distance = function() {
          var dist = $scope.preview.marker.distance();
          // If distance is more than 1km
          if (dist >= 1) {
            dist = dist.toFixed(2) + 'km';
          } else {
            dist = Math.floor(dist * 1000) + 'm';
          }
          return dist;
        };
      } else {
        // Exhibition
        var exhibition = $scope.preview.marker.exhibitions[$scope.preview.current];
        // Set properties
        // Set photo
        $scope.preview.photo = (exhibition.gallery && exhibition.gallery.photos && exhibition.gallery.photos[0]) ?
          (root + exhibition.gallery.photos[0].photo.source) : null;
        $scope.preview.name = exhibition.name;
        $scope.preview.permalink = exhibition.permalink;

        // Get artists
        var artists = [];
        for (var i in exhibition.artists) {
          if (exhibition.artists[i]) {
            if (exhibition.artists[i].user && exhibition.artists[i].user.fullname) {
              artists.push(exhibition.artists[i].user.fullname);
            } else if (exhibition.artists[i].nonUser && exhibition.artists[i].nonUser.fullname) {
              artists.push(exhibition.artists[i].nonUser.fullname);
            }
          }
        }

        $scope.preview.artists = artists.join(', ');
        $scope.preview.venue = $scope.preview.marker.venue.name;
        $scope.preview.venuePermalink = $scope.preview.marker.venue.permalink;
        $scope.preview.distance = function() {
          var dist = $scope.preview.marker.distance();
          // If distance is more than 1km
          if (dist >= 1) {
            dist = dist.toFixed(2) + 'km';
          } else {
            dist = Math.floor(dist * 1000) + 'm';
          }
          return dist;
        };
        $scope.preview.venueType = $scope.preview.marker.venue.venueType;
        $scope.preview.venueTypes = $scope.preview.marker.venue.venueTypes;

        if (!$scope.preview.venueTypes.length) {
          $scope.preview.venueTypes = [$scope.preview.venueType];
        }

        $scope.preview.start = exhibition.startDate;
        $scope.preview.end = exhibition.endDate;
        $scope.preview.description = exhibition.description;

        if (exhibition.status === 'open' && marker.status !== 'special') {
          // Set marker as open
          marker.status = 'open';
        }
        if (exhibition.status === 'special') {
          // Set marker as open
          marker.status = 'special';
        }

        theName = exhibition.name;
      }

      // Show again
      $scope.preview.element.addClass('show');
      // Set status
      $scope.map.setMarkerStatus(marker, true);
      angular.element(marker.label.element)
        .removeClass('hide')
        .text(theName);
        
      // Request directions
      // $scope.directions.request(exhibition.venue.address.coordinates);
    },
    prev: function() {
      $scope.preview.current--;
      if ($scope.preview.current < 0) {
        $scope.preview.current = $scope.preview.count - 1;
      }
      $scope.preview.select();
    },
    next: function() {
      $scope.preview.current++;
      if ($scope.preview.current >= $scope.preview.count) {
        $scope.preview.current = 0;
      }
      $scope.preview.select();
    },
    // Active coords
    activeCoords: function() {
      // Return
      return $scope.preview.marker.venue.address.coordinates;
    },
    // Active LatLng
    activeLatLng: function() {
      // Get coords
      var coords = $scope.preview.activeCoords();
      // Return
      return new $scope.map.maps.LatLng(coords.latitude, coords.longitude);
    },
    // Locate
    locate: function() {
      // Pan
      $scope.map.gmap.panTo($scope.preview.activeLatLng());
    },
    // Directions
    directions: function() {
      // Get directions
      $scope.directions.request($scope.preview.activeCoords());
    },
    set: function(marker, eventPermalink) {
      // If already
      if ($scope.preview.marker && $scope.preview.marker.id === marker.id) {
        // Exit
        return false;
      }
      // Set marker
      $scope.preview.marker = marker;
      // Shown
      var shown = $scope.preview.element.hasClass('show');
      // Hide
      $scope.preview.element.removeClass('show');
      // Get element
      $timeout(function() {
        // Set count
        $scope.preview.count = marker.exhibitions.length;
        $scope.preview.current = 0;

        // If there's permalink
        if (eventPermalink) {
          // Loop through exhibitions
          for (var o in marker.exhibitions) {
            // If event match
            if (marker.exhibitions[o].permalink === eventPermalink) {
              // Set as current
              $scope.preview.current = o;
              break;
            }
          }
        }

        // Select
        $scope.preview.select();
      }, shown ? 200 : 1);
    }
  };

  $scope.map = {
    maps: null,
    gmap: null,
    options: MapOptions,
    latitude: 60.173324,
    longitude: 24.941025,
    zoom: 15,
    firstLoaded: false,
    init: function(maps, map) {
      // Set map
      $scope.map.maps = maps;
      $scope.map.gmap = map;
      // Add label
      addLabelToMarkers(maps, 'marker-label');

      $scope.map.loaded(map);
    },
    loaded: function(map) {
      // Populate
      if (!$scope.map.firstLoaded) {
        $scope.map.populate();
        // Get center
        var center = $scope.map.gmap.getCenter();

        // If there's no location
        if (!$scope.location.coordinates) {
          // Set user location
          $scope.location.set(center.lat(), center.lng());
        }
      }
      $scope.map.firstLoaded = true;
    },
    change: function(map) {
      // Populate
      // $scope.map.populate();
    },
    markers: [],
    userMarker: {},
    getMarkerById: function(id, markers) {
      // If there's no markers
      if (!markers) {
        // Get from list
        markers = $scope.map.markers;
      }
      // Find marker by id
      for (var i in markers) {
        if (markers[i].id === id) {
          return markers[i];
        }
      }
      return false;
    },
    setMarkerStatus: function(marker, active) {
      marker.active = !!active;
      marker.setIcon($window.location.origin + root + '/images/marker-' + marker.status + (active ? '-active' : '') + '.png');
    },
    clickMarker: function() {
      // Select marker
      $scope.map.selectMarker(this);
    },
    selectMarker: function(marker, eventPermalink) {
      // Select all
      for (var i in $scope.map.markers) {
        // Skip
        if ($scope.map.markers[i].id === marker.id) {
          continue;
        }
        // Deactivate
        $scope.map.setMarkerStatus($scope.map.markers[i], false);
        // Add class
        angular.element($scope.map.markers[i].label.element).addClass('hide');
      }
      // Set preview
      $scope.preview.set(marker, eventPermalink);
    },
    clearMarkers: function() {
      if ($scope.map.markers) {
        for (var i in $scope.map.markers) {
          // Set map
          $scope.map.markers[i].setMap(null);
        }
      }
      // Empty
      $scope.map.markers = [];
      return $scope.map;
    },
    populating: null,
    populate: function() {

      if ($scope.map.populating) {
        // Cancel
        $timeout.cancel($scope.map.populating);
      }

      $scope.map.populating = $timeout(function() {
        var bounds = $scope.map.gmap.getBounds();
        var center = $scope.map.gmap.getCenter();

        var lat = center.lat(), lng = center.lng();

        var endpoint = 'events', args = {
          // sw: bounds.getSouthWest().toString().replace('(', '').replace(')', '').replace(' ', ''),
          // ne: bounds.getNorthEast().toString().replace('(', '').replace(')', '').replace(' ', ''),
          date: 'today',
          limit: 1000
        };
        // If to show venue
        if (focusVenue) {
          // Set endpoint
          endpoint = 'venues/' + focusVenue;
          args = {};
        }

        API.get(endpoint, args).then(function(response) {

          // Clear markers first
          $scope.map.clearMarkers();

          // Set markers
          var markers = [], hasToFocus = false;
          // Edit venue types
          var major = ['gallery', 'museum', 'public', 'other'];
          var venue = null, marker = null, position = null, x = 0;

          // If there's venue
          if (focusVenue) {

            if (response.data) {
              venue = response.data;
              // Position
              position = new $scope.map.maps.LatLng(venue.address.coordinates.latitude,
                                                        venue.address.coordinates.longitude);
              // Create marker
              marker = new $scope.map.maps.Marker({
                position: position, 
                icon: $window.location.origin + root + '/images/marker-closed.png',
                label: venue.name
              });
              // Loop through types
              for (x = venue.venueTypes.length - 1; x >= 0; x--) {
                // Remove if major
                if (major.indexOf(venue.venueTypes[x]) >= 0) {
                  venue.venueTypes.splice(x, 1);
                }
              }

              // Attach venue
              marker.venue = venue;
              marker.id = venue.id;
              // Attach empty exhibition
              marker.exhibitions = [];
              marker.active = false;
              // Set marker as open
              marker.status = venue.status;
              marker.setIcon($window.location.origin + root + '/images/marker-' + venue.status + '.png');

              /* jshint ignore:start */
              // Create dist calc
              marker.distance = function() {
                // Return
                return location.distance(this.venue.address.coordinates);
              };
              /* jshint ignore:end */

              // Hide label
              angular.element(marker.label.element).addClass('hide');

              // Add to markers
              markers.push(marker);
              // Set click
              marker.addListener('click', $scope.map.clickMarker);
              // Set venue as highlight
              highlight = marker;
              hasToFocus = true;

            }

          } else {
            // Loop through
            if (response.data.data) {
              for (var i in response.data.data) {

                // Randomize
                // var status = ['open', 'closed', 'special'][Math.floor(Math.random() * 3)];
                // Get exhibition
                var exhibition = response.data.data[i];
                venue = exhibition.venue;

                // Check if venue is already in markers
                marker = $scope.map.getMarkerById(venue.id, markers);

                // If there's no marker
                if (!marker) {
                  // Position
                  position = new $scope.map.maps.LatLng(venue.address.coordinates.latitude,
                                                            venue.address.coordinates.longitude);
                  // Create marker
                  marker = new $scope.map.maps.Marker({
                    position: position, 
                    icon: $window.location.origin + root + '/images/marker-closed.png',
                    label: exhibition.name
                  });
                  // Loop through types
                  for (x = venue.venueTypes.length - 1; x >= 0; x--) {
                    // Remove if major
                    if (major.indexOf(venue.venueTypes[x]) >= 0) {
                      venue.venueTypes.splice(x, 1);
                    }
                  }

                  // Attach venue
                  marker.venue = venue;
                  marker.id = venue.id;
                  // Attach empty exhibition
                  marker.exhibitions = [];
                  marker.active = false;
                  marker.status = 'closed';

                  /* jshint ignore:start */
                  // Create dist calc
                  marker.distance = function() {
                    // Return
                    return location.distance(this.venue.address.coordinates);
                  };
                  /* jshint ignore:end */

                  // Hide label
                  angular.element(marker.label.element).addClass('hide');

                  // Add to markers
                  markers.push(marker);
                  // Set click
                  marker.addListener('click', $scope.map.clickMarker);
                }


                // If there's focusEvent
                if (focusEvent) {
                  // If event matches
                  if (focusEvent === exhibition.permalink) {
                    // Set its venue as highlight
                    highlight = marker;
                    hasToFocus = true;
                  }
                } else if (focusVenue) {
                  // If the venue matches
                  if (focusVenue === exhibition.venue.permalink) {
                    // Set venue as highlight
                    highlight = marker;
                    hasToFocus = true;
                  }
                }


                // Add exhibition
                marker.exhibitions.push(exhibition);
                if (exhibition.status === 'open' && marker.status !== 'special') {
                  // Set marker as open
                  marker.status = 'open';
                  marker.setIcon($window.location.origin + root + '/images/marker-open.png');
                }
                if (exhibition.status === 'special') {
                  // Set marker as open
                  marker.status = 'special';
                  marker.setIcon($window.location.origin + root + '/images/marker-special.png');
                }
              }
            }
          }

          // Sort marker 
          markers.sort(function(a, b) {
            // Get distance of a from center
            var distA = location.distance({ latitude: lat, longitude: lng }, a.venue.address.coordinates);
            var distB = location.distance({ latitude: lat, longitude: lng }, b.venue.address.coordinates);
            // Return
            return distA - distB;
          });

          // Loop through markers
          for (var j in markers) {
            // Drop marker
            $scope.map.dropMarker(markers[j]);
          }

        });
      }, 1000);

    },

    queuedMarkers: [],
    droppingMarker: false,
    dropMarker: function(marker) {
      // If there's marker
      if (marker) {
        // Make sure map is null
        marker.setMap(null);
        // Just add to queue
        $scope.map.queuedMarkers.push(marker);
      }
      // If no longer dropping
      if (!$scope.map.droppingMarker) {
        // Get next marker
        var nextMarker = $scope.map.queuedMarkers[0];
        // If there's any
        if (nextMarker) {
          // Set dropping
          $scope.map.droppingMarker = true;
          // Add marker
          nextMarker.setMap($scope.map.gmap);
          // After setting map, set map for label as well
          nextMarker.label.setMap($scope.map.gmap);
          nextMarker.setAnimation($scope.map.maps.Animation.DROP);
          // Add to markers
          $scope.map.markers.push(nextMarker);
          // Remove from queue
          $scope.map.queuedMarkers = $scope.map.queuedMarkers.slice(1);
          // Wait
          $timeout(function() {
            // Set dropping
            $scope.map.droppingMarker = false;
            // Call dropmarker
            $scope.map.dropMarker();
          }, 20);
        } else {
          // If there's highlight
          if (highlight) {
            // Highlight the marker
            $scope.map.selectMarker(highlight, focusEvent);
            // Resolve
            focusDeferred.resolve(highlight);
          } else {
            // Preview first
            $scope.map.selectMarker($scope.map.markers[0]);
          }
        }
      }
    }

  };

}]);
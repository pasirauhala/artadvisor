'use strict';

/**
 * Location provider
 */

angular.module('main').provider('location', function() {

  var degreesToRadius = function(degrees) {
    return degrees * (Math.PI/180);
  };
  
  var calculateDistance = function(lat1, lng1, lat2, lng2) {
    var R = 6371; // Radius of the earth in km
    var dLat = degreesToRadius(lat2-lat1); 
    var dLon = degreesToRadius(lng2-lng1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degreesToRadius(lat1)) * Math.cos(degreesToRadius(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  };

  this.$get = [
    'geolocation', '$q', '$rootScope', '$timeout', 'uiGmapGoogleMapApi', 'API', 
    function(geolocation, $q, $rootScope, $timeout, uiGmapGoogleMapApi, API) {
    // Create a promise
    var location = {}, 
        deferred = $q.defer();
    // Set promise
    location.promise = deferred.promise;

    // City promise
    var cityDeferred = $q.defer();
    // Set city promise
    location.cityPromise = cityDeferred.promise;

    // Set city
    location.city = '';

    // Get location promise
    var getLocation = geolocation.getLocation({
      timeout: 20000
    });

    var getCurrent = $q.defer();

    // Process coords
    var processCoordinates = function() {
      // Execute promise
      deferred.resolve(location);

      // Get current location
      API.get('location/current', {
        coords: [location.current.latitude, location.current.longitude].join(',')
      }).then(function(response) {
        // If there's any
        if (response.data.name) {
          // Change in city
          $rootScope.$broadcast('$changeCity', response.data, true);
        }
        // Always resolve
      }).finally(getCurrent.resolve);
    };

    // Get location
    getLocation.then(function(data) {
      // Set current location
      location.current = data.coords;
      // process
      processCoordinates();
    }).catch(function() {
      // Set default coords
      location.current = {
        latitude: 60.1698557,
        longitude: 24.938379
      };
      // Process
      processCoordinates();
    });

    // Wait for googleMaps and getLocation
    $q.all([uiGmapGoogleMapApi, getLocation, getCurrent.promise]).then(function(responses) {
      // Maps is first response
      var maps = responses[0], coords = responses[1].coords;
      // Create latLng
      var latLng = new maps.LatLng(coords.latitude, coords.longitude);
      // Create geocoder
      var geocoder = new maps.Geocoder();
      // Geocode current coords
      geocoder.geocode({ latLng: latLng }, function(results, status) {
        // Check if ok
        if (status.toUpperCase() === 'OK') {
          // Find in results
          var address = results.find(function(item) {
            // Check for address_components
            if (!item.address_components) {
              // Return false
              return false;
            }
            // Search address_components
            return !!item.address_components.find(function(ac_item) {
              // If there's type and type has 'locality'
              var found = ac_item.types && (ac_item.types.indexOf('locality') >= 0);
              // If found
              if (found) {
                // Set city
                location.city = ac_item.long_name || ac_item.short_name || '';
                // If there's no city
                if (!location.city) {
                  // Set found to false
                  found = false;
                }
              }
              // Return found
              return found;
            });
          }) || '';
        }
        // Resolve city
        cityDeferred.resolve(location);
      });
    });

    // Calculate distance
    location.distance = function(coords1, coords2) {
      // If there's no coords2
      if (!coords2) {
        // Set current distance
        coords2 = location.current;
      }

      if (!coords1 || !coords1.latitude || !coords2 || !coords2.latitude) {
        // Return -1
        return -1;
      }

      // Return
      return calculateDistance(coords1.latitude, coords1.longitude, coords2.latitude, coords2.longitude);
    };
    // Format
    location.format = function(distance) {
      // If no distance
      if (distance < 0) {
        // Return 'calculating'
        return 'Calculating distance...';
      }
      // If less than 1 km
      if (distance < 1) {
        // Return
        return Math.round(distance / 1000) + 'm';
      } else {
        // Return
        return distance.toFixed(3) + 'km';
      }
    };

    // Return location
    return location;
  }];
});
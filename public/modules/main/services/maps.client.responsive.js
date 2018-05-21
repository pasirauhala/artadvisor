'use strict';

// API Service
angular.module('main').service('MapResponsive', ['uiGmapGoogleMapApi', '$timeout', function(uiGmapGoogleMapApi, $timeout) {

  var controls = {};
  var _this = this;

  var getControl = function(name) {
    // If non existent
    if (!controls[name]) {
      // Declare
      controls[name] = {
        currentCenter: {},
        control: {}
      };
    }
    return controls[name];
  };

  this.setCenter = function(name, center) {
    // Get control
    var control = getControl(name);

    control.currentCenter.latitude = center.latitude;
    control.currentCenter.longitude = center.longitude;

    return _this;
  };

  this.initialize = function(name, control) {
    // Get control
    var _control = getControl(name);
    // Set control
    _control.control = control;
    // Wait for maps to initialize
    uiGmapGoogleMapApi.then(function(maps) {
      // Delay
      $timeout(function() {
        // Get map
        var map = _control.control.getGMap();
        // Set listener
        maps.event.addDomListener(window, 'resize', function() {
          // Set currentCenter
          if (_control.currentCenter.latitude && _control.currentCenter.longitude) {
            map.setCenter(new maps.LatLng(_control.currentCenter.latitude, _control.currentCenter.longitude));
          }
        });
        maps.event.addListener(map, 'idle', function() {
          // Set currentCenter
          _this.setCenter(name, {
            latitude: map.getCenter().lat(),
            longitude: map.getCenter().lng()
          });
        });
      }, 1000);
    });
    return _this;
  };

}]);
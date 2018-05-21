'use strict';

angular.module('admin').controller('VenueController', ['$scope', '$resource', '$state', 'Upload', 'Authentication',
  function($scope, $resource, $state, Upload, Authentication) {
    // This provides Authentication context.
    //$scope.authentication = Authentication;

    var venue = $resource('/api/venues/:permalink', {
      permalink: $state.params.permalink
    });

    $scope.venue = {};
    // Get venue
    $scope.loadVenue = function(done) {
      // Get
      venue.get(null, function(data) {
        $scope.venue = data;
        // Done
        if (done) done($scope.venue);
      });
    };

    // Upload count
    $scope.uploadCount = 0;
    // Upload
    $scope.upload = function(files) {
      // Set jQuery
      var elem = angular.element;
      // If there are files
      if (files && files.length) {
        // File wrapper
        var wrap = elem('.page.venue:first .file:first');
        // Loop through files
        for (var i = 0; i < files.length; i++) {
          // Set file
          var file = files[i];
          // Increment upload count
          $scope.uploadCount++;
          // Create an uploader
          var uploading = elem('<div>')
                            .addClass('uploading')
                            .attr('id', 'uploading-' + $scope.uploadCount)
                            .append(elem('<div>').addClass('filename').text('Uploading ' + file.name))
                            .append(
                              elem('<div>').addClass('progress')
                                .append(elem('<div>').addClass('percent')));

          // Append to file
          wrap.append(uploading);

          // Set upload id
          file.uploadId = $scope.uploadCount;

          /* jshint ignore:start */
          // Do upload
          Upload.upload({
            url: '/api/upload',
            fields: { },
            file: file
          }).progress(function(evt) {
            var percent = (evt.loaded / evt.total) * 100;
            // Get upload progress
            var uploadProgress = elem('#uploading-' + evt.config.file.uploadId);
            // Set progress
            uploadProgress.find('.progress:first .percent:first').css({
              width: percent + '%'
            });
          }).success(function(data, status, headers, config) {
            // Get upload progress
            var uploadProgress = elem('#uploading-' + config.file.uploadId);
            // Remove
            uploadProgress.stop().fadeOut(200, function() {
              this.remove();
            });
          });
          /* jshint ignore:end */

          // Show uploading
          wrap.find('.uploading:last').show(200);
        }
      }
    };

    $scope.loadVenue();
  }
]);
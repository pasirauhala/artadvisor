'use strict';

/**
 * Touch class using HammerJS
 */

function Touch(options) {

  var flicked = false;

  // Get gallery width
  var gallery = {
    elem: null,
    init: function(elem) {
      // Set elem
      this.elem = elem;
      // Calculate
      gallery.galleryWidth = this.elem.parent().width();
      gallery.width = gallery.getWidth(this.elem);
      gallery.maxWidth = gallery.width - gallery.galleryWidth;
    },
    getWidth: function() {
      var totalWidth = 0;
      this.elem.find('li').each(function() {
        var li = angular.element(this);
        totalWidth += parseInt(li.width()) + parseInt(li.css('margin-right'));
      });
      return totalWidth;
    },
    galleryWidth: 0,
    width: 0,
    maxWidth: 0
  };

  this.drag = {
    elem: null,
    initial: 0,
    start: function(event) {
      if (flicked) {
        return false;
      }
      this.elem = angular.element(event.target).parents('ul:first');

      angular.element(this.elem).parents('.gallery:first').addClass('drag');

      // Initialize
      gallery.init(this.elem);

      this.elem.stop();
      this.initial = parseInt(this.elem.css('margin-left'));
    },
    on: function(event) {
      if (flicked) {
        return false;
      }
      // Set new margin
      var marginLeft = parseInt(this.initial + event.gesture.deltaX);
      // If exceed
      if (marginLeft >= 26) {
        return false;
      }
      // If less than least
      if (Math.abs(marginLeft) > gallery.maxWidth + 20) {
        return false;
      }
      this.elem.css('margin-left', marginLeft + 'px');
    },
    end: function(event) {
      if (flicked) {
        return false;
      }

      angular.element(this.elem).parents('.gallery:first').removeClass('drag');

      // Parse margin left
      var marginLeft = parseInt(this.elem.css('margin-left'));
      if (marginLeft > 0) {
        // Reduce to 0
        this.elem.animate({
          marginLeft: '0px'
        }, 200);
      }
      // If less than least
      if (Math.abs(marginLeft) > gallery.maxWidth) {
        // Reduce to max
        this.elem.animate({
          marginLeft: '-' + (gallery.maxWidth - 10) + 'px'
        }, 200);
      }
    }
  };

  // Flick
  this.flick = function(event, direction) {
    flicked = true;
    // Set flick speed
    var flickSpeed = 800;
    // On flick animate
    // Get ul
    var ul = angular.element(event.target).parents('ul:first');
    // Initialize ul
    gallery.init(ul);
    
    if (gallery.width < gallery.galleryWidth) {
      // Return
      return false;
    }
    // Get current margin
    var currentLeft = parseInt(ul.css('margin-left'));
    // Calculate new margin
    var marginLeft = currentLeft + (direction * event.gesture.velocityX * 200);
    // Limit margin
    if (marginLeft > 0) {
      marginLeft = 0;
    }
    if (Math.abs(marginLeft) > gallery.maxWidth) {
      marginLeft = (gallery.maxWidth - 10) * -1;
    }

    // Animate
    ul.animate({
      marginLeft: marginLeft + 'px'
    }, flickSpeed, 'easeOutQuint');
    // Regardless of finishing or not finishing flick, it should reset flicked
    setTimeout(function() {
      flicked = false;
    }, flickSpeed);
  };

}
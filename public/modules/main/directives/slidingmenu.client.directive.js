(function() {
	'use strict';

	angular.module('main')
		.directive('slidingMenu', slidingMenu);

	slidingMenu.$inject = [
		'$window',
		'$timeout',
		'$document',
		'$rootScope'
	];

	function slidingMenu($window, $timeout, $document, $rootScope) {
		return {
			restrict: 'A',
			link: linkFn
		};

		//////////////////////////////////////////

		function linkFn($scope, $element, $attr, $ctrl) {
			var menuScroll = null,
					menuWrapper = $element.find($attr.wrapper),
					pager = $element.find('.pager'),
					prevBtn = $element.find('.prev'),
					nextBtn = $element.find('.next');

			// console.log('directive init');
			$element.hide();

			$document.ready(function() {
				$timeout(function() {
					init();
				}, 200);
			});

			// window resize
			angular.element(window).bind('resize', function() {
          if (menuScroll) {
          	$timeout(function() {
          		computeWidth();
							menuScroll.reload();
						}, 300);
          }
      });

      $rootScope.gotoPage = $scope.gotoPage = function(index) {
      	// console.log(index);
      	if (menuScroll) {
      		menuScroll.activatePage(index);
      		$scope.gotoPageForIndex(index);
      	}
      };

			////////////////////////////////////

			function init() {
				$element.show();
				computeWidth();

				menuScroll = new Sly(menuWrapper, {
					horizontal: 1,
					itemNav: 'forceCentered',
					smart: 1,
					activateOn: 'click',
					activateMiddle: 1,
					mouseDragging: 1,
					touchDragging: 1,
					releaseSwing: 1,
					startAt: Number($attr.active),
					scrollBy: 1,
					speed: 300,
					elasticBounds: 1,
					dragHandle: 1,
					dynamicHandle: 1,
					clickBar: 1,
					// Buttons
					prev: prevBtn,
					next: nextBtn
				});

				menuScroll.on('active', setActiveItem);
				menuScroll.init();
			}

			function computeWidth() {
				var maxH = 0,
						menuWrapperWidth = menuWrapper.width(),
						minW = Math.ceil(menuWrapperWidth / 3),
						pad = 60;

				menuWrapper.find('li')
					.removeAttr('style')
					.each(function(){
					  var elem = $(this),
					  		w = elem.width();

					  if (w < minW) {
					  	elem.width(minW + pad);
					  } else {
					  	if (w >= menuWrapperWidth) {
					  		elem.width(menuWrapperWidth);
					  	} else {
					  		elem.width(w + pad);
					  	}
					  }
					});
			}

			function setActiveItem(eventName, i) {
				// console.log(eventName);
				pager.find('.dot').each(function(index){
				  var elem = $(this);

				  if (index === i) {
				  	elem.addClass('active');
				  } else {
				  	elem.removeClass('active');
				  }
				});
				$scope.gotoPageForIndex(i);
			}

			$element.on('$destroy', function() {
				if (menuScroll) {
					menuScroll.destroy();
					menuScroll = null;
				}
        return $scope.$destroy();
      });
		}
	}
})();

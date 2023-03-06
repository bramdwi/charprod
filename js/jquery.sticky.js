// Sticky Plugin v1.0.4 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 02/14/2011
// Date: 07/20/2015
// Website: http://stickeyjs.com/
// Description: Makes an element on the page stick on the screen as you scroll
//              It will only set the 'top' and 'position' of your element, you
//              might need to adjust the width in some cases.

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node/CommonJS
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {
    var slice = Array.prototype.slice; // save ref to original slice()
    var splice = Array.prototype.splice; // save ref to original slice()

  var defaults = {
      topSpacing: 0,
      bottomSpacing: 0,
      className: 'is-stickey',  
      wrapperClassName: 'stickey-wrapper',
      center: false,
      getWidthFrom: '',
      widthFromWrapper: true, // works only when .getWidthFrom is empty
      responsiveWidth: false,
      zIndex: 'inherit'
    },
    $window = $(window),
    $document = $(document),
    sticked = [],
    windowHeight = $window.height(),
    scroller = function() {
      var scrollTop = $window.scrollTop(),
        documentHeight = $document.height(),
        dwh = documentHeight - windowHeight,
        extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

      for (var i = 0, l = sticked.length; i < l; i++) {
        var s = sticked[i],
          elementTop = s.stickeyWrapper.offset().top,
          etse = elementTop - s.topSpacing - extra;

        //update height in case of dynamic content
        s.stickeyWrapper.css('height', s.stickeyElement.outerHeight());

        if (scrollTop <= etse) {
          if (s.currentTop !== null) {
            s.stickeyElement
              .css({
                'width': '',
                'position': '',
                'top': '',
                'z-index': ''
              });
            s.stickeyElement.parent().removeClass(s.className);
            s.stickeyElement.trigger('stickey-end', [s]);
            s.currentTop = null;
          }
        }
        else {
          var newTop = documentHeight - s.stickeyElement.outerHeight()
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
          if (newTop < 0) {
            newTop = newTop + s.topSpacing;
          } else {
            newTop = s.topSpacing;
          }
          if (s.currentTop !== newTop) {
            var newWidth;
            if (s.getWidthFrom) {
                padding =  s.stickeyElement.innerWidth() - s.stickeyElement.width();
                newWidth = $(s.getWidthFrom).width() - padding || null;
            } else if (s.widthFromWrapper) {
                newWidth = s.stickeyWrapper.width();
            }
            if (newWidth == null) {
                newWidth = s.stickeyElement.width();
            }
            s.stickeyElement
              .css('width', newWidth)
              .css('position', 'fixed')
              .css('top', newTop)
              .css('z-index', s.zIndex);

            s.stickeyElement.parent().addClass(s.className);

            if (s.currentTop === null) {
              s.stickeyElement.trigger('stickey-start', [s]);
            } else {
              // stickey is started but it have to be repositioned
              s.stickeyElement.trigger('stickey-update', [s]);
            }

            if (s.currentTop === s.topSpacing && s.currentTop > newTop || s.currentTop === null && newTop < s.topSpacing) {
              // just reached bottom || just started to stick but bottom is already reached
              s.stickeyElement.trigger('stickey-bottom-reached', [s]);
            } else if(s.currentTop !== null && newTop === s.topSpacing && s.currentTop < newTop) {
              // stickey is started && sticked at topSpacing && overflowing from top just finished
              s.stickeyElement.trigger('stickey-bottom-unreached', [s]);
            }

            s.currentTop = newTop;
          }

          // Check if stickey has reached end of container and stop sticking
          var stickeyWrapperContainer = s.stickeyWrapper.parent();
          var unstick = (s.stickeyElement.offset().top + s.stickeyElement.outerHeight() >= stickeyWrapperContainer.offset().top + stickeyWrapperContainer.outerHeight()) && (s.stickeyElement.offset().top <= s.topSpacing);

          if( unstick ) {
            s.stickeyElement
              .css('position', 'absolute')
              .css('top', '')
              .css('bottom', 0)
              .css('z-index', '');
          } else {
            s.stickeyElement
              .css('position', 'fixed')
              .css('top', newTop)
              .css('bottom', '')
              .css('z-index', s.zIndex);
          }
        }
      }
    },
    resizer = function() {
      windowHeight = $window.height();

      for (var i = 0, l = sticked.length; i < l; i++) {
        var s = sticked[i];
        var newWidth = null;
        if (s.getWidthFrom) {
            if (s.responsiveWidth) {
                newWidth = $(s.getWidthFrom).width();
            }
        } else if(s.widthFromWrapper) {
            newWidth = s.stickeyWrapper.width();
        }
        if (newWidth != null) {
            s.stickeyElement.css('width', newWidth);
        }
      }
    },
    methods = {
      init: function(options) {
        return this.each(function() {
          var o = $.extend({}, defaults, options);
          var stickeyElement = $(this);

          var stickeyId = stickeyElement.attr('id');
          var wrapperId = stickeyId ? stickeyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName;
          var wrapper = $('<div></div>')
            .attr('id', wrapperId)
            .addClass(o.wrapperClassName);

          stickeyElement.wrapAll(function() {
            if ($(this).parent("#" + wrapperId).length == 0) {
                    return wrapper;
            }
});

          var stickeyWrapper = stickeyElement.parent();

          if (o.center) {
            stickeyWrapper.css({width:stickeyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
          }

          if (stickeyElement.css("float") === "right") {
            stickeyElement.css({"float":"none"}).parent().css({"float":"right"});
          }

          o.stickeyElement = stickeyElement;
          o.stickeyWrapper = stickeyWrapper;
          o.currentTop    = null;

          sticked.push(o);

          methods.setWrapperHeight(this);
          methods.setupChangeListeners(this);
        });
      },

      setWrapperHeight: function(stickeyElement) {
        var element = $(stickeyElement);
        var stickeyWrapper = element.parent();
        if (stickeyWrapper) {
          stickeyWrapper.css('height', element.outerHeight());
        }
      },

      setupChangeListeners: function(stickeyElement) {
        if (window.MutationObserver) {
          var mutationObserver = new window.MutationObserver(function(mutations) {
            if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) {
              methods.setWrapperHeight(stickeyElement);
            }
          });
          mutationObserver.observe(stickeyElement, {subtree: true, childList: true});
        } else {
          if (window.addEventListener) {
            stickeyElement.addEventListener('DOMNodeInserted', function() {
              methods.setWrapperHeight(stickeyElement);
            }, false);
            stickeyElement.addEventListener('DOMNodeRemoved', function() {
              methods.setWrapperHeight(stickeyElement);
            }, false);
          } else if (window.attachEvent) {
            stickeyElement.attachEvent('onDOMNodeInserted', function() {
              methods.setWrapperHeight(stickeyElement);
            });
            stickeyElement.attachEvent('onDOMNodeRemoved', function() {
              methods.setWrapperHeight(stickeyElement);
            });
          }
        }
      },
      update: scroller,
      unstick: function(options) {
        return this.each(function() {
          var that = this;
          var unstickeyElement = $(that);

          var removeIdx = -1;
          var i = sticked.length;
          while (i-- > 0) {
            if (sticked[i].stickeyElement.get(0) === that) {
                splice.call(sticked,i,1);
                removeIdx = i;
            }
          }
          if(removeIdx !== -1) {
            unstickeyElement.unwrap();
            unstickeyElement
              .css({
                'width': '',
                'position': '',
                'top': '',
                'float': '',
                'z-index': ''
              })
            ;
          }
        });
      }
    };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.stickey = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.stickey');
    }
  };

  $.fn.unstick = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.unstick.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.stickey');
    }
  };
  $(function() {
    setTimeout(scroller, 0);
  });
}));

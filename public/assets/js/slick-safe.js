/**
 * Guard Slick method calls when a slider isn't initialized yet.
 * Fixes: Cannot read properties of undefined (reading 'getSlick')
 * when asNavFor sync runs before both sliders exist.
 */
(function ($) {
  if (!$ || !$.fn || !$.fn.slick || $.fn.slick.__hermanSafe) return;

  var originalSlick = $.fn.slick;

  $.fn.slick = function () {
    var method = arguments[0];

    if (typeof method === "string") {
      var el = this.get(0);
      if (!el || !el.slick) {
        if (method === "getSlick") {
          return {
            unslicked: true,
            slideCount: 0,
            options: { slidesToShow: 1 },
            setSlideClasses: function () {},
            slideHandler: function () {},
          };
        }
        if (method === "unslick") return this;
      }
    }

    try {
      return originalSlick.apply(this, arguments);
    } catch (err) {
      if (typeof method === "string" && method === "getSlick") {
        return {
          unslicked: true,
          slideCount: 0,
          options: { slidesToShow: 1 },
          setSlideClasses: function () {},
          slideHandler: function () {},
        };
      }
      throw err;
    }
  };

  $.fn.slick.__hermanSafe = true;
})(window.jQuery);

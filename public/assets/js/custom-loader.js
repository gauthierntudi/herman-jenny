(function ($) {
    "use strict";

    var windowOn = $(window);

    windowOn.on('load', function () {
        // Fallback for missing libraries
        var hasGSAP = (typeof gsap !== "undefined");
        var hasSplitText = (typeof SplitText !== "undefined");

        if (hasGSAP && $('.preloader-text-line').length > 0) {
            var tl = gsap.timeline();
            var lines = gsap.utils.toArray(".preloader-text-line");
            
            // Pour que les textes s'affichent au même endroit, on les positionne en absolu
            // sauf le conteneur qui garde la place
            $('.preloader-text-container').css({
                'position': 'relative',
                'height': '100px', // Hauteur approximative pour éviter le collapse
                'width': '100%',
                'display': 'flex',
                'justify-content': 'center',
                'align-items': 'center'
            });

            $(lines).css({
                'position': 'absolute',
                'top': '50%',
                'left': '50%',
                'transform': 'translate(-50%, -50%)',
                'width': '100%',
                'opacity': 0 // Cache tout au départ
            });

            lines.forEach((line, i) => {
                var split = hasSplitText ? new SplitText(line, { type: "chars, words" }) : null;
                
                // Reset position relative to parent for animation if needed, 
                // but absolute centering handles layout.
                // We need to set opacity 1 on the line element itself so characters can be seen
                // but characters start at opacity 0 from the tween.
                gsap.set(line, { opacity: 1 });

                if (split) {
                    // Hide chars initially
                    gsap.set(split.chars, { opacity: 0 });
                    
                    tl.fromTo(split.chars, 
                        { opacity: 0, x: 20 },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.8,
                            stagger: 0.05,
                            ease: "power2.out"
                        }
                    );
                } else {
                    tl.fromTo(line, 
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            ease: "power2.out"
                        }
                    );
                }

                // Pause lecture
                tl.to({}, { duration: 1.0 });

                // Disparition
                tl.to(line, {
                    opacity: 0,
                    y: -20,
                    duration: 0.5,
                    ease: "power2.in"
                });
            });

            // Fin du loader
            tl.to("#loading", {
                opacity: 0,
                duration: 0.8,
                onComplete: function() {
                    $("#loading").css("display", "none");
                }
            });
        } else {
            $("#loading").fadeOut(500);
        }
    });

})(jQuery);
(function ($) {
    "use strict";

    function runPreloader() {
        var $loading = $("#loading");
        if (!$loading.length || $loading.data("preloader-done")) return;
        $loading.data("preloader-done", true);

        var hasGSAP = typeof gsap !== "undefined";
        var hasSplitText = typeof SplitText !== "undefined";

        if (hasGSAP && $(".preloader-text-line").length > 0) {
            var tl = gsap.timeline();
            var lines = gsap.utils.toArray(".preloader-text-line");

            $(".preloader-text-container").css({
                position: "relative",
                height: "100px",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            });

            $(lines).css({
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "100%",
                opacity: 0,
            });

            lines.forEach(function (line) {
                var split = hasSplitText ? new SplitText(line, { type: "chars, words" }) : null;

                gsap.set(line, { opacity: 1 });

                if (split) {
                    gsap.set(split.chars, { opacity: 0 });

                    tl.fromTo(
                        split.chars,
                        { opacity: 0, x: 20 },
                        {
                            opacity: 1,
                            x: 0,
                            duration: 0.8,
                            stagger: 0.05,
                            ease: "power2.out",
                        }
                    );
                } else {
                    tl.fromTo(
                        line,
                        { opacity: 0, y: 20 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 1,
                            ease: "power2.out",
                        }
                    );
                }

                tl.to({}, { duration: 1.0 });

                tl.to(line, {
                    opacity: 0,
                    y: -20,
                    duration: 0.5,
                    ease: "power2.in",
                });
            });

            tl.to("#loading", {
                opacity: 0,
                duration: 0.8,
                onComplete: function () {
                    $("#loading").css("display", "none");
                },
            });

            // Filet de sécurité si l'animation GSAP échoue
            setTimeout(function () {
                if ($("#loading").is(":visible")) {
                    $("#loading").fadeOut(400);
                }
            }, 12000);
        } else {
            $loading.fadeOut(500);
        }
    }

    // Next.js injecte les scripts après le load → window "load" est déjà passé
    if (document.readyState === "complete") {
        runPreloader();
    } else {
        $(window).on("load", runPreloader);
        // Fallback si load ne se déclenche jamais comme attendu
        setTimeout(function () {
            if (document.readyState === "complete") {
                runPreloader();
            }
        }, 2500);
    }
})(jQuery);

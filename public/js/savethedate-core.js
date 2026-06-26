    var tpSlideshowTimer = null;
    var tpSlideshowIndex = 0;
    var tpSwiper = null;
    var tpSwiperEndTimeout = null;
    var tpSlideTimeouts = [];
    var tpAudioCtx = null;

    function tp_clearSlideTimeouts() {
        if (!tpSlideTimeouts || !tpSlideTimeouts.length) return;
        tpSlideTimeouts.forEach(t => clearTimeout(t));
        tpSlideTimeouts = [];
    }

    function tp_getAudioCtx() {
        if (tpAudioCtx) return tpAudioCtx;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        tpAudioCtx = new Ctx();
        return tpAudioCtx;
    }

    function tp_primeAudio() {
        const ctx = tp_getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
    }

    document.addEventListener('pointerdown', tp_primeAudio, { once: true });

    function tp_playSlideTick() {
        const ctx = tp_getAudioCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const t = ctx.currentTime;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(920, t);
        o.frequency.exponentialRampToValueAtTime(520, t + 0.05);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.12, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t);
        o.stop(t + 0.065);
    }

    function tp_getLoaderOverlay() {
        return document.getElementById('countdownOverlay');
    }

    function tp_getTypewriterContainer() {
        return document.getElementById('typewriterContainer');
    }

    function tp_getTypewriterText() {
        return document.getElementById('typewriterText');
    }

    function tp_getIntroLoader() {
        return document.getElementById('introLoader');
    }

    function tp_showOverlay() {
        const overlay = tp_getLoaderOverlay();
        if (overlay) overlay.style.display = 'flex';
    }

    function tp_hideOverlay() {
        const overlay = tp_getLoaderOverlay();
        if (overlay) overlay.style.display = 'none';
    }

    function tp_showTypewriterMode() {
        const container = tp_getTypewriterContainer();
        const loader = tp_getIntroLoader();
        if (loader) loader.classList.remove('visible');
        if (container) container.style.display = 'flex';
        const text = tp_getTypewriterText();
        if (text) text.textContent = '';
    }

    function tp_showLoaderMode() {
        const container = tp_getTypewriterContainer();
        const loader = tp_getIntroLoader();
        if (container) container.style.display = 'none';
        if (loader) loader.classList.add('visible');
    }

    function tp_runTypewriter(onDone) {
        const container = tp_getTypewriterContainer();
        const textEl = tp_getTypewriterText();
        if (!container || !textEl) {
            onDone();
            return;
        }

        const phrases = ["Save the date", "Herman & Jennifer", "Your experience begins here"];
        const CHAR_SPEED = 75;
        const ERASE_SPEED = 40;
        const PAUSE_FULL = 950;
        const PAUSE_EMPTY = 250;

        let phraseIndex = 0;

        function typePhrase() {
            const text = phrases[phraseIndex];
            let i = 0;

            function typeChar() {
                const el = tp_getTypewriterText();
                const sound = document.getElementById('typewriterSound');
                if (!el) return;
                if (i <= text.length) {
                    el.textContent = text.slice(0, i);
                    if (i > 0 && text[i - 1] !== ' ' && sound) {
                        sound.currentTime = 0;
                        sound.play().catch(() => {});
                    }
                    i++;
                    setTimeout(typeChar, CHAR_SPEED);
                } else {
                    setTimeout(eraseChar, PAUSE_FULL);
                }
            }

            function eraseChar() {
                const el = tp_getTypewriterText();
                const sound = document.getElementById('eraseSound');
                if (!el) return;
                if (el.textContent.length > 0) {
                    el.textContent = el.textContent.slice(0, -1);
                    if (sound) {
                        sound.currentTime = 0;
                        sound.play().catch(() => {});
                    }
                    setTimeout(eraseChar, ERASE_SPEED);
                } else {
                    phraseIndex++;
                    if (phraseIndex >= phrases.length) {
                        setTimeout(onDone, PAUSE_EMPTY);
                    } else {
                        setTimeout(typePhrase, PAUSE_EMPTY);
                    }
                }
            }

            typeChar();
        }

        typePhrase();
    }

    function tp_getSlideshowView() {
        return document.getElementById('slideshowView');
    }

    function tp_getSwiperEl() {
        return document.getElementById('stdSwiper');
    }

    function tp_getSlides() {
        const view = tp_getSlideshowView();
        return view ? Array.from(view.querySelectorAll('.swiper-slide')) : [];
    }

    function tp_showSlide(index) {
        tpSlideshowIndex = index;
        if (tpSwiper) {
            tpSwiper.slideTo(index, 0);
        }
    }

    function tp_stopSlideshow() {
        tp_clearSlideTimeouts();
        if (tpSwiperEndTimeout) {
            clearTimeout(tpSwiperEndTimeout);
            tpSwiperEndTimeout = null;
        }
    }

    function tp_gsapOverlayIn() {
        const view = tp_getSlideshowView();
        if (!view || typeof gsap === 'undefined') return;

        const t = view.querySelector('.slideshow-top');
        const n = view.querySelector('.slideshow-names');
        const d = view.querySelector('.slideshow-date');

        gsap.killTweensOf([t, n, d]);
        gsap.set([t, n, d], { clearProps: 'all' });

        const tl = gsap.timeline();
        if (t) tl.fromTo(t, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);
        if (n) tl.fromTo(n, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.08);
        if (d) tl.fromTo(d, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.18);
    }

    function tp_gsapKenBurns(durationMs) {
        if (!tpSwiper || typeof gsap === 'undefined') return;
        const slide = tpSwiper.slides[tpSwiper.activeIndex];
        if (!slide) return;
        const img = slide.querySelector('img');
        if (!img) return;

        gsap.killTweensOf(img);
        gsap.set(img, { scale: 1.06, y: 0 });
        const d = typeof durationMs === 'number' && durationMs > 0 ? durationMs : 2200;
        gsap.to(img, { scale: 1.16, y: -12, duration: d / 1000, ease: 'none' });
    }

    function tp_destroySwiper() {
        if (!tpSwiper) return;
        try { tpSwiper.destroy(true, true); } catch (e) {}
        tpSwiper = null;
    }

    function tp_initSwiper() {
        const el = tp_getSwiperEl();
        if (!el || typeof Swiper === 'undefined') return;

        tp_destroySwiper();

        tpSwiper = new Swiper(el, {
            slidesPerView: 1,
            effect: 'fade',
            fadeEffect: { crossFade: true },
            speed: 450,
            loop: false,
            allowTouchMove: false
        });
    }

    function tp_bootSlideshow() {
        tp_stopSlideshow();
        tpSlideshowIndex = 0;
        tp_showOverlay();

        const view = tp_getSlideshowView();
        if (view) view.classList.remove('active');

        tp_showTypewriterMode();

        const slides = tp_getSlides();
        const imgs = slides.map(s => s.querySelector('img')).filter(Boolean);

        let typewriterDone = false;
        let loaderDelayDone = false;
        let imagesDone = false;
        let finished = false;

        const tryFinish = () => {
            if (finished) return;
            if (loaderDelayDone && imagesDone) {
                finished = true;
                tp_hideOverlay();
                if (view) view.classList.add('active');
                tp_initSwiper();
                tp_startSlideshow();
            }
        };

        const markTypewriterDone = () => {
            typewriterDone = true;
            tp_showLoaderMode();
            setTimeout(() => {
                loaderDelayDone = true;
                tryFinish();
            }, 3000);
        };

        tp_runTypewriter(markTypewriterDone);

        if (!imgs.length) {
            imagesDone = true;
            tryFinish();
            return;
        }

        let remaining = 0;
        imgs.forEach(img => {
            if (!img.complete) remaining++;
        });

        const finishImagesOnce = () => {
            if (imagesDone) return;
            imagesDone = true;
            tryFinish();
        };

        if (!remaining) {
            setTimeout(finishImagesOnce, 350);
            return;
        }

        imgs.forEach(img => {
            if (img.complete) return;
            const onDone = () => {
                remaining--;
                img.removeEventListener('load', onDone);
                img.removeEventListener('error', onDone);
                if (remaining <= 0) finishImagesOnce();
            };
            img.addEventListener('load', onDone);
            img.addEventListener('error', onDone);
        });

        setTimeout(finishImagesOnce, 2500);
    }

    function tp_restartSlideshow() {
        tp_bootSlideshow();
    }

    function tp_replaySlidesOnly() {
        tp_stopSlideshow();
        tpSlideshowIndex = 0;
        tp_hideOverlay();

        const view = tp_getSlideshowView();
        if (view) view.classList.add('active');

        tp_initSwiper();
        tp_startSlideshow();
    }

    function tp_endSlideshow() {
        tp_stopSlideshow();
        fetch('/api/guests/status', { method: 'POST' })
            .then(r => r.json())
            .then(d => {
                const already = (d.success && d.alreadySubmitted) || window.isAlreadySubmitted === true;
                showInfoScreen(already);
            })
            .catch(() => showInfoScreen(window.isAlreadySubmitted === true));
    }

    function tp_startSlideshow() {
        tp_initSwiper();
        if (!tpSwiper) return;

        if (tpSwiperEndTimeout) {
            clearTimeout(tpSwiperEndTimeout);
            tpSwiperEndTimeout = null;
        }

        const view = tp_getSlideshowView();
        if (view) view.classList.remove('show-overlay');

        const total = tpSwiper.slides ? tpSwiper.slides.length : 0;
        if (!total) return;

        const last = total - 1;
        const totalMs = 5000;
        const holdMs = 2200;
        const transitionsMs = Math.max(0, totalMs - holdMs);

        tp_clearSlideTimeouts();
        tpSlideshowIndex = 0;
        tpSwiper.slideTo(0, 0);

        if (last <= 0) {
            if (view) view.classList.add('show-overlay');
            tp_gsapOverlayIn();
            tp_gsapKenBurns(holdMs);
            tpSwiperEndTimeout = setTimeout(() => tp_endSlideshow(), holdMs);
            return;
        }

        const transitionsCount = last;
        const weights = [];
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        for (let i = 0; i < transitionsCount; i++) {
            const t = transitionsCount <= 1 ? 1 : i / (transitionsCount - 1);
            weights.push(0.35 + 0.65 * easeOutCubic(t));
        }
        const sumW = weights.reduce((a, b) => a + b, 0) || 1;
        const segments = weights.map(w => Math.round((w / sumW) * transitionsMs));
        const sumSeg = segments.reduce((a, b) => a + b, 0);
        if (segments.length) {
            segments[segments.length - 1] += (transitionsMs - sumSeg);
        }

        tp_gsapKenBurns(segments[0] || 300);

        let acc = 0;
        for (let i = 0; i < transitionsCount; i++) {
            const seg = segments[i] || 1;
            const isLastTransition = i === transitionsCount - 1;
            let speed = 0;
            if (isLastTransition) {
                const speedRaw = Math.round(seg * 0.9);
                speed = Math.max(120, Math.min(520, speedRaw));
                if (speed > seg - 40) speed = Math.max(60, seg - 40);
            }

            acc += seg;
            const tid = setTimeout(() => {
                tpSlideshowIndex = i + 1;
                tpSwiper.slideTo(tpSlideshowIndex, speed);
                tp_playSlideTick();
                tp_gsapKenBurns(seg);
                if (tpSlideshowIndex >= last) {
                    const showTid = setTimeout(() => {
                        if (view) view.classList.add('show-overlay');
                        tp_gsapOverlayIn();
                        tp_gsapKenBurns(holdMs);
                    }, speed);
                    tpSlideTimeouts.push(showTid);
                }
            }, acc);
            tpSlideTimeouts.push(tid);
        }

        tpSwiperEndTimeout = setTimeout(() => tp_endSlideshow(), totalMs);
    }

    function tp_showSheet(title, message) {
        const overlay = document.getElementById('bsOverlay');
        const sheet = document.getElementById('bsModal');
        const titleEl = document.getElementById('bsTitle');
        const msgEl = document.getElementById('bsMessage');
        const btnEl = document.getElementById('bsButton');

        if (titleEl) titleEl.innerText = title;
        if (msgEl) msgEl.innerText = message;

        if (overlay) overlay.classList.add('active');
        setTimeout(() => {
            if (sheet) sheet.classList.add('active');
        }, 10);

        const close = () => {
            if (sheet) sheet.classList.remove('active');
            setTimeout(() => {
                if (overlay) overlay.classList.remove('active');
            }, 300);
        };

        if (btnEl) btnEl.onclick = close;
        if (overlay) overlay.onclick = close;
    }

    function showInfoScreen(alreadyConfirmed) {
        if (alreadyConfirmed) { showEndOverlay(); return; }
        const infoScreen = document.getElementById('infoScreen');
        if (!infoScreen) return;
        // On n'touche pas à videoView — infoScreen est en position:fixed z-index:10003
        // et apparaît par-dessus sans laisser voir le fond blanc.
        infoScreen.style.transition = 'none';
        infoScreen.style.opacity = '1';
        infoScreen.style.display = 'block';

        const btnConfirm = document.getElementById('btnConfirmAvailability');
        if (btnConfirm) btnConfirm.onclick = () => confirmAvailability();

        const peopleInput = document.getElementById('peopleCount');
        const peopleMinus = document.getElementById('peopleMinus');
        const peoplePlus = document.getElementById('peoplePlus');
        if (peopleInput && peopleMinus && peoplePlus) {
            const clamp = (v) => Math.max(1, Math.min(2, v));
            const getVal = () => {
                const n = parseInt(peopleInput.value || '1', 10);
                return Number.isFinite(n) ? n : 1;
            };
            const setVal = (v) => {
                peopleInput.value = String(clamp(v));
            };
            peopleMinus.onclick = () => setVal(getVal() - 1);
            peoplePlus.onclick = () => setVal(getVal() + 1);
            setVal(getVal());
        }

        const outsideToggle = document.getElementById('outsideUsaToggle');
        const outsideOptions = document.getElementById('outsideUsaOptions');
        if (outsideToggle && outsideOptions) {
            const sync = () => {
                outsideOptions.style.display = outsideToggle.checked ? 'flex' : 'none';
            };
            outsideToggle.onchange = sync;
            sync();
        }

        const btnNotAvailable = document.getElementById('btnNotAvailable');
        if (btnNotAvailable) {
            btnNotAvailable.onclick = () => {
                // Ouvrir le Bottom Sheet à la place du confirm() natif
                const bsModal   = document.getElementById('bsModal');
                const bsOverlay = document.getElementById('bsOverlay');
                if (!bsModal || !bsOverlay) return;

                document.getElementById('bsTitle').textContent   = 'Confirm your choice';
                document.getElementById('bsMessage').textContent = 'Are you sure you will not be available from August 29 to September 5, 2026?';

                // Replace the single button with two buttons (Cancel / Confirm)
                const bsButton = document.getElementById('bsButton');
                bsButton.textContent = 'No, cancel';
                bsButton.onclick = () => {
                    bsOverlay.classList.remove('active');
                    bsModal.classList.remove('active');
                };

                // Add a dynamic "Confirm" button if it doesn't exist yet
                let bsConfirm = document.getElementById('bsConfirmNotAvailable');
                if (!bsConfirm) {
                    bsConfirm = document.createElement('button');
                    bsConfirm.id = 'bsConfirmNotAvailable';
                    bsConfirm.className = 'bs-button';
                    bsConfirm.style.cssText = 'background:#c30f24;margin-top:8px;';
                    bsModal.appendChild(bsConfirm);
                }
                bsConfirm.textContent = 'Yes, I will not be available';
                bsConfirm.onclick = () => {
                    bsOverlay.classList.remove('active');
                    bsModal.classList.remove('active');

                    fetch('/api/guests/availability', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ availability: false, people_count: 1 })
                    }).then(r => r.json()).then(d => {
                        if (d.success) {
                            window.isAlreadySubmitted = true;
                            // Cacher infoScreen instantanément (pas de fade → pas de fond blanc)
                            infoScreen.style.display = 'none';
                            showEndOverlay();
                        } else { alert('Error: ' + d.message); }
                    }).catch(() => alert('Network error'));
                };

                bsOverlay.classList.add('active');
                bsModal.classList.add('active');
            };
        }

        const btnReplay = document.getElementById('btnReplayFromInfo');
        if (btnReplay) {
            btnReplay.onclick = () => {
                infoScreen.style.opacity = '0';
                setTimeout(() => {
                    infoScreen.style.display = 'none';
                    tp_replaySlidesOnly();
                }, 400);
            };
        }
    }

    function confirmAvailability() {
        const btn = document.getElementById('btnConfirmAvailability');
        const infoScreen = document.getElementById('infoScreen');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = (window.LucideSvg ? window.LucideSvg.loader(18) : "") + " Saving...";

        const outsideToggle = document.getElementById('outsideUsaToggle');
        const peopleCountEl = document.getElementById('peopleCount');
        const needInvitation = document.getElementById('needInvitation');
        const needVisaAssistance = document.getElementById('needVisaAssistance');
        const needHotelBooking = document.getElementById('needHotelBooking');
        const outside = !!(outsideToggle && outsideToggle.checked);
        const peopleCount = parseInt((peopleCountEl && peopleCountEl.value) ? peopleCountEl.value : '0', 10);
        const needInv = !!(needInvitation && needInvitation.checked);
        const needVisa = !!(needVisaAssistance && needVisaAssistance.checked);
        const needHotel = !!(needHotelBooking && needHotelBooking.checked);

        if (!(peopleCount === 1 || peopleCount === 2) || (outside && !(needInv || needVisa || needHotel))) {
            btn.disabled = false;
            btn.innerHTML = orig;
            tp_showSheet('Heads up', "Please choose 1 or 2 people.");
            return;
        }

        fetch('/api/guests/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                outside_usa: outside,
                people_count: peopleCount,
                need_invitation: needInv,
                need_visa_assistance: needVisa,
                need_hotel_booking: needHotel,
                availability: true
            })
        }).then(r => r.json()).then(d => {
            if (d.success) {
                window.isAlreadySubmitted = true;
                // Cacher infoScreen instantanément (pas de fade → pas de fond blanc)
                if (infoScreen) { infoScreen.style.display = 'none'; }
                showEndOverlay();
                if (d.whatsappSent === false) {
                    const details = (typeof d.whatsappError === 'string' && d.whatsappError.trim()) ? ` (${d.whatsappError})` : '';
                    tp_showSheet('Heads up', 'WhatsApp message could not be sent.' + details);
                }
            } else { btn.disabled = false; btn.innerHTML = orig; alert('Error: ' + d.message); }
        }).catch(() => { btn.disabled = false; btn.innerHTML = orig; alert('Network error.'); });
    }

    function showEndOverlay() {
        const endOverlay = document.getElementById('endOverlay');
        if (!endOverlay) return;
        endOverlay.classList.add('visible');
        const replayBtn = document.getElementById('replayBtn');
        if (replayBtn) {
            replayBtn.onclick = () => {
                endOverlay.classList.remove('visible');
                setTimeout(() => {
                    tp_replaySlidesOnly();
                }, 300);
            };
        }
    }

    // ─── Démarrage via cookie valide (éléments déjà dans le DOM) ─────────────
    window.onload = function() {
        if (tp_getSlideshowView()) {
            tp_bootSlideshow();
        }
    };

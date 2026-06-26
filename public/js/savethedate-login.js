    document.addEventListener("DOMContentLoaded", function() {
        const input = document.querySelector("#phone");
        const nameInput = document.querySelector("#guest_name");
        const hiddenInput = document.querySelector("#full_phone");
        const urlTokenInput = document.querySelector("#url_token");
        const form = document.querySelector("#loginForm");
        const errorContainer = document.querySelector(".error-message");

        // Récupération du paramètre URL 'params' (token)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('params');
        if (token && urlTokenInput) {
            urlTokenInput.value = token;
        }

        // Initialisation du plugin intl-tel-input
        const iti = window.intlTelInput(input, {
            utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.1/build/js/utils.js",
            initialCountry: "auto",
            countrySearch: true, /* Active la recherche de pays - natif en v23 */
            fixDropdownWidth: true, /* Force la largeur du dropdown à la largeur de l'input */
            // Utilisation d'un service IP plus permissif ou fallback
            geoIpLookup: function(success, failure) {
                // Utilisation de l'API ipapi.co (souvent bloquée par CORS ou quotas)
                // Solution de contournement : on utilise un service tiers ou on hardcode "fr" si échec
                // Pour la démo et éviter les erreurs CORS en local/dev, on fallback directement sur "fr" si échec
                
                // Tentative 1 : ipapi.co
                fetch("https://ipapi.co/json/")
                .then(function(res) {
                    if (!res.ok) throw new Error("HTTP error " + res.status);
                    return res.json();
                })
                .then(function(data) { success(data.country_code); })
                .catch(function() {
                    // Tentative 2 : ipinfo.io (souvent plus permissif)
                    fetch("https://ipinfo.io/json?token=") // Sans token, limité mais fonctionne souvent
                    .then(res => res.json())
                    .then(data => success(data.country))
                    .catch(() => {
                         // Dernier recours : on ne bloque pas l'UI, on met "FR" ou "CD" par défaut
                         success("fr"); 
                    });
                });
            },
            preferredCountries: ['fr', 'us', 'gb', 'be', 'ch', 'ca', 'cd'],
            separateDialCode: false,
            formatOnDisplay: true,
            autoPlaceholder: "aggressive",
            nationalMode: false,
            showSelectedDialCode: true /* Nouvelle option v23 pour remplacer separateDialCode: false + nationalMode: false pour l'affichage */
        });

        // Interception de la soumission du formulaire
        form.addEventListener('submit', function(e) {
            e.preventDefault(); // IMPORTANT : Empêche le rechargement standard
            
            // Réinitialiser les erreurs précédentes
            const errorDiv = document.querySelector('.error-message-js');
            if (errorDiv) errorDiv.style.display = 'none';
            if (errorContainer) errorContainer.style.display = 'none';

            if (!nameInput || nameInput.value.trim().length < 2) {
                showError("Please enter your name.");
                shakeCard();
                return;
            }

            if (iti.isValidNumber()) {
                const fullNumber = iti.getNumber();
                hiddenInput.value = fullNumber;
                
                // Petit effet de chargement sur le bouton
                const btn = document.querySelector('.btn-submit');
                const originalText = btn.innerHTML;
                btn.innerHTML = (window.LucideSvg ? window.LucideSvg.loader(18) : "") + " Loading...";
                btn.disabled = true;
                
                // Envoi AJAX
                const payload = { full_phone: hiddenInput.value, guest_name: nameInput.value.trim(), url_token: urlTokenInput ? urlTokenInput.value : "" };
                
                // On s'assure que l'URL est correcte (fichier actuel)
                fetch("/api/guests/login", {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { "Content-Type": "application/json" }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Si le serveur dit que c'est déjà soumis, on met à jour la variable globale
                        if (data.alreadySubmitted) {
                            isAlreadySubmitted = true;
                            // On peut aussi pré-remplir les dates si on veut (TODO)
                        }
                        
                        // Rechargement pour afficher la vidéo (le cookie est set)
                        // ── Injection du player vidéo sans rechargement ──────────────────
                        // window.location.reload() détruit le contexte d'interaction mobile.
                        // On injecte le HTML directement → le navigateur autorise l'autoplay.
                        window.isAlreadySubmitted = data.alreadySubmitted || false;

                        const loginView = document.querySelector('.login-view');
                        if (loginView) loginView.style.display = 'none';

                        const slidePaths = window.__STD_SLIDES__ || [];
                        const slidesMarkup = (Array.isArray(slidePaths) ? slidePaths : []).map(p => (
                            `<div class="swiper-slide slideshow-slide"><img src="${p}" alt=""></div>`
                        )).join('');

                        const slideshowHTML = `
                            <div id="countdownOverlay" class="countdown-overlay">
                                <audio id="typewriterSound" src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" preload="auto"></audio>
                                <audio id="eraseSound" src="https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3" preload="auto"></audio>
                                <div class="countdown-content" id="typewriterContainer" style="display:flex;align-items:center;justify-content:center;flex-wrap:nowrap;">
                                    <div id="typewriterText" style="font-family:'GT Super',serif;font-size:clamp(22px,4.5vw,40px);color:white;text-align:center;letter-spacing:0.02em;line-height:1.3;"></div>
                                    <span id="typewriterCursor" style="display:inline-block;width:2.5px;height:1em;background:#ffdf4b;margin-left:2px;vertical-align:middle;transform:rotate(15deg);transform-origin:center;animation:cursorBlink 0.7s step-end infinite;"></span>
                                </div>
                                <div id="introLoader" class="loader-wrapper">
                                    <div class="premium-loader"></div>
                                </div>
                            </div>
                            <div class="slideshow-view" id="slideshowView">
                                <div class="swiper slideshow-swiper" id="stdSwiper">
                                    <div class="swiper-wrapper">
                                        ${slidesMarkup}
                                    </div>
                                </div>
                                <div class="slideshow-overlay">
                                    <div class="slideshow-top">Save the date</div>
                                    <div class="slideshow-bottom">
                                        <div class="slideshow-names">Herman <span class="amp">&amp;</span> Jennifer</div>
                                        <div class="slideshow-date">September 5, 2026</div>
                                    </div>
                                </div>
                            </div>
                            <div id="endOverlay" class="end-video-overlay">
                                <div class="end-content">
                                    <span style="display:inline-block;color:var(--primary-color);margin-bottom:20px;">${window.LucideSvg ? window.LucideSvg.heart(48, "heart-pulse") : ""}</span>
                                    <h2>See you soon!</h2>
                                    <p>We can’t wait to see you.</p>
                                    <p style="font-size:14px;opacity:0.85;margin-top:8px;line-height:1.5;">Share your journey and celebration with <strong>#TheKandeWedding</strong>.</p>
                                    <div style="display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:24px;width:100%;">
                                        <button id="replayBtn" class="btn-replay" style="width:100%;max-width:280px;justify-content:center;">
                                            ${window.LucideSvg ? window.LucideSvg.rotateCw(18) : ""} Replay slideshow
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="infoScreen" style="display:none;opacity:0;position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(rgba(255,255,255,0.94),rgba(255,255,255,0.94)),url('/img/hj-01.jpg');background-size:cover;background-position:center;z-index:10003;overflow-y:auto;transition:none;">
                                <div style="max-width:560px;margin:0 auto;padding:48px 28px 120px;display:flex;flex-direction:column;gap:20px;text-align:center;">
                                    <div style="margin-bottom:8px;"><img src="/img/logo01.png" alt="Logo" style="max-width:120px;height:auto;opacity:0.85;"></div>
                                    <p style="font-family:var(--font-heading);font-size:22px;line-height:1.45;color:#1c1c1e;margin:0;">We are delighted to celebrate with you on<br><strong>September 5, 2026</strong> in the USA.</p>
                                    <p style="font-family:var(--font-body);font-size:16px;line-height:1.65;color:#555;margin:0;">During these days, several moments will celebrate our union, and invitations to the ceremonies you are invited to will be sent to you.</p>
                                    <p style="font-family:var(--font-body);font-size:16px;line-height:1.65;color:#555;margin:0;">Please confirm your availability for this period before <strong>May 15, 2026</strong>.</p>
                                    <p style="font-family:var(--font-body);font-size:14px;color:var(--primary-color);margin:0;font-style:italic;">Share your journey and celebration with <strong>#TheKandeWedding</strong>.</p>
                                    <div style="text-align:left;background:rgba(255,255,255,0.9);border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:16px 16px 14px;">
                                        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;font-family:var(--font-body);font-size:15px;font-weight:600;color:#1c1c1e;">
                                            <span>Number of people</span>
                                            <div style="display:flex;align-items:center;gap:8px;">
                                                <button type="button" id="peopleMinus" style="width:32px;height:32px;border-radius:10px;border:1px solid rgba(0,0,0,0.12);background:#fff;color:#1c1c1e;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;">-</button>
                                                <input id="peopleCount" type="text" value="1" readonly style="width:44px;height:32px;border-radius:10px;border:1px solid rgba(0,0,0,0.12);background:#fff;color:#1c1c1e;text-align:center;font-size:14px;font-weight:700;padding:0;">
                                                <button type="button" id="peoplePlus" style="width:32px;height:32px;border-radius:10px;border:1px solid rgba(0,0,0,0.12);background:#fff;color:#1c1c1e;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;">+</button>
                                            </div>
                                        </div>
                                        <label style="display:flex;align-items:center;justify-content:space-between;gap:14px;font-family:var(--font-body);font-size:15px;font-weight:600;color:#1c1c1e;margin-top:10px;">
                                            <span>I live outside the USA</span>
                                            <input id="outsideUsaToggle" type="checkbox" style="width:22px;height:22px;accent-color:var(--primary-color);">
                                        </label>
                                        <div id="outsideUsaOptions" style="display:none;margin-top:12px;gap:10px;flex-direction:column;">
                                            <label style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:14px;color:#1c1c1e;">
                                                <input id="needInvitation" type="checkbox" style="width:18px;height:18px;accent-color:var(--primary-color);">
                                                <span>I need the invitation</span>
                                            </label>
                                            <label style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:14px;color:#1c1c1e;">
                                                <input id="needVisaAssistance" type="checkbox" style="width:18px;height:18px;accent-color:var(--primary-color);">
                                                <span>I need help with a US visa</span>
                                            </label>
                                            <label style="display:flex;align-items:center;gap:10px;font-family:var(--font-body);font-size:14px;color:#1c1c1e;">
                                                <input id="needHotelBooking" type="checkbox" style="width:18px;height:18px;accent-color:var(--primary-color);">
                                                <span>I need a hotel reservation</span>
                                            </label>
                                            <div style="font-family:var(--font-body);font-size:12px;color:#6b6b6b;line-height:1.4;margin-top:2px;">
                                                Please select at least one option.
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:flex;flex-direction:column;gap:12px;margin-top:12px;">
                                        <button id="btnConfirmAvailability" style="width:100%;padding:18px 20px;background:#1c1c1e;color:white;border:none;border-radius:16px;font-family:var(--font-body);font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;">
                                            ${window.LucideSvg ? window.LucideSvg.calendarCheck(18) : ""} Confirm my availability
                                        </button>
                                        <button id="btnNotAvailable" style="width:100%;padding:18px 20px;background:#c30f24;color:white;border:none;border-radius:16px;font-family:var(--font-body);font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;box-shadow:0 4px 15px rgba(195,15,36,0.4);">
                                            ${window.LucideSvg ? window.LucideSvg.calendarX(18) : ""} Not available
                                        </button>
                                        <button id="btnReplayFromInfo" style="width:100%;padding:18px 20px;background:#ffd34b;color:#221f20;border:none;border-radius:16px;font-family:var(--font-body);font-size:16px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;">
                                            ${window.LucideSvg ? window.LucideSvg.rotateCw(18) : ""} Replay slideshow
                                        </button>
                                    </div>
                                </div>
                            </div>`;

                        const appContainer = document.querySelector('.app-container');
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = slideshowHTML;
                        while (tempDiv.firstChild) {
                            appContainer.insertBefore(tempDiv.firstChild, appContainer.lastElementChild);
                        }
                        tpSlideshowIndex = 0;
                        tp_bootSlideshow();
                    } else {
                        // Affichage de l'erreur
                        showError(data.message);
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        
                        // Animation de secousse
                        shakeCard();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showError("Une erreur technique est survenue.");
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                });
            } else {
                showError("Invalid number. Please check the format.");
                shakeCard();
            }
        });

        function shakeCard() {
            // Animation de secousse pour feedback visuel
            const card = document.querySelector('.auth-card'); // Sur mobile
            const cardDesktop = document.querySelector('.login-desktop-wrapper-content'); // Sur desktop
            const target = window.innerWidth >= 768 ? cardDesktop : card;
            
            if(target) {
                target.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(10px)' },
                    { transform: 'translateX(-10px)' },
                    { transform: 'translateX(0)' }
                ], {
                    duration: 400,
                    iterations: 1
                });
            }
        }

        function showBottomSheet(title, message) {
            const overlay = document.getElementById('bsOverlay');
            const sheet = document.getElementById('bsModal');
            const titleEl = document.getElementById('bsTitle');
            const msgEl = document.getElementById('bsMessage');
            const btnEl = document.getElementById('bsButton');

            if(titleEl) titleEl.innerText = title;
            if(msgEl) msgEl.innerText = message;

            if(overlay) overlay.classList.add('active');
            // Petit délai pour l'animation CSS
            setTimeout(() => {
                if(sheet) sheet.classList.add('active');
            }, 10);

            // Fermeture
            const close = () => {
                if(sheet) sheet.classList.remove('active');
                setTimeout(() => {
                    if(overlay) overlay.classList.remove('active');
                }, 300);
            };

            if(btnEl) btnEl.onclick = close;
            if(overlay) overlay.onclick = close;
        }

        function showError(message) {
            // On utilise maintenant la Bottom Sheet au lieu du div d'erreur classique
            // Mais on garde le log console au cas où
            console.log("Error:", message);
            
            // Titre adapté selon le message
            let title = "Oops!";
            if (message.toLowerCase().includes("number")) title = "Invalid number";
            else if (message.toLowerCase().includes("connection")) title = "Connection error";
            
            showBottomSheet(title, message);
        }
    });

/* ==========================================================================
   MadeForYou - Recipient Interactive Journey Module
   Controls the multi-stage surprise sequence:
   Lock Screen -> Unlock Story -> Greeting -> Photo Memories -> Envelope -> Letter
   ========================================================================== */

class RecipientJourney {
    constructor() {
        this.surpriseData = null;
        this.currentMemoryIndex = 0;
        this.isPreview = false;
    }

    init(surpriseData, isPreview = false) {
        this.surpriseData = surpriseData;
        this.isPreview = isPreview;
        this.currentMemoryIndex = 0;

        // Apply surprise theme to background
        themeEngine.setTheme(surpriseData.theme || 'love');

        this.showStage('lock');
        this.bindLockEvents();
        this.bindTouchParticleSpawner();
    }

    /* Diagnostic Verification Flow */
    async verifyAndLoadSurprise(surpriseId) {
        if (!surpriseId) {
            return {
                success: false,
                reason: 'invalid_link',
                title: 'Invalid link',
                details: 'This surprise could not be found. Please check that the link was copied correctly.'
            };
        }

        // Step 1: Does short_code / payload exist?
        let surpriseData = await storageManager.getSurprise(surpriseId);
        
        if (!surpriseData && surpriseId.startsWith('payload_')) {
            try {
                const compactData = storageManager.decodeCompactPayload(surpriseId);
                if (compactData && (compactData.message || compactData.recipient_name)) {
                    surpriseData = compactData;
                }
            } catch (e) {
                console.warn("Payload decode error:", e);
            }
        }

        if (!surpriseData) {
            return {
                success: false,
                reason: 'invalid_link',
                title: 'Invalid link',
                details: 'This surprise could not be found. Please check that the link was copied correctly.'
            };
        }

        // Step 2: Is status = active?
        if (surpriseData.status === 'inactive' || surpriseData.is_active === false || surpriseData.closed === true) {
            return {
                success: false,
                reason: 'inactive',
                title: 'Surprise Inactive',
                details: 'This surprise has been closed by its creator.'
            };
        }

        // Step 3: Has it expired?
        if (surpriseData.expires_at) {
            const expDate = new Date(surpriseData.expires_at);
            if (!isNaN(expDate.getTime()) && new Date() > expDate) {
                return {
                    success: false,
                    reason: 'expired',
                    title: 'Surprise Expired',
                    details: 'This surprise is no longer available. The creator set an expiration date for this link.'
                };
            }
        }

        // Valid data found! Proceed to initialization
        this.init(surpriseData, false);
        return { success: true };
    }

    showErrorStage(reason, title, details) {
        this.showStage('error');
        const iconEl = document.getElementById('error-stage-icon');
        const titleEl = document.getElementById('error-stage-title');
        const msgEl = document.getElementById('error-stage-msg');

        if (reason === 'invalid_link') {
            if (iconEl) iconEl.textContent = '🔍';
            if (titleEl) titleEl.textContent = title || 'Invalid link';
            if (msgEl) msgEl.textContent = details || 'This surprise could not be found. Please check that the link was copied correctly.';
        } else if (reason === 'inactive') {
            if (iconEl) iconEl.textContent = '🔒';
            if (titleEl) titleEl.textContent = title || 'Surprise Inactive';
            if (msgEl) msgEl.textContent = details || 'This surprise has been closed by its creator.';
        } else if (reason === 'expired') {
            if (iconEl) iconEl.textContent = '⏳';
            if (titleEl) titleEl.textContent = title || 'Surprise Expired';
            if (msgEl) msgEl.textContent = details || 'This surprise is no longer available. The creator set an expiration date for this link.';
        } else {
            if (iconEl) iconEl.textContent = '💔';
            if (titleEl) titleEl.textContent = title || 'Surprise Unavailable';
            if (msgEl) msgEl.textContent = details || 'This surprise could not be loaded.';
        }
    }

    bindLockEvents() {
        const passInput = document.getElementById('input-recipient-password');
        if (passInput) {
            passInput.value = '';
            passInput.focus();
            passInput.onkeyup = (e) => {
                if (e.key === 'Enter') this.attemptUnlock();
            };
        }
    }

    /* Spawn floating hearts on screen tap/click */
    bindTouchParticleSpawner() {
        const screen = document.getElementById('view-recipient');
        if (!screen || screen.hasAttribute('data-touch-bound')) return;

        screen.setAttribute('data-touch-bound', 'true');
        screen.addEventListener('click', (e) => {
            // Ignore button clicks
            if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;

            this.spawnFloatingHeart(e.clientX, e.clientY);
        });
    }

    spawnFloatingHeart(x, y) {
        const heart = document.createElement('div');
        heart.className = 'touch-heart-particle';
        heart.textContent = ['❤️', '💖', '✨', '🌸', '💕'][Math.floor(Math.random() * 5)];
        heart.style.left = `${x - 12}px`;
        heart.style.top = `${y - 12}px`;
        document.body.appendChild(heart);

        setTimeout(() => heart.remove(), 1200);
    }

    showStage(stageName) {
        document.querySelectorAll('.recipient-stage').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(`rec-stage-${stageName}`);
        if (target) {
            target.classList.add('active');
        }
    }

    /* Unlock Password Validation */
    async attemptUnlock() {
        const passInput = document.getElementById('input-recipient-password');
        const errorMsg = document.getElementById('lock-error-msg');
        const inputPass = passInput ? passInput.value.trim() : '';

        if (!inputPass) {
            errorMsg.textContent = 'Please enter your password ❤️';
            return;
        }

        const inputHash = await storageManager.hashPassword(inputPass);
        const correctHash = this.surpriseData.password_hash;

        const recNameUpper = (this.surpriseData.recipient_name || '').trim().toUpperCase();
        const rawPassUpper = (this.surpriseData.password_raw || '').trim().toUpperCase();

        const isHashMatch = correctHash && inputHash === correctHash;
        const isRawPassMatch = rawPassUpper && inputPass.toUpperCase() === rawPassUpper;
        const isNameMatch = recNameUpper && inputPass.toUpperCase() === recNameUpper;

        if (isHashMatch || isRawPassMatch || isNameMatch || !correctHash || this.isPreview) {
            errorMsg.textContent = '';
            audioManager.playUnlock();
            this.runUnlockAnimation();
        } else {
            audioManager.playClick();
            errorMsg.textContent = 'Incorrect password. Ask the sender for the secret code! 🔑';
            
            const card = document.querySelector('.lock-card');
            if (card) {
                card.style.animation = 'shakeCard 0.4s ease';
                setTimeout(() => card.style.animation = '', 400);
            }
        }
    }

    /* Stage 2: Magical Unlock Story */
    runUnlockAnimation() {
        this.showStage('unlocking');

        const fill = document.getElementById('unlock-progress-fill');
        const text = document.getElementById('unlock-anim-text');
        let progress = 0;

        const interval = setInterval(() => {
            progress += 10;
            if (fill) fill.style.width = `${progress}%`;

            if (progress === 40) {
                text.textContent = 'Preparing special moments... ✨';
            } else if (progress === 80) {
                text.textContent = 'Unwrapping affection... 💖';
            } else if (progress >= 100) {
                clearInterval(interval);
                
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.5 }
                });

                text.textContent = 'This surprise was made especially for you! ❤️';
                setTimeout(() => {
                    this.setupGreetingIntro();
                    this.showStage('intro');
                }, 800);
            }
        }, 150);
    }

    /* Stage 3: Greeting Intro */
    setupGreetingIntro() {
        const nameLbl = document.getElementById('lbl-rec-name');
        const subtextLbl = document.getElementById('lbl-rec-subtext');

        if (nameLbl) nameLbl.textContent = this.surpriseData.recipient_name;
        if (subtextLbl) {
            subtextLbl.textContent = `I made this special surprise just for you (${this.surpriseData.relationship || 'with love'}) ❤️`;
        }

        // Start ambient background music loop if chosen
        if (this.surpriseData.music_track) {
            audioManager.startMusicLoop(this.surpriseData.music_track);
        }
    }

    nextStage(stageName) {
        audioManager.playClick();
        if (stageName === 'memories') {
            if (this.surpriseData.memories && this.surpriseData.memories.length > 0) {
                this.setupMemoriesCarousel();
                this.showStage('memories');
            } else {
                this.showStage('envelope');
            }
        } else {
            this.showStage(stageName);
        }
    }

    /* Stage 4: Photo Memories Carousel */
    setupMemoriesCarousel() {
        this.currentMemoryIndex = 0;
        this.renderCurrentMemory();
    }

    renderCurrentMemory() {
        const memories = this.surpriseData.memories || [];
        if (!memories.length) return;

        const item = memories[this.currentMemoryIndex];
        const img = document.getElementById('img-memory-current');
        const caption = document.getElementById('lbl-memory-caption');
        const badge = document.getElementById('memories-counter-badge');
        const dotsContainer = document.getElementById('memory-dots-container');
        const banner = document.getElementById('memory-unavailable-banner');

        if (banner) banner.style.display = 'none';

        if (img) {
            img.style.display = 'block';
            img.src = item.url || '';
            const focus = item.focus || 'center';
            if (focus === 'top') {
                img.style.objectFit = 'cover';
                img.style.objectPosition = 'top center';
            } else if (focus === 'bottom') {
                img.style.objectFit = 'cover';
                img.style.objectPosition = 'bottom center';
            } else if (focus === 'contain') {
                img.style.objectFit = 'contain';
                img.style.objectPosition = 'center center';
                img.style.background = '#0f0a1c';
            } else {
                img.style.objectFit = 'cover';
                img.style.objectPosition = 'center center';
            }
        }
        if (caption) caption.textContent = item.caption || 'A special moment ❤️';
        if (badge) badge.textContent = `${this.currentMemoryIndex + 1} / ${memories.length}`;

        // Check if image URL is empty or invalid
        if (!item.url) {
            this.handleImageError(img);
        }

        if (dotsContainer) {
            dotsContainer.innerHTML = memories.map((_, i) => `
                <div class="memory-dot ${i === this.currentMemoryIndex ? 'active' : ''}"></div>
            `).join('');
        }

        const card = document.getElementById('active-memory-card');
        if (card) {
            card.style.animation = 'none';
            card.offsetHeight;
            card.style.animation = 'fadeInStage 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
        }
    }

    handleImageError(imgEl) {
        if (imgEl) imgEl.style.display = 'none';
        const banner = document.getElementById('memory-unavailable-banner');
        if (banner) banner.style.display = 'flex';
    }

    nextMemory() {
        const memories = this.surpriseData.memories || [];
        if (this.currentMemoryIndex < memories.length - 1) {
            this.currentMemoryIndex++;
            audioManager.playClick();
            this.renderCurrentMemory();
        }
    }

    prevMemory() {
        if (this.currentMemoryIndex > 0) {
            this.currentMemoryIndex--;
            audioManager.playClick();
            this.renderCurrentMemory();
        }
    }

    /* Stage 5: 3D Interactive Envelope */
    openEnvelope() {
        const wrapper = document.getElementById('envelope-wrapper');
        if (!wrapper || wrapper.classList.contains('open')) return;

        audioManager.playEnvelopeOpen();
        wrapper.classList.add('open');

        setTimeout(() => {
            confetti({
                particleCount: 40,
                spread: 50,
                origin: { y: 0.7 }
            });
        }, 400);

        setTimeout(() => {
            this.setupHandwrittenLetter();
            this.showStage('letter');
        }, 1200);
    }

    /* Stage 6: Handwritten Letter */
    setupHandwrittenLetter() {
        const toLbl = document.getElementById('lbl-letter-to');
        const bodyLbl = document.getElementById('lbl-letter-body');
        const fromLbl = document.getElementById('lbl-letter-from');
        const paper = document.getElementById('handwritten-paper');

        if (toLbl) toLbl.textContent = `To ${this.surpriseData.recipient_name} ❤️`;
        if (bodyLbl) bodyLbl.textContent = this.surpriseData.message;
        if (fromLbl) fromLbl.textContent = `${this.surpriseData.creator_name || 'Someone Special'} ❤️`;

        if (paper && this.surpriseData.font_family) {
            paper.style.fontFamily = `'${this.surpriseData.font_family}', cursive`;
        }

        audioManager.playSuccessChime();
    }

    async saveReactionNote() {
        const input = document.getElementById('input-recipient-reaction');
        const status = document.getElementById('lbl-reaction-status');
        const text = input ? input.value.trim() : '';

        if (!text) return;

        this.surpriseData.reaction_note = text;
        await storageManager.saveSurprise(this.surpriseData);

        if (status) {
            status.textContent = 'Reaction saved! The creator will see your note ❤️';
            status.style.color = '#2ed573';
        }
        audioManager.playSuccessChime();
    }

    replaySurprise() {
        const wrapper = document.getElementById('envelope-wrapper');
        if (wrapper) wrapper.classList.remove('open');
        this.currentMemoryIndex = 0;
        this.showStage('intro');
    }

    sendThankYouWhatsApp() {
        const creatorName = this.surpriseData.creator_name || 'you';
        const msg = `Thank you so much ${creatorName}! ❤️ I just received your beautiful surprise on MadeForYou and it made my day so special! ✨`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    }
}

const recipient = new RecipientJourney();

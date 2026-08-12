/* ==========================================================================
   MadeForYou - Creator Wizard Module
   Handles multi-step form navigation, template injection, image compression,
   theme & music preview, password hashing, link sharing, and dashboard management.
   ========================================================================== */

class CreatorWizard {
    constructor() {
        this.currentStep = 1;
        this.formData = {
            id: '',
            recipient_name: '',
            creator_name: '',
            relationship: 'My Love',
            occasion: 'Love',
            message: '',
            font_family: 'Dancing Script',
            theme: 'love',
            music_track: 'piano',
            password_raw: '',
            password_hash: '',
            use_recipient_pass: false,
            memories: []
        };
    }

    init() {
        this.bindEvents();
        this.updateStepUI();
        this.loadTemplates();
    }

    bindEvents() {
        // Relationship grid selection
        const relCards = document.querySelectorAll('#grid-relationships .option-card');
        relCards.forEach(card => {
            card.addEventListener('click', () => {
                relCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.formData.relationship = card.getAttribute('data-value');
                this.loadTemplates();
                audioManager.playClick();
            });
        });

        // Occasion grid selection
        const occCards = document.querySelectorAll('#grid-occasions .option-card');
        occCards.forEach(card => {
            card.addEventListener('click', () => {
                occCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.formData.occasion = card.getAttribute('data-value');
                this.loadTemplates();
                audioManager.playClick();
            });
        });

        // Sync recipient name changes
        const nameInput = document.getElementById('input-recipient-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                this.formData.recipient_name = e.target.value;
                this.updateRecipientPassLabel();
            });
        }

        // Creator name changes
        const creatorInput = document.getElementById('input-creator-name');
        if (creatorInput) {
            creatorInput.addEventListener('input', (e) => {
                this.formData.creator_name = e.target.value;
            });
        }
    }

    updateStepUI() {
        // Hide all steps, show active
        document.querySelectorAll('.wizard-page').forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(`wizard-step-${this.currentStep}`);
        if (activePage) activePage.classList.add('active');

        // Update stepper top bar
        document.querySelectorAll('.wizard-stepper .step-item').forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'), 10);
            if (stepNum <= this.currentStep) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    nextStep(targetStep) {
        // Validation check for Step 1
        if (this.currentStep === 1) {
            const name = document.getElementById('input-recipient-name').value.trim();
            if (!name) {
                app.showToast('Please enter the recipient\'s name ❤️', 'warning');
                document.getElementById('input-recipient-name').focus();
                return;
            }
            this.formData.recipient_name = name;
            this.formData.creator_name = document.getElementById('input-creator-name').value.trim() || 'Someone Special';
        }

        // Save message text on Step 2
        if (this.currentStep === 2) {
            const msg = document.getElementById('input-message-text').value.trim();
            if (!msg) {
                app.showToast('Please write a message or select a template 💌', 'warning');
                return;
            }
            this.formData.message = msg;
        }

        this.currentStep = targetStep;
        this.updateStepUI();
        audioManager.playClick();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    prevStep(targetStep) {
        this.currentStep = targetStep;
        this.updateStepUI();
        audioManager.playClick();
    }

    /* Template selection & insertion */
    loadTemplates() {
        const container = document.getElementById('template-chips');
        if (!container) return;

        const defaultMsg = getTemplateFor(this.formData.relationship, this.formData.occasion);
        const textarea = document.getElementById('input-message-text');

        if (textarea && (!textarea.value || textarea.value === defaultMsg)) {
            textarea.value = defaultMsg;
            this.formData.message = defaultMsg;
        }

        const options = [
            { label: '💖 Perfect Template', text: defaultMsg },
            { label: '🌹 Heartfelt Love', text: `Dearest ${this.formData.recipient_name || 'loved one'},\n\nEvery day with you is a gift. I cherish your smile, your warmth, and all the wonderful memories we share. You are truly my person! ❤️` },
            { label: '✨ Gratitude & Peace', text: `Dear ${this.formData.recipient_name || 'friend'},\n\nI just wanted to take a moment to say how much you mean to me. Thank you for always bringing so much light into my life! 🙏` }
        ];

        container.innerHTML = options.map((opt, i) => `
            <div class="template-chip" onclick="creator.applyTemplate('${i}')">
                ${opt.label}
            </div>
        `).join('');

        this.templateCache = options;
    }

    applyTemplate(index) {
        if (this.templateCache && this.templateCache[index]) {
            const textarea = document.getElementById('input-message-text');
            textarea.value = this.templateCache[index].text;
            this.formData.message = this.templateCache[index].text;
            audioManager.playClick();
            app.showToast('Template applied! ✨');
        }
    }

    insertEmoji(emoji) {
        const textarea = document.getElementById('input-message-text');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        textarea.value = text.substring(0, start) + emoji + text.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        this.formData.message = textarea.value;
    }

    updateFontFamily(font) {
        this.formData.font_family = font;
        const textarea = document.getElementById('input-message-text');
        if (textarea) textarea.style.fontFamily = `'${font}', sans-serif`;
    }

    /* Photo Upload & Compression Handler */
    handlePhotosUpload(event) {
        const files = Array.from(event.target.files);
        if (!files.length) return;

        if (this.formData.memories.length + files.length > 10) {
            app.showToast('You can upload up to 10 photos max! 📸', 'warning');
            return;
        }

        app.showToast('Processing photos...', 'info');

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.compressImage(e.target.result, 500, 0.55, (compressedDataUrl) => {
                    this.formData.memories.push({
                        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        url: compressedDataUrl,
                        caption: 'One of my favorite memories ❤️'
                    });
                    this.renderMemoriesList();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    compressImage(src, maxWidth, quality, callback) {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            callback(canvas.toDataURL('image/jpeg', quality));
        };
    }

    loadSamplePhotos() {
        const samples = [
            {
                url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
                caption: 'That beautiful sunny afternoon together ❤️'
            },
            {
                url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
                caption: 'One of our favorite celebration days ✨'
            },
            {
                url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=80',
                caption: 'Laughter, joy and happiness 🌸'
            }
        ];

        this.formData.memories = samples;
        this.renderMemoriesList();
        app.showToast('Sample demo photos added! 📸');
    }

    renderMemoriesList() {
        const container = document.getElementById('memories-list');
        if (!container) return;

        if (this.formData.memories.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = this.formData.memories.map((item, idx) => `
            <div class="memory-item-card">
                <div class="memory-thumb-box">
                    <img src="${item.url}" alt="Memory photo ${idx + 1}">
                    <button class="memory-delete-btn" onclick="creator.deleteMemory(${idx})" title="Remove Photo">
                        ✕
                    </button>
                </div>
                <div class="memory-caption-input">
                    <input type="text" class="form-control" value="${item.caption}" placeholder="Add a caption..." oninput="creator.updateMemoryCaption(${idx}, this.value)">
                </div>
            </div>
        `).join('');
    }

    deleteMemory(index) {
        this.formData.memories.splice(index, 1);
        this.renderMemoriesList();
        audioManager.playClick();
    }

    updateMemoryCaption(index, value) {
        if (this.formData.memories[index]) {
            this.formData.memories[index].caption = value;
        }
    }

    /* Themes & Music Picker */
    selectTheme(themeName) {
        this.formData.theme = themeName;
        document.querySelectorAll('.themes-grid .theme-card').forEach(card => {
            if (card.getAttribute('data-theme') === themeName) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        themeEngine.setTheme(themeName);
        audioManager.playClick();
    }

    selectMusicTrack(trackName) {
        this.formData.music_track = trackName;
        document.querySelectorAll('#music-tracks-grid .track-pill').forEach(pill => {
            if (pill.getAttribute('data-track') === trackName) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
        audioManager.playClick();
    }

    previewTrack(trackName) {
        audioManager.startMusicLoop(trackName);
    }

    /* Password Management */
    updateRecipientPassLabel() {
        const name = this.formData.recipient_name.trim();
        const label = document.getElementById('lbl-rec-pass-suggestion');
        if (label) {
            label.textContent = name ? name.toUpperCase() : 'SARAH';
        }
    }

    toggleRecipientPassword(isChecked) {
        this.formData.use_recipient_pass = isChecked;
        const passInput = document.getElementById('input-custom-password');
        if (isChecked) {
            const pass = (this.formData.recipient_name.trim() || 'SARAH').toUpperCase();
            passInput.value = pass;
            this.formData.password_raw = pass;
        }
    }

    onPasswordInput() {
        const passInput = document.getElementById('input-custom-password');
        this.formData.password_raw = passInput.value;
        const chk = document.getElementById('chk-use-recipient-pass');
        if (chk) chk.checked = false;
        this.formData.use_recipient_pass = false;
    }

    generateRandomPass() {
        const name = (this.formData.recipient_name.trim() || 'SARAH').toUpperCase();
        const year = new Date().getFullYear();
        const generated = `${name}${year}`;
        const passInput = document.getElementById('input-custom-password');
        passInput.value = generated;
        this.formData.password_raw = generated;
        audioManager.playClick();
    }

    /* Final Link Generation */
    async generateSurpriseLink() {
        try {
            if (!this.formData.password_raw) {
                this.formData.password_raw = (this.formData.recipient_name || 'SARAH').toUpperCase();
            }

            this.formData.password_hash = await storageManager.hashPassword(this.formData.password_raw);

            const saved = await storageManager.saveSurprise(this.formData);

            // Encode payload into URL for external devices
            let shareId = storageManager.encodeSurpriseToURL(saved);

            const baseUrl = window.location.origin + window.location.pathname;
            const fullShareUrl = `${baseUrl}#s/${shareId}`;
            this.finalShareUrl = fullShareUrl;

            const inputShare = document.getElementById('input-share-link');
            if (inputShare) inputShare.value = fullShareUrl;

            const lblRecName = document.getElementById('lbl-share-recipient-name');
            if (lblRecName) lblRecName.textContent = this.formData.recipient_name || 'Loved One';

            this.renderQRCode(fullShareUrl);

            if (window.audioManager) audioManager.playSuccessChime();
            if (typeof confetti === 'function') confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

            this.nextStep(6);
        } catch (err) {
            console.error("Error generating surprise link:", err);
            
            // Fallback guarantee
            const fallbackId = this.formData.id || storageManager.generateShortId();
            const baseUrl = window.location.origin + window.location.pathname;
            const fallbackUrl = `${baseUrl}#s/${fallbackId}`;
            this.finalShareUrl = fallbackUrl;

            const inputShare = document.getElementById('input-share-link');
            if (inputShare) inputShare.value = fallbackUrl;

            this.nextStep(6);
        }
    }

    renderQRCode(url) {
        const qrContainer = document.getElementById('qr-code-canvas');
        if (!qrContainer || typeof qrcode === 'undefined') return;

        const qr = qrcode(0, 'M');
        qr.addData(url);
        qr.make();
        qrContainer.innerHTML = qr.createImgTag(5, 10);
    }

    copyShareLink() {
        const input = document.getElementById('input-share-link');
        input.select();
        navigator.clipboard.writeText(input.value);
        app.showToast('Surprise link copied to clipboard! 📋');
        audioManager.playClick();
    }

    shareWhatsApp() {
        const name = this.formData.recipient_name;
        const message = `I made a little digital surprise especially for you ${name} ❤️\nOpen this when you have a quiet moment:\n\n${this.finalShareUrl}`;
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    }

    previewSurprise() {
        app.loadSurpriseData(this.formData, true);
    }

    /* Dashboard Renderer */
    async renderDashboard() {
        const container = document.getElementById('dashboard-surprises-list');
        if (!container) return;

        const list = await storageManager.getAllSurprises();
        if (!list || list.length === 0) {
            container.innerHTML = `
                <div class="empty-dashboard-card glass-panel text-center">
                    <span class="empty-icon">💌</span>
                    <h3>No Surprises Created Yet</h3>
                    <p>Create your first digital surprise for a loved one!</p>
                    <button class="btn btn-primary" onclick="app.startCreator()">Create a Surprise Now</button>
                </div>
            `;
            return;
        }

        const baseUrl = window.location.origin + window.location.pathname;

        container.innerHTML = list.map((item) => {
            const shareId = storageManager.encodeSurpriseToURL(item);
            const fullUrl = `${baseUrl}#s/${shareId}`;
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently';

            return `
                <div class="dash-surprise-card glass-panel">
                    <div class="dash-card-header">
                        <div>
                            <h3>For ${item.recipient_name} ❤️</h3>
                            <span class="dash-badge">${item.relationship || 'Special'} • ${item.occasion || 'Love'}</span>
                        </div>
                        <span class="dash-date">${dateStr}</span>
                    </div>

                    <p class="dash-message-preview">${(item.message || '').substring(0, 90)}...</p>

                    ${item.reaction_note ? `<div class="dash-reply-badge">💬 Reply from recipient: "${item.reaction_note}"</div>` : ''}

                    <div class="dash-card-actions">
                        <button class="btn btn-outline btn-sm" onclick="creator.copyCustomUrl('${fullUrl}')">
                            <i data-lucide="copy"></i> Copy Link
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="app.loadSurpriseData(${JSON.stringify(item).replace(/"/g, '&quot;')}, true)">
                            <i data-lucide="eye"></i> Preview
                        </button>
                        <button class="btn btn-ghost btn-sm text-danger" onclick="creator.deleteDashboardSurprise('${item.id}')">
                            <i data-lucide="trash-2"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    copyCustomUrl(url) {
        navigator.clipboard.writeText(url);
        app.showToast('Surprise link copied! 📋');
    }

    async deleteDashboardSurprise(id) {
        await storageManager.deleteSurprise(id);
        app.showToast('Surprise deleted.');
        this.renderDashboard();
    }
}

const creator = new CreatorWizard();

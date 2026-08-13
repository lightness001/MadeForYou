/* ==========================================================================
   MadeForYou - Application Controller & Router
   Manages top-level routes, navigation events, toasts, and demo loader
   ========================================================================== */

class AppController {
    constructor() {
        this.currentView = 'landing';
    }

    init() {
        // Initialize Theme Engine Canvas
        themeEngine.init();

        // Initialize Creator Wizard
        creator.init();

        // Check URL route hash e.g. #s/8F72KQ or #dashboard
        this.handleRouting();
        window.addEventListener('hashchange', () => this.handleRouting());

        // Initialize Lucide icons
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /* Router handler */
    async handleRouting() {
        const hash = window.location.hash.trim();
        const search = window.location.search.trim();

        let surpriseId = '';
        if (hash.startsWith('#s/')) {
            surpriseId = hash.substring(3);
        } else if (hash.startsWith('#/s/')) {
            surpriseId = hash.substring(4);
        } else if (hash.includes('/s/')) {
            surpriseId = hash.substring(hash.indexOf('/s/') + 3);
        } else if (search.includes('s=')) {
            const params = new URLSearchParams(search);
            surpriseId = params.get('s') || '';
        }

        // Clean up surpriseId: strip trailing slashes, spaces, or query parameters
        surpriseId = surpriseId.trim().replace(/\/+$/, '').split('?')[0].split('&')[0];

        if (surpriseId) {
            this.navigate('recipient');
            const res = await recipient.verifyAndLoadSurprise(surpriseId);
            if (!res.success) {
                recipient.showErrorStage(res.reason, res.title, res.details);
            }
            return;
        } else if (hash === '#create') {
            this.startCreator();
            return;
        } else if (hash === '#dashboard') {
            this.navigate('dashboard');
            creator.renderDashboard();
            return;
        }

        // Default view: Landing page
        this.navigate('landing');
    }

    navigate(viewName) {
        this.currentView = viewName;
        document.querySelectorAll('.view-screen').forEach(el => el.classList.remove('active'));

        const target = document.getElementById(`view-${viewName}`);
        if (target) target.classList.add('active');

        const header = document.getElementById('main-header');
        if (header) {
            header.style.display = (viewName === 'recipient') ? 'none' : 'flex';
        }

        if (viewName === 'dashboard') {
            creator.renderDashboard();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    startCreator() {
        window.location.hash = '#create';
        this.navigate('creator');
        creator.currentStep = 1;
        creator.updateStepUI();
    }

    loadSurpriseData(surpriseData, isPreview = false) {
        this.navigate('recipient');
        recipient.init(surpriseData, isPreview);
    }

    loadDemoSurprise() {
        const demoSurprise = {
            id: 'DEMO123',
            recipient_name: 'Sarah',
            creator_name: 'Lightness',
            relationship: 'My Love',
            occasion: 'Love',
            message: `To my beautiful Sarah ❤️\n\nSometimes I don't say it enough, but I want you to know how much I appreciate everything about you. Your laughter brightens my darkest days, and your warmth makes the world a better place.\n\nThank you for your love, your patience, and all the beautiful moments we share together. I love you! ❤️`,
            font_family: 'Dancing Script',
            theme: 'love',
            music_track: 'piano',
            password_hash: '',
            memories: [
                {
                    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
                    caption: 'Our first unforgettable trip together ✈️'
                },
                {
                    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
                    caption: 'One of my absolute favorite memories with you... 💕'
                },
                {
                    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=80',
                    caption: 'Your smile makes everything brighter 🌸'
                }
            ]
        };

        storageManager.hashPassword('SARAH').then(hash => {
            demoSurprise.password_hash = hash;
            this.loadSurpriseData(demoSurprise, false);
        });
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

const app = new AppController();
document.addEventListener('DOMContentLoaded', () => app.init());

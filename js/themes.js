/* ==========================================================================
   MadeForYou - Dynamic Theme Canvas & Particle Physics Engine
   Renders animated floating elements tailored to selected themes
   ========================================================================== */

class ThemeEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.currentTheme = 'love';
        this.animationId = null;
    }

    init() {
        this.canvas = document.getElementById('bg-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.createParticles();
        this.animate();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setTheme(themeName) {
        this.currentTheme = themeName;
        document.body.setAttribute('data-theme', themeName);
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const count = window.innerWidth < 640 ? 25 : 50;

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 14 + 8,
                speedY: Math.random() * 0.8 + 0.3,
                speedX: Math.sin(Math.random() * Math.PI) * 0.5,
                opacity: Math.random() * 0.6 + 0.2,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.02,
                type: this.getParticleTypeForTheme(this.currentTheme)
            });
        }
    }

    getParticleTypeForTheme(theme) {
        const types = {
            love: ['❤️', '💖', '💕', '💗'],
            soft: ['🌸', '🍃', '🌺', '✨'],
            dream: ['✨', '⭐', '🌙', '💫'],
            peace: ['🫧', '🌊', '💧', '✨'],
            birthday: ['🎈', '🎉', '🎁', '✨'],
            happiness: ['☀️', '💛', '🌟', '😊'],
            letter: ['📜', '✉️', '✨', '🍂'],
            gold: ['⭐', '👑', '✨', '💎']
        };
        const list = types[theme] || types.love;
        return list[Math.floor(Math.random() * list.length)];
    }

    animate() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p) => {
            p.y -= p.speedY;
            p.x += Math.sin(p.y * 0.01) * p.speedX;
            p.rotation += p.rotSpeed;

            // Reset particle when it floats off top
            if (p.y < -30) {
                p.y = this.canvas.height + 30;
                p.x = Math.random() * this.canvas.width;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.font = `${p.size}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.type, 0, 0);
            this.ctx.restore();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

const themeEngine = new ThemeEngine();

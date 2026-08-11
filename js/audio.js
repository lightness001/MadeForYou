/* ==========================================================================
   MadeForYou - Web Audio API Sound Synthesizer & Ambient Music Engine
   Generates warm interactive sound FX & ambient musical loops using pure Web Audio API
   ========================================================================== */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isPlayingMusic = false;
        this.musicInterval = null;
        this.currentTrack = 'piano';
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const btn = document.getElementById('btn-sound-toggle');
        if (btn) {
            btn.innerHTML = this.isMuted 
                ? `<i data-lucide="volume-x"></i> Muted` 
                : `<i data-lucide="volume-2"></i> Sound`;
            if (window.lucide) lucide.createIcons();
        }

        if (this.isMuted && this.isPlayingMusic) {
            this.stopMusicLoop();
        }

        return this.isMuted;
    }

    playClick() {
        if (this.isMuted) return;
        this.init();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playUnlock() {
        if (this.isMuted) return;
        this.init();

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.1);

            gain.gain.setValueAtTime(0, this.ctx.currentTime + index * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, this.ctx.currentTime + index * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.1 + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + index * 0.1);
            osc.stop(this.ctx.currentTime + index * 0.1 + 0.45);
        });
    }

    playEnvelopeOpen() {
        if (this.isMuted) return;
        this.init();

        // Soft paper rustle sound via filtered noise
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 3;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    playSuccessChime() {
        if (this.isMuted) return;
        this.init();

        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(this.ctx.currentTime + idx * 0.08);
            osc.stop(this.ctx.currentTime + idx * 0.08 + 0.35);
        });
    }

    /* Ambient Music Loop Player */
    startMusicLoop(trackName = 'piano') {
        if (this.isMuted) return;
        this.init();
        this.stopMusicLoop();
        this.currentTrack = trackName;
        this.isPlayingMusic = true;

        const bar = document.getElementById('audio-control-bar');
        const label = document.getElementById('lbl-current-playing-track');
        if (bar) bar.style.display = 'flex';
        if (label) {
            const names = {
                piano: 'Playing: Soft Romantic Piano',
                lofi: 'Playing: Acoustic Lofi Chill',
                celebration: 'Playing: Festive Party Chime',
                ocean: 'Playing: Serene Ocean Ambient'
            };
            label.textContent = names[trackName] || 'Playing: Ambient Music';
        }

        const icon = document.getElementById('icon-music-state');
        if (icon && window.lucide) {
            icon.setAttribute('data-lucide', 'pause-circle');
            lucide.createIcons();
        }

        // Musical scales (Frequencies in Hz)
        const scales = {
            piano: [261.63, 329.63, 392.00, 523.25, 659.25], // C Major Pentatonic
            lofi: [220.00, 261.63, 329.63, 392.00, 440.00], // A Minor
            celebration: [293.66, 369.99, 440.00, 587.33, 739.99], // D Major
            ocean: [174.61, 220.00, 261.63, 349.23, 440.00] // F Warm Pad
        };

        const notes = scales[trackName] || scales.piano;
        let step = 0;

        this.musicInterval = setInterval(() => {
            if (!this.isPlayingMusic || this.isMuted) return;

            const freq = notes[step % notes.length];
            step++;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = (trackName === 'ocean') ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 2.0);
        }, (trackName === 'ocean') ? 1400 : 700);
    }

    stopMusicLoop() {
        this.isPlayingMusic = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        const bar = document.getElementById('audio-control-bar');
        if (bar) bar.style.display = 'none';
    }

    toggleMusicLoop() {
        if (this.isPlayingMusic) {
            this.stopMusicLoop();
        } else {
            this.startMusicLoop(this.currentTrack);
        }
    }
}

const audioManager = new AudioManager();

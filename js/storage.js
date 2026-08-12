/* ==========================================================================
   MadeForYou - Hybrid Data Storage Engine
   Supports IndexedDB local storage, URL-Safe compressed payloads, and Supabase DB sync
   ========================================================================== */

class StorageManager {
    constructor() {
        this.dbName = 'MadeForYouDB';
        this.dbVersion = 1;
        this.db = null;
        this.initIndexedDB();

        // Optional Supabase Realtime Database Integration
        this.supabaseUrl = window.SUPABASE_URL || '';
        this.supabaseKey = window.SUPABASE_ANON_KEY || '';
        this.supabase = (window.supabase && this.supabaseUrl && this.supabaseKey)
            ? window.supabase.createClient(this.supabaseUrl, this.supabaseKey)
            : null;
    }

    initIndexedDB() {
        return new Promise((resolve) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('surprises')) {
                    db.createObjectStore('surprises', { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                resolve(null);
            };
        });
    }

    generateShortId() {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async hashPassword(password) {
        if (!password) return '';
        const encoder = new TextEncoder();
        const data = encoder.encode(password.trim().toLowerCase());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async saveSurprise(surpriseData) {
        if (!surpriseData.id) {
            surpriseData.id = this.generateShortId();
        }

        surpriseData.created_at = surpriseData.created_at || new Date().toISOString();

        if (this.db) {
            await new Promise((resolve) => {
                const tx = this.db.transaction('surprises', 'readwrite');
                const store = tx.objectStore('surprises');
                store.put(surpriseData);
                tx.oncomplete = () => resolve();
            });
        }

        localStorage.setItem(`mfy_surprise_${surpriseData.id}`, JSON.stringify(surpriseData));

        // Maintain list of surprise IDs in LocalStorage
        let ids = JSON.parse(localStorage.getItem('mfy_surprise_ids') || '[]');
        if (!ids.includes(surpriseData.id)) {
            ids.push(surpriseData.id);
            localStorage.setItem('mfy_surprise_ids', JSON.stringify(ids));
        }

        // Sync to Supabase cloud database if configured
        if (this.supabase) {
            try {
                await this.supabase.from('surprises').upsert({
                    id: surpriseData.id,
                    short_code: surpriseData.id,
                    recipient_name: surpriseData.recipient_name,
                    creator_name: surpriseData.creator_name,
                    relationship: surpriseData.relationship,
                    occasion: surpriseData.occasion,
                    password_hash: surpriseData.password_hash,
                    password_raw: surpriseData.password_raw || '',
                    message: surpriseData.message,
                    font_family: surpriseData.font_family,
                    theme: surpriseData.theme,
                    music_track: surpriseData.music_track,
                    reaction_note: surpriseData.reaction_note || '',
                    created_at: surpriseData.created_at
                });
            } catch (e) {
                console.warn("Supabase DB sync warning:", e);
            }
        }

        return surpriseData;
    }

    async getSurprise(id) {
        if (!id) return null;

        // Clean id string from trailing slashes, spaces, or query parameters
        id = id.trim().replace(/\/+$/, '').split('?')[0].split('&')[0];

        // Handle URL-safe Payload
        if (id.startsWith('payload_')) {
            try {
                let base64Data = id.replace('payload_', '');
                base64Data = decodeURIComponent(base64Data);
                base64Data = base64Data.replace(/-/g, '+').replace(/_/g, '/');
                
                while (base64Data.length % 4 !== 0) {
                    base64Data += '=';
                }

                const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(base64Data), (c) => {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const compactObj = JSON.parse(jsonStr);
                return this.decodeCompactPayload(compactObj);
            } catch (e) {
                console.error("Failed to parse URL payload:", e);
            }
        }

        // Handle LocalStorage lookup
        const localData = localStorage.getItem(`mfy_surprise_${id}`);
        if (localData) {
            return JSON.parse(localData);
        }

        // Handle IndexedDB lookup
        if (this.db) {
            const fromIDB = await new Promise((resolve) => {
                const tx = this.db.transaction('surprises', 'readonly');
                const store = tx.objectStore('surprises');
                const req = store.get(id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
            if (fromIDB) return fromIDB;
        }

        // Handle Supabase lookup
        if (this.supabase) {
            try {
                const { data } = await this.supabase.from('surprises').select('*').eq('id', id).single();
                if (data) return data;
            } catch (e) {
                console.warn("Supabase fetch warning:", e);
            }
        }

        return null;
    }

    async getAllSurprises() {
        if (this.db) {
            const list = await new Promise((resolve) => {
                const tx = this.db.transaction('surprises', 'readonly');
                const store = tx.objectStore('surprises');
                const req = store.getAll();
                req.onsuccess = () => resolve(req.result || []);
                req.onerror = () => resolve([]);
            });
            if (list.length > 0) return list;
        }

        const ids = JSON.parse(localStorage.getItem('mfy_surprise_ids') || '[]');
        const results = [];
        for (let id of ids) {
            const item = await this.getSurprise(id);
            if (item) results.push(item);
        }
        return results;
    }

    async deleteSurprise(id) {
        if (this.db) {
            const tx = this.db.transaction('surprises', 'readwrite');
            const store = tx.objectStore('surprises');
            store.delete(id);
        }
        localStorage.removeItem(`mfy_surprise_${id}`);

        let ids = JSON.parse(localStorage.getItem('mfy_surprise_ids') || '[]');
        ids = ids.filter(i => i !== id);
        localStorage.setItem('mfy_surprise_ids', JSON.stringify(ids));

        if (this.supabase) {
            try {
                await this.supabase.from('surprises').delete().eq('id', id);
            } catch (e) {
                console.warn("Supabase delete warning:", e);
            }
        }
    }

    encodeSurpriseToURL(surpriseData) {
        try {
            const sanitizedMemories = (surpriseData.memories || []).map(m => {
                return {
                    url: m.url || '',
                    caption: m.caption || '',
                    focus: m.focus || 'center'
                };
            });

            const compact = {
                id: surpriseData.id,
                n: surpriseData.recipient_name,
                c: surpriseData.creator_name,
                r: surpriseData.relationship,
                o: surpriseData.occasion,
                m: surpriseData.message,
                f: surpriseData.font_family,
                t: surpriseData.theme,
                s: surpriseData.music_track || 'piano',
                ph: surpriseData.password_hash,
                pr: surpriseData.password_raw || '',
                imgs: sanitizedMemories
            };
            const jsonStr = JSON.stringify(compact);
            
            let base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));

            base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            
            return `payload_${base64}`;
        } catch (e) {
            console.error("Encoding error:", e);
            return surpriseData.id;
        }
    }

    decodeCompactPayload(compact) {
        const rawMemories = compact.imgs || compact.memories || [];
        return {
            id: compact.id,
            recipient_name: compact.n || compact.recipient_name || '',
            creator_name: compact.c || compact.creator_name || 'Someone Special',
            relationship: compact.r || compact.relationship || 'My Love',
            occasion: compact.o || compact.occasion || 'Love',
            message: compact.m || compact.message || '',
            font_family: compact.f || compact.font_family || 'Dancing Script',
            theme: compact.t || compact.theme || 'love',
            music_track: compact.s || compact.music_track || 'piano',
            password_hash: compact.ph || compact.password_hash || '',
            password_raw: compact.pr || compact.password_raw || '',
            memories: rawMemories.map(m => ({
                url: m.url || '',
                caption: m.caption || '',
                focus: m.focus || 'center'
            }))
        };
    }
}

const storageManager = new StorageManager();

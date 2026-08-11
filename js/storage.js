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

        return surpriseData;
    }

    async getSurprise(id) {
        if (!id) return null;

        // Handle URL-safe Payload
        if (id.startsWith('payload_')) {
            try {
                let base64Data = id.replace('payload_', '');
                // Handle URL decoding if browser encoded characters
                base64Data = decodeURIComponent(base64Data);
                // Restore URL-safe characters (- to +, _ to /)
                base64Data = base64Data.replace(/-/g, '+').replace(/_/g, '/');
                
                // Add padding if missing
                while (base64Data.length % 4 !== 0) {
                    base64Data += '=';
                }

                // Decode UTF-8 string from Base64
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
    }

    encodeSurpriseToURL(surpriseData) {
        try {
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
                imgs: surpriseData.memories || []
            };
            const jsonStr = JSON.stringify(compact);
            
            // Encode to UTF-8 Base64
            let base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
                return String.fromCharCode('0x' + p1);
            }));

            // Make URL-Safe (replace + with -, / with _, remove =)
            base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            
            return `payload_${base64}`;
        } catch (e) {
            console.error("Encoding error:", e);
            return surpriseData.id;
        }
    }

    decodeCompactPayload(compact) {
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
            memories: compact.imgs || compact.memories || []
        };
    }
}

const storageManager = new StorageManager();

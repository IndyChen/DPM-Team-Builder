// src/core/avatarStorage.js

const DB_NAME = 'WutheringAvatarDB';
const STORE_NAME = 'custom_avatars';

let dbPromise = null;
const urlCache = new Map();

function getDB() {
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'charName' });
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => {
                dbPromise = null;
                reject(e.target.error);
            };
        });
    }
    return dbPromise;
}

export const avatarStorage = {
    async saveAvatar(charName, fileBlob) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.put({ charName, blob: fileBlob });
            
            request.onsuccess = () => {
                if (urlCache.has(charName)) {
                    URL.revokeObjectURL(urlCache.get(charName));
                    urlCache.delete(charName);
                }
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    async getAvatar(charName) {
        if (urlCache.has(charName)) {
            return urlCache.get(charName);
        }
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(charName);
            
            request.onsuccess = () => {
                if (request.result && request.result.blob) {
                    const objUrl = URL.createObjectURL(request.result.blob);
                    urlCache.set(charName, objUrl);
                    resolve(objUrl);
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },

    async deleteAvatar(charName) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(charName);
            
            request.onsuccess = () => {
                if (urlCache.has(charName)) {
                    URL.revokeObjectURL(urlCache.get(charName));
                    urlCache.delete(charName);
                }
                resolve(true);
            };
            request.onerror = () => reject(request.error);
        });
    }
};
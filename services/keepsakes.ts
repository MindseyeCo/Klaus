
import { NexusPost } from '../types';

const DB_NAME = 'KlausNexusDB_V2'; // Version bump for clean slate
const STORE_NAME = 'keepsakes';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

// Initialize and Cache DB Connection
const getDB = (): Promise<IDBDatabase> => {
    if (dbInstance) return Promise.resolve(dbInstance);

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('savedAt', 'savedAt', { unique: false });
                store.createIndex('mediaType', 'mediaType', { unique: false });
            }
        };

        request.onsuccess = (e) => {
            dbInstance = (e.target as IDBOpenDBRequest).result;
            resolve(dbInstance);
        };

        request.onerror = (e) => {
            console.error("IndexedDB Error:", (e.target as IDBOpenDBRequest).error);
            reject((e.target as IDBOpenDBRequest).error);
        };
    });
};

// --- CRUD Operations ---

export const saveLocalKeepsake = async (item: NexusPost) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        // Ensure savedAt exists for sorting
        const entry = { ...item, savedAt: item.createdAt || Date.now() };
        const req = store.put(entry);
        
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

export const removeLocalKeepsake = async (id: string) => {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

export const getLocalKeepsakes = async (): Promise<NexusPost[]> => {
    const db = await getDB();
    return new Promise<NexusPost[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        // Get all items
        const req = store.getAll();
        
        req.onsuccess = () => {
            // Sort by savedAt desc in memory (fast enough for <10k items)
            const res = req.result as NexusPost[];
            res.sort((a: any, b: any) => (b.savedAt || 0) - (a.savedAt || 0));
            resolve(res);
        };
        req.onerror = () => reject(req.error);
    });
};

export const checkKeepsakeExists = async (id: string): Promise<boolean> => {
    const db = await getDB();
    return new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getKey(id);
        req.onsuccess = () => resolve(req.result !== undefined);
        req.onerror = () => reject(req.error);
    });
}

// --- Backup System ---

export const exportCollections = async (): Promise<string> => {
    const items = await getLocalKeepsakes();
    const data = {
        version: "Klaus_Collection_V1",
        exportedAt: Date.now(),
        items: items
    };
    return JSON.stringify(data, null, 2);
};

export const importCollections = async (jsonString: string): Promise<number> => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.items || !Array.isArray(data.items)) throw new Error("Invalid Format");
        
        const db = await getDB();
        return new Promise<number>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            let count = 0;
            
            data.items.forEach((item: NexusPost) => {
                store.put(item);
                count++;
            });

            tx.oncomplete = () => resolve(count);
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        throw new Error("Import Failed: Corrupt Data");
    }
};

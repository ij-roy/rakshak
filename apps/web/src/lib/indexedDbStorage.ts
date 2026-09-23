import type { SaveRepository } from '@rakshak/storage';

const DB_NAME = 'rakshak-saves';
const STORE = 'kv';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/** Web SaveRepository backed by IndexedDB. */
export function createIndexedDbRepository(): SaveRepository {
  return {
    async read(slot) {
      const db = await openDb();
      try {
        return await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction(STORE, 'readonly');
          const req = tx.objectStore(STORE).get(slot);
          req.onsuccess = () => {
            const v = req.result;
            resolve(typeof v === 'string' ? v : v == null ? null : String(v));
          };
          req.onerror = () => reject(req.error);
        });
      } finally {
        db.close();
      }
    },
    async write(slot, payload) {
      const db = await openDb();
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(payload, slot);
        await txDone(tx);
      } finally {
        db.close();
      }
    },
    async remove(slot) {
      const db = await openDb();
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(slot);
        await txDone(tx);
      } finally {
        db.close();
      }
    },
  };
}

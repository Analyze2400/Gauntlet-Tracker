import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, query, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface GameEntry {
  game: string;
  players: string[];
  winCounts?: Record<string, number>;
  winners?: string[]; // Keep for backward compatibility
  timestamp: number;
}

export interface Player {
  name: string;
  points: number;
  history: GameEntry[];
}

export interface AppData {
  players: Record<string, Player>;
  entries: GameEntry[];
}

export const getAppData = async (): Promise<AppData> => {
  try {
    const entriesSnapshot = await getDocs(query(collection(db, 'entries'), orderBy('timestamp', 'desc')));
    const playersSnapshot = await getDocs(collection(db, 'players'));

    const entries: GameEntry[] = entriesSnapshot.docs.map(doc => {
      const data = doc.data() as GameEntry;
      if (data.winCounts) return data;
      // Backward compatibility
      const winCounts: Record<string, number> = {};
      data.winners?.forEach((w: string) => winCounts[w] = 1);
      return { ...data, winCounts };
    });
    const players: Record<string, Player> = {};
    
    playersSnapshot.docs.forEach(doc => {
      players[doc.id] = doc.data() as Player;
    });

    return { players, entries };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'entries/players');
  }
};

export const addEntry = async (entry: GameEntry) => {
  try {
    const batch = writeBatch(db);

    // Add entry
    const entryRef = doc(collection(db, 'entries'));
    batch.set(entryRef, entry);

    // Calculate total wins by others for each player
    const totalWins = entry.winCounts ? Object.values(entry.winCounts).reduce((a, b) => a + b, 0) : 0;

    // Update players
    for (const playerName of entry.players) {
      const playerRef = doc(db, 'players', playerName);
      const playerDoc = await getDocs(query(collection(db, 'players'))).then(snapshot => snapshot.docs.find(d => d.id === playerName));
      
      const wins = (entry.winCounts && entry.winCounts[playerName]) || 0;
      const winsByOthers = totalWins - wins;
      const pointsToAdd = (100 * wins) + (25 * winsByOthers);

      if (playerDoc) {
        const playerData = playerDoc.data() as Player;
        batch.update(playerRef, {
          points: playerData.points + pointsToAdd,
          history: [...playerData.history, entry]
        });
      } else {
        batch.set(playerRef, {
          name: playerName,
          points: pointsToAdd,
          history: [entry]
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'entries/players');
  }
};

export const resetData = async () => {
  try {
    const batch = writeBatch(db);
    const entriesSnapshot = await getDocs(collection(db, 'entries'));
    const playersSnapshot = await getDocs(collection(db, 'players'));

    entriesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    playersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'entries/players');
  }
};

export const deletePlayer = async (playerName: string) => {
  try {
    await deleteDoc(doc(db, 'players', playerName));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'players');
  }
};

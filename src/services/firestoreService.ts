import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, query, orderBy, writeBatch } from 'firebase/firestore';

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
  winners: string[];
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

    const entries: GameEntry[] = entriesSnapshot.docs.map(doc => doc.data() as GameEntry);
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

    // Update players
    for (const playerName of entry.players) {
      const playerRef = doc(db, 'players', playerName);
      const playerDoc = await getDocs(query(collection(db, 'players'))).then(snapshot => snapshot.docs.find(d => d.id === playerName));
      
      const isWinner = entry.winners.includes(playerName);
      const pointsToAdd = isWinner ? 100 : 25;

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

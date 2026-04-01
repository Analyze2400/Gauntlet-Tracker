import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

interface Player {
  name: string;
  points: number;
  history: GameEntry[];
}

interface GameEntry {
  game: string;
  players: string[];
  winners: string[];
  timestamp: number;
}

const DATA_FILE = path.join(process.cwd(), "data.json");

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  }
  return { players: {}, entries: [] };
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    res.json(loadData());
  });

  app.post("/api/entries", (req, res) => {
    const { game, players, winners } = req.body;
    const data = loadData();

    const entry: GameEntry = {
      game,
      players,
      winners,
      timestamp: Date.now(),
    };

    data.entries.push(entry);

    players.forEach((name: string) => {
      if (!data.players[name]) {
        data.players[name] = { name, points: 0, history: [] };
      }
      
      const isWinner = winners.includes(name);
      data.players[name].points += isWinner ? 100 : 25;
      data.players[name].history.push(entry);
    });

    saveData(data);
    res.json({ success: true, data });
  });

  app.post("/api/debug/wipe", (req, res) => {
    saveData({ players: {}, entries: [] });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trophy, Gamepad2, X, ChevronRight, Info, LogIn, Trash2 } from "lucide-react";
import { cn } from "./lib/utils";
import { getAppData, addEntry, resetData, deletePlayer, GameEntry, Player, AppData } from "./services/firestoreService";
import { auth } from "./lib/firebase";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";

// nice

const Home = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const fetchData = async () => {
    const appData = await getAppData();
    setData(appData);
  };

  const sortedPlayers: Player[] = data 
    ? (Object.values(data.players) as Player[]).sort((a, b) => b.points - a.points)
    : [];

  const displayPlayers = [...sortedPlayers];
  if (displayPlayers.length < 5) {
    while (displayPlayers.length < 5) {
      displayPlayers.push({ name: "NULL", points: 0, history: [] });
    }
  }

  const gameTitles: string[] = data 
    ? Array.from(new Set(data.entries.map(e => e.game)))
    : [];

  const rows: string[][] = [];
  for (let i = 0; i < gameTitles.length; i += 5) {
    rows.push(gameTitles.slice(i, i + 5));
  }

  const existingPlayerNames = data ? Object.keys(data.players) : [];

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl md:text-2xl font-mono tracking-widest uppercase glow-text text-[#00ffcc]">
            Gauntlet Tracker
          </h1>
          <Link to="/rules" className="text-xs uppercase tracking-widest text-white/50 hover:text-[#00ffcc] transition-colors flex items-center gap-1">
            <Info size={14} /> Rules
          </Link>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              {user.email === "ana1yze2400@gmail.com" && (
                <button 
                  onClick={async () => {
                    if (confirm("Are you sure you want to reset all data?")) {
                      await resetData();
                      window.location.reload();
                    }
                  }}
                  className="sci-fi-border bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-2 min-h-[44px] text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                >
                  <Trash2 size={16} /> Reset
                </button>
              )}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="sci-fi-border bg-white/5 hover:bg-[#00ffcc]/10 text-white px-4 py-2 min-h-[44px] text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Plus size={16} /> New Entry
              </button>
            </>
          ) : (
            <button 
              onClick={signIn}
              className="sci-fi-border bg-white/5 hover:bg-[#00ffcc]/10 text-white px-4 py-2 min-h-[44px] text-xs uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <LogIn size={16} /> Sign In
            </button>
          )}
        </div>
      </header>

      <section className="mb-24">
        <h2 className="text-xs uppercase tracking-[0.3em] text-white/30 mb-8 flex items-center gap-2">
          <Trophy size={14} /> Top Contenders
        </h2>
        <div className="grid gap-4">
          {displayPlayers.map((player, idx) => (
            <motion.div
              key={player.name + idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => player.name !== "NULL" && setSelectedPlayer(player)}
              className={cn(
                "group flex items-center justify-between p-4 bg-white/5 border border-white/5 transition-all min-h-[60px]",
                player.name !== "NULL" ? "hover:border-[#00ffcc]/30 cursor-pointer" : "opacity-30"
              )}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <span className="font-mono text-white/20 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                <span className="text-base md:text-lg tracking-wide group-hover:text-[#00ffcc] transition-colors">{player.name}</span>
              </div>
              <div className="flex items-center gap-4 md:gap-8">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-white/30">Points</div>
                  <div className="font-mono text-lg md:text-xl text-[#00ffcc]">{player.name === "NULL" ? "NULL" : player.points}</div>
                </div>
                {player.name !== "NULL" && <ChevronRight size={20} className="text-white/10 group-hover:text-[#00ffcc] transition-colors" />}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="pt-24 border-t border-white/10">
        <h2 className="text-lg md:text-xl font-mono tracking-[0.4em] uppercase text-center mb-12 glow-text">
          Gauntlet Contenders
        </h2>
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="marquee-container border-y border-white/5">
              <div className={cn(
                "marquee-track flex gap-12 md:gap-24 items-center",
                idx % 2 === 0 ? "animate-marquee-right" : "animate-marquee-left"
              )}>
                {[...row, ...row].map((game, gIdx) => (
                  <span key={gIdx} className={cn(
                    "text-lg md:text-2xl font-mono uppercase tracking-widest text-white/40 whitespace-nowrap",
                    gIdx === row.length * 2 - 1 ? "pr-12 md:pr-24" : ""
                  )}>
                    {game}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="text-center py-8 text-white/10 uppercase tracking-widest text-xs">
              Waiting for games...
            </div>
          )}
        </div>
      </section>

      <footer className="mt-24 pt-12 border-t border-white/10 text-center">
      </footer>

      <AnimatePresence>
        {isModalOpen && (
          <NewEntryModal 
            existingPlayers={existingPlayerNames}
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
              setIsModalOpen(false);
              fetchData();
            }} 
          />
        )}
        {selectedPlayer && (
          <PlayerDetailsModal 
            player={selectedPlayer} 
            onClose={() => setSelectedPlayer(null)} 
            onSuccess={() => { setSelectedPlayer(null); fetchData(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const NewEntryModal = ({ existingPlayers, onClose, onSuccess }: { existingPlayers: string[], onClose: () => void, onSuccess: () => void }) => {
  const [game, setGame] = useState("");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [winCounts, setWinCounts] = useState<Record<string, number>>({});
  const [customNames, setCustomNames] = useState<Record<number, string>>({});
  const [user] = useState<User | null>(auth.currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPlayers = playerNames.map((name, idx) => name === "CUSTOM" ? customNames[idx] : name).filter(n => n && n.trim() !== "");
    if (validPlayers.length < 2) return alert("Minimum 2 players required");
    
    const finalWinCounts: Record<string, number> = {};
    validPlayers.forEach(p => finalWinCounts[p] = winCounts[p] || 0);
    
    if (Object.values(finalWinCounts).reduce((a, b) => a + b, 0) === 0) return alert("At least one win must be recorded");

    const res = await addEntry({ game, players: validPlayers, winCounts: finalWinCounts, timestamp: Date.now() });
    onSuccess();
  };

  const removePlayer = (idx: number) => {
    const newNames = [...playerNames];
    newNames.splice(idx, 1);
    setPlayerNames(newNames);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0a0a0a] border border-white/10 p-8 w-full max-w-md sci-fi-border"
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-mono uppercase tracking-widest glow-text">Submit Entry</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Game Title</label>
            <input 
              required
              value={game}
              onChange={e => setGame(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-[#00ffcc] outline-none transition-all font-mono"
              placeholder="ENTER GAME NAME"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">Players & Wins</label>
            <div className="space-y-3">
              {playerNames.map((name, idx) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <select
                      value={name}
                      onChange={e => {
                        const newNames = [...playerNames];
                        newNames[idx] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-[#00ffcc] outline-none transition-all font-mono text-sm"
                    >
                      <option value="">Select Player</option>
                      {existingPlayers.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="CUSTOM">Add New Player...</option>
                    </select>
                    {name === "CUSTOM" && (
                      <input 
                        required
                        value={customNames[idx] || ""}
                        onChange={e => setCustomNames({...customNames, [idx]: e.target.value})}
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white focus:border-[#00ffcc] outline-none transition-all font-mono text-sm"
                        placeholder="Player Name"
                      />
                    )}
                  </div>
                  {name && (name !== "CUSTOM" || customNames[idx]?.trim()) && (
                    <input
                      type="number"
                      min="0"
                      value={winCounts[name === "CUSTOM" ? customNames[idx] : name] || 0}
                      onChange={e => {
                        const pName = name === "CUSTOM" ? customNames[idx] : name;
                        setWinCounts({...winCounts, [pName]: parseInt(e.target.value) || 0});
                      }}
                      className="w-16 bg-white/5 border border-white/10 px-2 py-2 text-white text-center focus:border-[#00ffcc] outline-none transition-all font-mono text-sm"
                    />
                  )}
                  {user?.email === "ana1yze2400@gmail.com" && (
                    <button
                      type="button"
                      onClick={() => removePlayer(idx)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
              {playerNames.length < 6 && (
                <button 
                  type="button"
                  onClick={() => setPlayerNames([...playerNames, ""])}
                  className="text-[10px] uppercase tracking-widest text-[#00ffcc]/60 hover:text-[#00ffcc] transition-colors"
                >
                  + Add Player
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#00ffcc] text-black py-4 font-mono uppercase tracking-[0.2em] hover:bg-[#00ffcc]/80 transition-all font-bold"
          >
            Transmit Data
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ConfirmationModal = ({ message, onConfirm, onCancel }: { message: string, onConfirm: () => void, onCancel: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
  >
    <div className="bg-[#0a0a0a] border border-white/10 p-8 w-full max-w-sm sci-fi-border">
      <p className="text-white mb-8 font-mono">{message}</p>
      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 font-mono uppercase tracking-widest transition-all">Cancel</button>
        <button onClick={onConfirm} className="flex-1 bg-red-900/20 hover:bg-red-900/40 text-red-400 py-3 font-mono uppercase tracking-widest transition-all">Confirm</button>
      </div>
    </div>
  </motion.div>
);

const PlayerDetailsModal = ({ player, onClose, onSuccess }: { player: Player, onClose: () => void, onSuccess: () => void }) => {
  const [user] = useState<User | null>(auth.currentUser);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    await deletePlayer(player.name);
    onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <AnimatePresence>
        {showConfirm && (
          <ConfirmationModal 
            message="Are you sure you want to remove this player?"
            onConfirm={handleDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </AnimatePresence>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="bg-[#0a0a0a] border border-white/10 p-8 w-full max-w-2xl sci-fi-border max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-12">
          <div>
            <h3 className="text-3xl font-mono uppercase tracking-widest glow-text mb-2">{player.name}</h3>
            <div className="flex gap-8">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30">Overall Score</div>
                <div className="text-2xl font-mono text-[#00ffcc]">{player.points}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-white/30">Games Played</div>
                <div className="text-2xl font-mono text-white">{player.history.length}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.email === "ana1yze2400@gmail.com" && (
              <button onClick={() => setShowConfirm(true)} className="text-red-500 hover:text-red-400 p-2">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-2">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-widest text-white/30 mb-4">Mission History</h4>
          {player.history.map((entry, idx) => {
            const wins = (entry.winCounts && entry.winCounts[player.name]) || 0;
            return (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border-l-2 border-white/10">
                <div className="flex items-center gap-4">
                  <Gamepad2 size={18} className="text-white/20" />
                  <div>
                    <div className="text-sm uppercase tracking-wider">{entry.game}</div>
                    <div className="text-[10px] text-white/30 font-mono">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 text-[10px] uppercase tracking-widest font-bold",
                  wins > 0 ? "bg-[#00ffcc]/10 text-[#00ffcc]" : "bg-red-500/10 text-red-400"
                )}>
                  {wins} Wins
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Rules = () => (
  <div className="min-h-screen p-6 max-w-5xl mx-auto pb-24">
    <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
      <Link to="/" className="text-xs uppercase tracking-widest text-white/50 hover:text-[#00ffcc] transition-colors flex items-center gap-1">
        <ChevronRight size={14} className="rotate-180" /> Back to Base
      </Link>
      <h1 className="text-2xl font-mono tracking-widest uppercase glow-text text-[#00ffcc]">
        Rules of Engagement
      </h1>
      <div className="w-24" />
    </header>

    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-16"
    >
      <section className="sci-fi-border bg-white/5 p-8 border border-white/10">
        <h2 className="text-xl font-mono uppercase tracking-[0.3em] text-[#00ffcc] mb-6 flex items-center gap-3">
          <Trophy size={20} /> Rules
        </h2>
        <p className="text-lg leading-relaxed text-white/80 tracking-wide">
          Welcome to the <span className="text-[#00ffcc] font-bold">Spring Gauntlet</span>! Challenge your friends to any game, any time, and fight to keep your spot in the upcoming end-of-year tournament that will decide who is the undisputed best gamer in the house!
        </p>
      </section>

      <section className="space-y-8">
        <h2 className="text-xl font-mono uppercase tracking-[0.3em] text-[#00ffcc] mb-12 text-center glow-text">
          How to Play
        </h2>

        <div className="grid gap-6">
          {[
            {
              step: "01",
              title: "Challenge",
              desc: "Challenge someone, or multiple people, to a game! It could be anything from Super Smash Bros. Ultimate to Just Dance, or even board games like Catan or Uno!"
            },
            {
              step: "02",
              title: "Win",
              desc: "Play the game out and determine the winner, or winners!"
            },
            {
              step: "03",
              title: "Create an Entry",
              desc: "On the homepage of this website, sign-in using the button in the upper right corner if you haven’t already. Once you do, the sign-in button will be replaced with a “+New Entry” button. Click that button."
            },
            {
              step: "04",
              title: "Fill it Out",
              desc: "Once you click the “+New Entry” button, a pop up will appear. In the text space at the top, put in the name of the game you played. In the section below, select the people that played from the dropdown list. If you don’t see their name, or yours, at the very bottom of the dropdown you can find an “Add New Player” option. Select it and enter in the name of the person. Finally, when all names are entered, click the trophy icon next to the names of the player(s) that won!"
            },
            {
              step: "05",
              title: "Upload",
              desc: "When you’ve finished selecting the winner(s), click the “Transmit Data” button at the bottom, and you should see the leaderboard update in real-time!"
            }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-6 p-6 bg-white/5 border border-white/5 hover:border-[#00ffcc]/20 transition-all group"
            >
              <div className="font-mono text-3xl text-white/10 group-hover:text-[#00ffcc]/20 transition-colors">
                {item.step}
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.4em] text-[#00ffcc] mb-2">Step {idx + 1}: {item.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm tracking-wide">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </motion.div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rules" element={<Rules />} />
      </Routes>
    </Router>
  );
}

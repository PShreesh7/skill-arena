import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Plus, Trophy, Eye, Swords, Loader2,
  CheckCircle2, XCircle, ArrowRight, Timer, Zap, Shield, Brain
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'find' | 'invite' | 'custom' | 'tournament' | 'spectate';
type BattlePhase = 'idle' | 'searching' | 'found' | 'battle' | 'result';

interface BattleQuestion {
  question: string;
  code?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctIndex: number;
}

interface Opponent {
  username: string;
  elo: number;
}

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'find', label: 'Find Match', icon: Search },
  { id: 'invite', label: 'Invite Friend', icon: Users },
  { id: 'custom', label: 'Custom Room', icon: Plus },
  { id: 'tournament', label: 'Tournaments', icon: Trophy },
  { id: 'spectate', label: 'Spectate', icon: Eye },
];

const mockTournaments = [
  { id: 1, name: 'Weekly Sprint #42', players: 128, status: 'Open', prize: '500 XP', startIn: '2h 30m' },
  { id: 2, name: 'Algorithm Masters', players: 64, status: 'Open', prize: '1000 XP', startIn: '1d 5h' },
  { id: 3, name: 'Frontend Fury', players: 32, status: 'Full', prize: '750 XP', startIn: '45m' },
];

const mockLiveMatches = [
  { id: 1, p1: 'NeonCoder', p2: 'ByteStorm', elo1: 1450, elo2: 1520, topic: 'Dynamic Programming', viewers: 23 },
  { id: 2, p1: 'AlgoQueen', p2: 'StackOverflow', elo1: 1800, elo2: 1750, topic: 'System Design', viewers: 45 },
];

const QUESTION_TIME_LIMIT = 30; // seconds per question

const Battle = () => {
  const { user, updateBattleResult } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const [friendCode, setFriendCode] = useState('');
  const [roomName, setRoomName] = useState('');

  // Battle state
  const [phase, setPhase] = useState<BattlePhase>('idle');
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [difficulty, setDifficulty] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submittedAnswer, setSubmittedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [eloDelta, setEloDelta] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [battleStartTime, setBattleStartTime] = useState(0);

  

  // Timer countdown during battle
  useEffect(() => {
    if (phase !== 'battle' || submittedAnswer !== null) return;
    if (timeLeft <= 0) {
      handleAnswer(-1);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, timeLeft, submittedAnswer]);

  const handleFindMatch = useCallback(async () => {
    setPhase('searching');
    try {
      const { data, error } = await supabase.functions.invoke('battle-questions', {
        body: { elo: user?.elo || 0, questionCount: 5 },
      });

      if (error) throw new Error(error.message || 'Failed to fetch questions');
      if (data?.error) throw new Error(data.error);

      setQuestions(data.questions);
      setOpponent(data.opponent);
      setDifficulty(data.difficulty);
      setAnswers(Array(data.questions.length).fill(null));

      await new Promise(r => setTimeout(r, 2000));
      setPhase('found');

      setTimeout(() => {
        setPhase('battle');
        setCurrentQ(0);
        setScore(0);
        setOpponentScore(0);
        setTimeLeft(QUESTION_TIME_LIMIT);
        setSubmittedAnswer(null);
        setBattleStartTime(Date.now());
      }, 3000);
    } catch (err: any) {
      console.error('Battle error:', err);
      toast.error(err.message || 'Failed to start battle');
      setPhase('idle');
    }
  }, [user?.elo]);

  const handleAnswer = useCallback((idx: number) => {
    if (submittedAnswer !== null || phase !== 'battle') return;
    setSubmittedAnswer(idx);

    const isCorrect = idx === questions[currentQ]?.correctIndex;
    const newAnswers = [...answers];
    newAnswers[currentQ] = idx;
    setAnswers(newAnswers);

    if (isCorrect) {
      const timeBonus = Math.max(0, timeLeft);
      const points = 100 + timeBonus * 3;
      setScore(prev => prev + points);
    }

    // Simulate opponent answering
    const opponentCorrectChance = opponent ? Math.min(0.8, opponent.elo / 2500) : 0.5;
    if (Math.random() < opponentCorrectChance) {
      const opponentTimeBonus = Math.floor(Math.random() * 20);
      setOpponentScore(prev => prev + 100 + opponentTimeBonus * 3);
    }

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSubmittedAnswer(null);
        setTimeLeft(QUESTION_TIME_LIMIT);
      } else {
        // Battle complete — calculate results
        finishBattle(newAnswers);
      }
    }, 1500);
  }, [submittedAnswer, phase, currentQ, questions, answers, timeLeft, opponent]);

  const finishBattle = async (finalAnswers: (number | null)[]) => {
    const correct = finalAnswers.filter((a, i) => a === questions[i]?.correctIndex).length;

    // Calculate final scores
    const myFinalScore = score + (correct === questions.length ? 200 : 0); // perfect bonus
    const oppFinalScore = opponentScore;
    const won = myFinalScore > oppFinalScore;
    const draw = myFinalScore === oppFinalScore;

    // ELO calculation (simplified K-factor)
    const K = 32;
    const expectedScore = 1 / (1 + Math.pow(10, ((opponent?.elo || (user?.elo ?? 0)) - (user?.elo ?? 0)) / 400));
    const actualScore = won ? 1 : draw ? 0.5 : 0;
    const delta = Math.round(K * (actualScore - expectedScore));

    // CC Token rewards
    const baseTokens = won ? 50 : draw ? 20 : 10;
    const accuracyBonus = Math.round((correct / questions.length) * 30);
    const streakBonus = won && user ? Math.min(user.streak * 5, 25) : 0;
    const earnedTokens = baseTokens + accuracyBonus + streakBonus;

    setEloDelta(delta);
    setTokensEarned(earnedTokens);
    setPhase('result');

    // Persist full battle result
    try {
      await updateBattleResult(won, draw, delta, earnedTokens);
    } catch (err) {
      console.error('Failed to update battle result:', err);
    }
  };

  const resetBattle = () => {
    setPhase('idle');
    setQuestions([]);
    setOpponent(null);
    setCurrentQ(0);
    setAnswers([]);
    setSubmittedAnswer(null);
    setScore(0);
    setOpponentScore(0);
    setEloDelta(0);
    setTokensEarned(0);
    setTimeLeft(QUESTION_TIME_LIMIT);
  };

  if (!user) return null;

  // ─── BATTLE IN PROGRESS ─────────────────────────
  if (phase === 'searching') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card gradient-border p-10 text-center max-w-md w-full">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Finding Opponent</h2>
          <p className="text-muted-foreground text-sm mb-4">Matching you with a player near ELO {user.elo}...</p>
          <p className="text-xs text-muted-foreground font-mono animate-pulse">Generating AI questions for your skill level...</p>
          <button onClick={resetBattle} className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'found' && opponent) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card gradient-border p-10 text-center max-w-lg w-full">
          <h2 className="font-display text-xl font-bold text-foreground mb-8">Opponent Found!</h2>
          <div className="flex items-center justify-center gap-8">
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-3">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{user.username}</p>
              <p className="text-sm font-mono text-primary">{user.elo}</p>
            </motion.div>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
              <Swords className="w-10 h-10 text-secondary" />
            </motion.div>
            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center mx-auto mb-3">
                <Brain className="w-8 h-8 text-destructive" />
              </div>
              <p className="font-semibold text-foreground">{opponent.username}</p>
              <p className="text-sm font-mono text-destructive">{opponent.elo}</p>
            </motion.div>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 text-sm text-muted-foreground font-mono animate-pulse">
            Battle starting...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (phase === 'battle' && questions.length > 0) {
    const q = questions[currentQ];
    const timerColor = timeLeft > 15 ? 'text-accent' : timeLeft > 5 ? 'text-secondary' : 'text-destructive';

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score bar */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{user.username}</p>
            <p className="text-lg font-bold text-primary font-mono">{score}</p>
          </div>
          <div className="flex items-center gap-3">
            <Timer className={`w-5 h-5 ${timerColor}`} />
            <span className={`text-2xl font-bold font-mono ${timerColor}`}>{timeLeft}</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">{opponent?.username}</p>
            <p className="text-lg font-bold text-destructive font-mono">{opponentScore}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${
              i < currentQ ? (answers[i] === questions[i].correctIndex ? 'bg-accent' : 'bg-destructive')
                : i === currentQ ? 'bg-primary' : 'bg-muted'
            }`} />
          ))}
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="glass-card gradient-border p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-primary font-mono tracking-widest">{q.topic}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                q.difficulty === 'easy' ? 'bg-accent/20 text-accent' :
                q.difficulty === 'medium' ? 'bg-secondary/20 text-secondary' :
                'bg-destructive/20 text-destructive'
              }`}>
                {q.difficulty.toUpperCase()}
              </span>
            </div>

            <h2 className="font-display text-lg font-bold text-foreground mb-4">{q.question}</h2>

            {q.code && (
              <pre className="bg-muted p-4 rounded-lg text-sm font-mono text-foreground mb-6 overflow-x-auto border border-border whitespace-pre-wrap">
                {q.code}
              </pre>
            )}

            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const isSelected = submittedAnswer === idx;
                const isCorrect = idx === q.correctIndex;
                const showFeedback = submittedAnswer !== null;

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={submittedAnswer !== null}
                    className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-3 ${
                      showFeedback && isCorrect
                        ? 'border-accent bg-accent/10 text-accent'
                        : showFeedback && isSelected && !isCorrect
                        ? 'border-destructive bg-destructive/10 text-destructive'
                        : 'border-border bg-muted/50 text-foreground hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full border border-current flex items-center justify-center text-sm font-mono shrink-0">
                      {showFeedback && isCorrect ? <CheckCircle2 className="w-5 h-5" /> :
                       showFeedback && isSelected ? <XCircle className="w-5 h-5" /> :
                       String.fromCharCode(65 + idx)}
                    </span>
                    <span className="font-mono text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'result') {
    const correct = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
    const won = eloDelta > 0;
    const draw = eloDelta === 0;

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card gradient-border p-10 text-center max-w-lg w-full">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center border-2 ${
            won ? 'bg-accent/20 border-accent' : draw ? 'bg-muted border-border' : 'bg-destructive/20 border-destructive'
          }`}>
            {won ? <Trophy className="w-10 h-10 text-accent" /> : <Swords className="w-10 h-10 text-destructive" />}
          </div>

          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            {won ? 'Victory!' : draw ? 'Draw!' : 'Defeat'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {won ? 'Well played, champion!' : draw ? 'An evenly matched battle.' : 'Better luck next time!'}
          </p>

          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-xl font-bold text-primary font-mono">{score}</p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Correct</p>
              <p className="text-xl font-bold text-accent font-mono">{correct}/{questions.length}</p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">ELO</p>
              <p className={`text-xl font-bold font-mono ${eloDelta > 0 ? 'text-accent' : eloDelta < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {eloDelta > 0 ? '+' : ''}{eloDelta}
              </p>
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">CC Tokens</p>
              <p className="text-xl font-bold text-secondary font-mono">+{tokensEarned}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div>
              <p className="text-muted-foreground">You</p>
              <p className="font-bold text-primary font-mono">{score}</p>
            </div>
            <span className="text-muted-foreground">vs</span>
            <div>
              <p className="text-muted-foreground">{opponent?.username}</p>
              <p className="font-bold text-destructive font-mono">{opponentScore}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetBattle}
              className="flex-1 py-3 bg-muted text-foreground rounded-lg font-display font-semibold hover:bg-muted/80 transition-all"
            >
              Back
            </button>
            <button
              onClick={() => { resetBattle(); handleFindMatch(); }}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Rematch
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── DEFAULT TABS VIEW ─────────────────────────
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Battle Mode</h1>
        <p className="text-muted-foreground mt-1">Challenge opponents in real-time coding duels</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {activeTab === 'find' && (
          <div className="glass-card gradient-border p-8 text-center max-w-lg mx-auto">
            <Swords className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">Quick Match</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Find an opponent near your ELO rating
            </p>
            <p className="text-2xl font-bold text-primary font-mono mb-6">{user.elo}</p>
            <p className="text-xs text-muted-foreground mb-6">
              AI will generate {difficulty || 'skill-appropriate'} questions matched to your level — fair battles, no discrimination.
            </p>
            <button
              onClick={handleFindMatch}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold tracking-wider hover:bg-primary/90 transition-all"
            >
              Find Match
            </button>
          </div>
        )}

        {activeTab === 'invite' && (
          <div className="glass-card gradient-border p-8 max-w-lg mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Invite a Friend</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Friend's Code</label>
                <input
                  value={friendCode}
                  onChange={e => setFriendCode(e.target.value)}
                  placeholder="Enter friend code..."
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="glass-card p-4 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Code</p>
                <p className="font-mono text-lg text-primary font-bold">{user.username.toUpperCase()}-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
              </div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold tracking-wider hover:bg-primary/90 transition-all">
                Send Invite
              </button>
            </div>
          </div>
        )}

        {activeTab === 'custom' && (
          <div className="glass-card gradient-border p-8 max-w-lg mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">Create Custom Room</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Room Name</label>
                <input
                  value={roomName}
                  onChange={e => setRoomName(e.target.value)}
                  placeholder="My Battle Room"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Difficulty</label>
                <div className="flex gap-2">
                  {['Easy', 'Medium', 'Hard'].map(d => (
                    <button key={d} className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold tracking-wider hover:bg-primary/90 transition-all">
                Create Room
              </button>
            </div>
          </div>
        )}

        {activeTab === 'tournament' && (
          <div className="space-y-4">
            {mockTournaments.map(t => (
              <div key={t.id} className="glass-card-hover p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">{t.players} players · {t.prize} · Starts in {t.startIn}</p>
                  </div>
                </div>
                <button
                  disabled={t.status === 'Full'}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    t.status === 'Full'
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                  }`}
                >
                  {t.status === 'Full' ? 'Full' : 'Join'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'spectate' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Live matches you can watch:</p>
            {mockLiveMatches.map(m => (
              <div key={m.id} className="glass-card-hover p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-xs font-mono text-destructive">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="w-3 h-3" />
                    {m.viewers}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{m.p1}</p>
                    <p className="text-xs text-primary font-mono">{m.elo1}</p>
                  </div>
                  <div className="px-4">
                    <Swords className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">{m.p2}</p>
                    <p className="text-xs text-primary font-mono">{m.elo2}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">{m.topic}</p>
                <button className="w-full mt-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-primary/10 hover:text-primary transition-all">
                  Watch
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Battle;

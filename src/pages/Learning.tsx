import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, RotateCcw, Lightbulb, Lock, ArrowRight, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
  category: string;
  mastery: number;
  status: 'locked' | 'available' | 'in-progress' | 'mastered';
  suggestedByAI: boolean;
}

interface PracticeQuestion {
  question: string;
  code?: string;
  options: string[];
  correctIndex: number;
}

const mockTopics: Topic[] = [
  { id: '1', name: 'Variables & Types', category: 'Fundamentals', mastery: 100, status: 'mastered', suggestedByAI: false },
  { id: '2', name: 'Functions & Scope', category: 'Fundamentals', mastery: 85, status: 'in-progress', suggestedByAI: false },
  { id: '3', name: 'Closures', category: 'Advanced JS', mastery: 40, status: 'in-progress', suggestedByAI: true },
  { id: '4', name: 'Promises & Async', category: 'Advanced JS', mastery: 20, status: 'available', suggestedByAI: true },
  { id: '5', name: 'Array Methods', category: 'Fundamentals', mastery: 60, status: 'in-progress', suggestedByAI: false },
  { id: '6', name: 'Recursion', category: 'Algorithms', mastery: 0, status: 'available', suggestedByAI: true },
  { id: '7', name: 'Binary Search', category: 'Algorithms', mastery: 0, status: 'locked', suggestedByAI: false },
  { id: '8', name: 'Graph Traversal', category: 'Data Structures', mastery: 0, status: 'locked', suggestedByAI: false },
];

const statusStyles = {
  mastered: 'border-accent/40 bg-accent/5',
  'in-progress': 'border-secondary/40 bg-secondary/5',
  available: 'border-primary/40 bg-primary/5',
  locked: 'border-border/30 bg-muted/20 opacity-60',
};

const Learning = () => {
  const { user } = useUser();
  const [topics, setTopics] = useState(mockTopics);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Practice quiz state
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const startPractice = useCallback(async (topic: Topic) => {
    setLoadingQuestions(true);
    setPracticeMode(true);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setQuizDone(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Please log in first');

      const { data, error } = await supabase.functions.invoke('battle-questions', {
        body: { elo: user.elo, questionCount: 3 },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Filter to topic-relevant questions or use all
      const questions = (data.questions || []).map((q: any) => ({
        question: q.question,
        code: q.code,
        options: q.options,
        correctIndex: q.correctIndex,
      }));

      if (questions.length === 0) throw new Error('No questions generated');
      setPracticeQuestions(questions);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load questions');
      setPracticeMode(false);
    } finally {
      setLoadingQuestions(false);
    }
  }, [user.elo]);

  const handlePracticeAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const isCorrect = idx === practiceQuestions[currentQ]?.correctIndex;
    if (isCorrect) setCorrectCount(prev => prev + 1);

    setTimeout(() => {
      if (currentQ < practiceQuestions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setQuizDone(true);
        // Update mastery for the topic
        if (selectedTopic) {
          const accuracy = ((correctCount + (isCorrect ? 1 : 0)) / practiceQuestions.length) * 100;
          const newMastery = Math.min(100, Math.round(selectedTopic.mastery + accuracy * 0.1));
          setTopics(prev => prev.map(t =>
            t.id === selectedTopic.id
              ? { ...t, mastery: newMastery, status: newMastery >= 100 ? 'mastered' : 'in-progress' }
              : t
          ));
          setSelectedTopic(prev => prev ? { ...prev, mastery: newMastery } : prev);
        }
      }
    }, 1200);
  };

  const closePractice = () => {
    setPracticeMode(false);
    setPracticeQuestions([]);
    setSelectedTopic(null);
  };

  if (!user) return null;

  const weakAreas = topics.filter(t => t.mastery > 0 && t.mastery < 60);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Learning Mode</h1>
        <p className="text-muted-foreground mt-1">AI-guided skill progression</p>
      </div>

      {/* AI Suggestions banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card gradient-border p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground mb-1">AI Recommendations</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Based on your ELO ({user.elo}) and recent performance, focus on:
            </p>
            <div className="flex flex-wrap gap-2">
              {topics.filter(t => t.suggestedByAI).map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t)}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weak areas */}
      {weakAreas.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-secondary" />
            Weak Areas — Practice Recommended
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {weakAreas.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t)}
                className="glass-card-hover p-4 text-left flex items-center gap-4"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-secondary font-bold">{t.mastery}%</p>
                  <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${t.mastery}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All topics */}
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground mb-3">All Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {topics.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => t.status !== 'locked' && setSelectedTopic(t)}
              disabled={t.status === 'locked'}
              className={`p-4 rounded-xl border text-left transition-all ${statusStyles[t.status]} ${
                t.status !== 'locked' ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono text-muted-foreground">{t.category}</span>
                {t.status === 'mastered' && <CheckCircle2 className="w-4 h-4 text-accent" />}
                {t.status === 'locked' && <Lock className="w-4 h-4 text-muted-foreground" />}
                {t.suggestedByAI && t.status !== 'locked' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">AI Pick</span>
                )}
              </div>
              <p className="font-semibold text-foreground mb-2">{t.name}</p>
              <div className="h-1.5 bg-muted rounded-full">
                <div
                  className={`h-full rounded-full ${
                    t.mastery === 100 ? 'bg-accent' : t.mastery > 0 ? 'bg-secondary' : 'bg-muted'
                  }`}
                  style={{ width: `${t.mastery}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.mastery}% mastery</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Topic detail / Practice modal */}
      {selectedTopic && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closePractice}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
            className="glass-card gradient-border p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Loading state */}
            {loadingQuestions && (
              <div className="text-center py-10">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-mono">Generating AI questions for {selectedTopic.name}...</p>
              </div>
            )}

            {/* Topic info (before practice starts) */}
            {!practiceMode && !loadingQuestions && (
              <>
                <span className="text-xs font-mono text-primary tracking-widest">{selectedTopic.category}</span>
                <h2 className="font-display text-2xl font-bold text-foreground mt-2 mb-2">{selectedTopic.name}</h2>
                <p className="text-muted-foreground text-sm mb-6">
                  {selectedTopic.mastery === 0
                    ? 'Start learning this topic with AI-generated exercises.'
                    : `You've mastered ${selectedTopic.mastery}% of this topic. Keep practicing!`}
                </p>

                <div className="h-2 bg-muted rounded-full mb-6">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selectedTopic.mastery}%` }} />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => startPractice(selectedTopic)}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold text-sm tracking-wider hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                  >
                    {selectedTopic.mastery === 0 ? 'Start Learning' : 'Practice Now'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={closePractice}
                    className="px-4 py-3 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}

            {/* Practice quiz */}
            {practiceMode && !loadingQuestions && !quizDone && practiceQuestions.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-primary tracking-widest">{selectedTopic.name}</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {currentQ + 1}/{practiceQuestions.length}
                  </span>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 mb-6">
                  {practiceQuestions.map((_, i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${
                      i < currentQ ? 'bg-accent' : i === currentQ ? 'bg-primary' : 'bg-muted'
                    }`} />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h3 className="font-display text-base font-bold text-foreground mb-4">
                      {practiceQuestions[currentQ].question}
                    </h3>

                    {practiceQuestions[currentQ].code && (
                      <pre className="bg-muted p-3 rounded-lg text-sm font-mono text-foreground mb-4 overflow-x-auto border border-border whitespace-pre-wrap">
                        {practiceQuestions[currentQ].code}
                      </pre>
                    )}

                    <div className="space-y-2">
                      {practiceQuestions[currentQ].options.map((opt, idx) => {
                        const showFeedback = selectedAnswer !== null;
                        const isCorrect = idx === practiceQuestions[currentQ].correctIndex;
                        const isSelected = selectedAnswer === idx;

                        return (
                          <button
                            key={idx}
                            onClick={() => handlePracticeAnswer(idx)}
                            disabled={selectedAnswer !== null}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 text-sm ${
                              showFeedback && isCorrect
                                ? 'border-accent bg-accent/10 text-accent'
                                : showFeedback && isSelected && !isCorrect
                                ? 'border-destructive bg-destructive/10 text-destructive'
                                : 'border-border bg-muted/50 text-foreground hover:border-primary/50 hover:bg-primary/5'
                            }`}
                          >
                            <span className="w-7 h-7 rounded-full border border-current flex items-center justify-center text-xs font-mono shrink-0">
                              {showFeedback && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                               showFeedback && isSelected ? <XCircle className="w-4 h-4" /> :
                               String.fromCharCode(65 + idx)}
                            </span>
                            <span className="font-mono">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {/* Quiz results */}
            {quizDone && (
              <div className="text-center">
                <CheckCircle2 className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-foreground mb-2">Practice Complete!</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You got {correctCount}/{practiceQuestions.length} correct
                </p>
                <div className="h-2 bg-muted rounded-full mb-6">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${(correctCount / practiceQuestions.length) * 100}%` }}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => startPractice(selectedTopic)}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold text-sm hover:bg-primary/90 transition-all"
                  >
                    Practice Again
                  </button>
                  <button
                    onClick={closePractice}
                    className="px-4 py-3 bg-muted text-muted-foreground rounded-lg text-sm hover:text-foreground transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Learning;

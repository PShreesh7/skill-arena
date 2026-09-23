import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Send, Code2, MessageSquare, Sparkles, Terminal, Zap, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`;

async function streamChat({
  messages,
  mode,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  mode: string;
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please log in to use AI Coach.');

  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages, mode }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  if (!resp.body) throw new Error('No response body');

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf('\n')) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (json === '[DONE]') { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + '\n' + buf;
        break;
      }
    }
  }
  onDone();
}

const AICoach = () => {
  const [tab, setTab] = useState('chat');

  // Chat state
  const [chatMessages, setChatMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hello! I'm your CodeClash AI Coach. I can help you master Data Structures, Algorithms, System Design, or perform deep code reviews. What's our primary objective today?" },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Code analysis state
  const [code, setCode] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: Msg = { role: 'user', content: chatInput.trim() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    let soFar = '';
    const upsert = (chunk: string) => {
      soFar += chunk;
      setChatMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: soFar } : m);
        }
        return [...prev, { role: 'assistant', content: soFar }];
      });
    };

    try {
      await streamChat({
        messages: [...chatMessages, userMsg],
        mode: 'chat',
        onDelta: upsert,
        onDone: () => setChatLoading(false),
      });
    } catch (e: any) {
      setChatLoading(false);
      toast({ title: 'Communication Error', description: e.message, variant: 'destructive' });
    }
  };

  const analyzeCode = async () => {
    if (!code.trim() || analyzing) return;
    setAnalyzing(true);
    setAnalysisResult('');

    let soFar = '';
    try {
      await streamChat({
        messages: [{ role: 'user', content: `Analyze this code for performance, readability, and security:\n\`\`\`\n${code}\n\`\`\`` }],
        mode: 'code-analysis',
        onDelta: (chunk) => {
          soFar += chunk;
          setAnalysisResult(soFar);
        },
        onDone: () => setAnalyzing(false),
      });
    } catch (e: any) {
      setAnalyzing(false);
      toast({ title: 'Analysis Failed', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">AI COACH <span className="text-primary text-xs align-top bg-primary/10 px-2 py-0.5 rounded ml-2 border border-primary/20">V2.4</span></h1>
            <p className="text-muted-foreground text-sm font-medium">Neural Guidance & Static Code Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5">
          <Sparkles className="w-4 h-4 text-accent animate-pulse" />
          <span className="text-xs font-bold text-accent tracking-wider uppercase">Pro Protocol Active</span>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-black/20 border border-white/5 p-1 mb-6 rounded-xl overflow-hidden">
          <TabsTrigger 
            value="chat" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 transition-all duration-300"
          >
            <MessageSquare className="w-4 h-4" /> BATTLE CHAT
          </TabsTrigger>
          <TabsTrigger 
            value="code" 
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 transition-all duration-300"
          >
            <Code2 className="w-4 h-4" /> CODE ANALYSIS
          </TabsTrigger>
        </TabsList>

        {/* CHAT TAB */}
        <TabsContent value="chat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
          <div className="glass-card flex flex-col relative overflow-hidden border-2 border-white/5" style={{ height: 'calc(100vh - 300px)', minHeight: 500 }}>
            {/* Background Grid Decoration */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 scrollbar-thin">
              {chatMessages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn("flex items-start gap-4", m.role === 'user' ? 'flex-row-reverse' : '')}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all shadow-lg",
                    m.role === 'assistant' 
                      ? 'bg-primary/10 text-primary border-primary/20' 
                      : 'bg-secondary/10 text-secondary border-secondary/20'
                  )}>
                    {m.role === 'assistant' ? <Bot className="w-5 h-5" /> : <Terminal className="w-5 h-5" />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-xl",
                    m.role === 'user' 
                      ? 'bg-secondary/10 border border-secondary/20 text-foreground' 
                      : 'bg-muted border border-border text-foreground'
                  )}>
                    <div className="prose prose-invert max-w-none 
                      [&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-white/10 [&_pre]:rounded-xl [&_pre]:p-4
                      [&_code]:text-primary [&_code]:bg-primary/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                      [&_a]:text-primary [&_a]:underline
                      [&_ul]:list-disc [&_ol]:list-decimal
                      text-[15px]">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}
              {chatLoading && chatMessages[chatMessages.length - 1]?.role === 'user' && (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center shadow-lg">
                    <Zap className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="bg-muted border border-border rounded-2xl px-5 py-4 text-sm text-muted-foreground italic flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    Processing tactical response...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-white/5 p-6 bg-black/20 backdrop-blur-xl relative z-10">
              <div className="flex gap-4 relative">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                  placeholder="Enter strategic query (e.g., Explain QuickSort complexity)..."
                  className="flex-1 bg-black/40 border-2 border-white/5 rounded-xl px-6 py-4 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                  disabled={chatLoading}
                />
                <Button
                  onClick={sendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-6 h-auto rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground/60 font-mono">
                <Info className="w-3 h-3" />
                <span>AI models may generate inaccurate tactical data. Verify all code before implementation.</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CODE ANALYSIS TAB */}
        <TabsContent value="code" className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-6">
          <Card className="border-2 border-white/5 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
            <div className="p-8 relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Terminal className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">SOURCE INPUT</h2>
                  <p className="text-sm text-muted-foreground">Paste algorithm or implementation for deep scan</p>
                </div>
              </div>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                rows={12}
                className="w-full bg-black/40 border-2 border-white/5 rounded-xl p-6 text-foreground font-mono text-[14px] leading-relaxed resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                placeholder="// Tactical code entry..."
              />
              <div className="flex justify-between items-center mt-6">
                <div className="text-[11px] font-mono text-muted-foreground/50">
                  SUPPORTED: TS, JS, PY, CPP, JAVA, GO
                </div>
                <Button
                  onClick={analyzeCode}
                  disabled={analyzing || !code.trim()}
                  size="lg"
                  className="px-8 font-bold tracking-widest uppercase"
                >
                  {analyzing ? (
                    <><Zap className="w-4 h-4 animate-spin mr-2" /> SCANNING...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" /> INITIATE SCAN</>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          {analysisResult && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="glass-card border-2 border-primary/20 overflow-hidden"
            >
              <div className="bg-primary/10 border-b border-primary/20 p-4 px-8 flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-widest text-primary uppercase flex items-center gap-2">
                  <Zap className="w-4 h-4" /> SCAN RESULTS [COMPLETE]
                </h2>
                <div className="text-[10px] font-mono text-primary/60">THREAT LEVEL: NEGLIGIBLE</div>
              </div>
              <div className="p-8 prose prose-invert max-w-none 
                [&_pre]:bg-black/40 [&_pre]:border [&_pre]:border-white/10 [&_pre]:rounded-xl [&_pre]:p-6
                [&_code]:text-primary [&_code]:bg-primary/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                [&_h3]:text-primary [&_h3]:font-display [&_h3]:tracking-tighter
                text-[15px] leading-relaxed">
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICoach;

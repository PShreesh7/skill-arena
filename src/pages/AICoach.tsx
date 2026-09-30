import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Code2, MessageSquare, Terminal, Zap, AlertTriangle, FileCode2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('go', go);

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
const highlightCode = (value: string) => {
  if (!value) return '';
  try { return hljs.highlightAuto(value, ['typescript', 'javascript', 'python', 'java', 'cpp', 'go']).value; }
  catch { return escapeHtml(value); }
};


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
    { role: 'assistant', content: "Hello! I'm your Skill Arena AI Coach. I can help you master Data Structures, Algorithms, System Design, or perform deep code reviews. What's our primary objective today?" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Code analysis state
  const [code, setCode] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const sendChat = async (text: string) => {
    if (!text.trim() || chatLoading) return;
    const userMsg: Msg = { role: 'user', content: text.trim() };
    setChatMessages(prev => [...prev, userMsg]);
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

  const lineCount = Math.max(12, code.split('\n').length);
  const highlighted = highlightCode(code || '// Paste your code here to begin analysis');
  const hasBottleneck = /for\s*\([^)]*\)[\s\S]{0,250}for\s*\(/.test(code);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/20 pb-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center border border-primary/40 bg-primary/10 text-primary"><Bot className="size-6" /></div>
          <div><h1 className="text-2xl font-bold text-foreground md:text-3xl">AI Coach <span className="align-middle text-xs text-primary">// V2.4</span></h1><p className="mt-1 text-xs text-muted-foreground">Neural guidance & static code analysis</p></div>
        </div>
        <span className="flex items-center gap-2 border border-accent/30 bg-accent/5 px-3 py-2 text-[10px] font-bold uppercase text-accent"><span className="size-1.5 animate-pulse rounded-full bg-accent" /> Pro protocol active</span>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5 h-auto max-w-full gap-1 overflow-x-auto">
          <TabsTrigger value="chat" className="gap-2 px-4 py-2"><MessageSquare className="size-4" /> Battle Chat</TabsTrigger>
          <TabsTrigger value="code" className="gap-2 px-4 py-2"><Code2 className="size-4" /> Code Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-0">
          <div className="flex h-[min(680px,calc(100dvh-235px))] min-h-[360px] flex-col border border-primary/25 bg-card/70">
            <div className="flex items-center gap-2 border-b border-primary/20 px-5 py-3 text-[10px] font-bold uppercase text-primary"><Terminal className="size-3.5" /> Coach channel <span className="ml-auto text-accent">● Online</span></div>
            <Conversation className="min-h-0">
              <ConversationContent className="gap-5 px-4 py-5 md:px-7">
                {chatMessages.map((m, i) => <Message key={i} from={m.role}>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">{m.role === 'assistant' ? 'Skill Arena // Coach' : 'You'}</span>
                  <MessageContent className={m.role === 'user' ? 'border border-primary/50 !bg-primary !text-primary-foreground [&_*]:!text-primary-foreground' : 'bg-transparent !text-foreground'}>
                    <MessageResponse>{m.content}</MessageResponse>
                  </MessageContent>
                </Message>)}
                {chatLoading && chatMessages[chatMessages.length - 1]?.role === 'user' && <Message from="assistant"><MessageContent><Shimmer>Thinking...</Shimmer></MessageContent></Message>}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className="border-t border-primary/20 bg-background/70 p-3 md:p-4">
              <PromptInput onSubmit={({ text }) => sendChat(text)} className="[&_[data-slot=input-group]]:border-primary/30">
                <PromptInputTextarea disabled={chatLoading} placeholder="Ask your coach..." className="min-h-16 bg-transparent text-foreground" />
                <PromptInputFooter className="justify-end border-t border-primary/10 px-2 py-1">
                  <PromptInputSubmit status={chatLoading ? 'submitted' : 'ready'} disabled={chatLoading} aria-label="Send message" title="Send message" />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-0 space-y-6">
          <div className="editor-shell">
            <div className="flex items-center gap-2 border-b border-primary/20 bg-card px-4 py-3 text-xs text-muted-foreground"><FileCode2 className="size-4 text-primary" /><span className="text-foreground">source_input</span><span className="ml-auto text-[10px] uppercase">TS · JS · PY · CPP · JAVA · GO</span></div>
            <div className="relative overflow-auto bg-background/90">
              <div className="pointer-events-none flex min-h-[300px] min-w-[480px] font-mono text-sm leading-6" aria-hidden="true">
                <div className="sticky left-0 z-10 flex w-12 shrink-0 flex-col border-r border-primary/15 bg-background px-2 py-4 text-right text-muted-foreground/60">{Array.from({ length: lineCount }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                <pre className="m-0 flex-1 overflow-visible whitespace-pre p-4 text-foreground"><code className="editor-code" dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
              </div>
              <textarea value={code} onChange={e => setCode(e.target.value)} spellCheck={false} aria-label="Source code" className="editor-code absolute inset-0 h-full w-full min-w-[480px] resize-none whitespace-pre bg-transparent py-4 pl-16 pr-4 font-mono text-sm leading-6 text-transparent caret-primary outline-none selection:bg-primary/30" />
            </div>
            {hasBottleneck && <div className="flex animate-pulse items-center gap-2 border-t border-destructive bg-destructive/10 px-4 py-2 text-xs font-bold text-destructive"><AlertTriangle className="size-4" /> CRITICAL O(N²) BOTTLENECK</div>}
            <div className="flex flex-wrap items-center justify-end gap-4 border-t border-primary/20 bg-card p-4"><Button onClick={analyzeCode} disabled={analyzing || !code.trim()}><Zap className={analyzing ? 'animate-spin' : ''} /> {analyzing ? '[ SCANNING... ]' : '[ INITIATE SCAN ]'}</Button></div>
          </div>
          {(analyzing || analysisResult) && <div className="editor-shell"><div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3 text-xs font-bold uppercase text-primary"><Terminal className="size-4" /> Scan results</div><div className="p-5 text-sm text-foreground">{analysisResult ? <MessageResponse>{analysisResult}</MessageResponse> : <Shimmer>Analyzing code...</Shimmer>}</div></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AICoach;

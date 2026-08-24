'use client';
// app/assistant/page.tsx
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { Send, Bot, User } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string; }

export default function AssistantPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! Ask me about your products, stock, sales, suppliers, or orders." },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const next = [...messages, { role: 'user' as const, content: input }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await api.post('/assistant/chat', {
        messages: next.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages([...next, { role: 'assistant', content: res.data.data.reply }]);
    } catch (err: any) {
        const detail = err.response?.data?.error ?? err.message ?? 'Unknown error';
        setMessages([...next, { role: 'assistant', content: `Sorry, something went wrong: ${detail}` }]);
      } finally { setSending(false); }
  };

  return (
    <AppLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-heading)' }}>AI Assistant</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Ask questions about your inventory, sales, and orders</p>
      </div>

      <div className="card p-0 flex flex-col" style={{ height: '65vh' }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className="flex gap-3" style={{ flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: m.role === 'assistant' ? 'var(--accent-subtle)' : 'var(--bg-hover)' }}>
                {m.role === 'assistant' ? <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} /> : <User className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div className="max-w-[75%] px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap"
                style={m.role === 'assistant'
                  ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }
                  : { backgroundColor: 'var(--accent)', color: 'white' }}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent-subtle)' }}>
                <Bot className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="px-4 py-2.5 rounded-xl text-sm" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 flex gap-2" style={{ borderTop: '1px solid var(--bg-border)' }}>
          <input
            className="input flex-1"
            placeholder="e.g. Which products are low on stock?"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button onClick={send} disabled={sending} className="btn-primary flex items-center gap-2">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
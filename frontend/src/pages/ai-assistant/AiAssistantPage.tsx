import { useEffect, useRef, useState } from 'react';
import { aiApi } from '../../api/ai.api';
import { useAuth } from '../../context/AuthContext';
import MessageBubble from '../../components/ui/MessageBubble';
import TypingIndicator from '../../components/ui/TypingIndicator';
import SuggestedPrompts from './SuggestedPrompts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    aiApi.getHistory()
      .then((history: any[]) => {
        setMessages(history.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })));
      })
      .catch(() => {
        console.warn('Could not load chat history — starting fresh session');
      }) // history is optional — fail silently
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function send(text = input) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;

    const userMsg: Message = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setError(null);
    setThinking(true);

    try {
      const res = await aiApi.chat(trimmed);
      const assistantMsg: Message = { role: 'assistant', content: res.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to get a response. Please try again.');
      setMessages((prev) => prev.slice(0, -1)); // remove the optimistic user message
    } finally {
      setThinking(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0 && !loadingHistory;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem-3rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="shrink-0 pb-4 border-b border-gray-200 mb-4">
        <h1 className="text-lg font-semibold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Ask questions about your business data — answers are scoped to your access level.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {loadingHistory ? (
          <p className="text-sm text-gray-400 text-center py-8">Loading chat history...</p>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="text-4xl mb-4">✦</div>
            <h2 className="text-base font-medium text-gray-700 mb-1">Ask me anything about your data</h2>
            <p className="text-sm text-gray-400 mb-8">
              I can query sales, exports, and attendance within your access scope.
            </p>
            <SuggestedPrompts role={user?.role ?? ''} onSelect={send} />
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                role={msg.role}
                content={msg.content}
                timestamp={msg.timestamp}
              />
            ))}
            {thinking && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="shrink-0 mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your sales, exports, or attendance..."
          rows={1}
          className="w-full resize-none rounded-2xl px-4 pt-3.5 pb-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-xs text-gray-400">
            Enter to send · Shift+Enter for new line
          </p>
          <button
            onClick={() => send()}
            disabled={!input.trim() || thinking}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-1.5 rounded-xl transition-colors"
          >
            {thinking ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
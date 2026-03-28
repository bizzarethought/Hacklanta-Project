import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface Props {
  propertyContext?: any;
}

const STARTERS = [
  'What solar upgrades make sense here?',
  'How do I reduce flood damage costs?',
  'What green upgrades lower my premium?',
  'Is a green roof worth it?',
];

export default function ChatBot({ propertyContext }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    setMessages(prev => [...prev, { role: 'user', text: text.trim() }]);
    setInput('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/chat', {
        message: text.trim(),
        property_context: propertyContext ?? null,
      });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Could not reach the server. Please try again.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-7 right-7 z-[8000] w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all duration-200 hover:scale-110 pointer-events-auto"
        style={{
          background: 'linear-gradient(135deg, #00d4ff 0%, #006fa6 100%)',
          boxShadow: open
            ? '0 0 0 3px rgba(0,212,255,0.25), 0 4px 20px rgba(0,212,255,0.4)'
            : '0 4px 16px rgba(0,212,255,0.35)',
        }}
        title="Sustainability advisor"
      >
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-leaf'} text-white text-sm`} />
      </button>

      {/* Panel */}
      <div
        className="fixed bottom-24 right-7 z-[7999] flex flex-col pointer-events-auto transition-all duration-300 origin-bottom-right"
        style={{
          width: 360,
          height: open ? 500 : 0,
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1)' : 'scale(0.95)',
          overflow: 'hidden',
        }}
      >
        <div className="glass-panel flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0">
            <div className="w-7 h-7 rounded-full bg-climate-cyan/10 border border-climate-cyan/30 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-leaf text-climate-cyan text-[11px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white leading-none">Sustainability Advisor</p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                {propertyContext
                  ? propertyContext.address?.split(',')[0]
                  : 'Ask about any property upgrade'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 scrollbar-thin">
            {messages.length === 0 && (
              <div className="flex flex-col gap-2 mt-1">
                <p className="text-[10px] text-gray-600 uppercase tracking-widest text-center font-semibold mb-1">
                  Suggested questions
                </p>
                {STARTERS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-[11.5px] text-gray-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-climate-cyan/25 rounded-lg px-3 py-2.5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'bot' && (
                  <div className="w-5 h-5 rounded-full bg-climate-cyan/10 border border-climate-cyan/20 flex items-center justify-center shrink-0 mt-1 mr-2">
                    <i className="fa-solid fa-leaf text-climate-cyan text-[8px]" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-xl text-[12px] leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-climate-cyan/10 border border-climate-cyan/25 text-white rounded-br-sm'
                      : 'bg-white/[0.05] border border-white/[0.08] text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-climate-cyan/10 border border-climate-cyan/20 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-leaf text-climate-cyan text-[8px]" />
                </div>
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl rounded-bl-sm px-3 py-2.5 flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-500"
                      style={{ animation: `cg-dot 1.2s ${i * 0.2}s ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 px-4 py-3 border-t border-white/[0.07] flex gap-2 items-center">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask about upgrades, savings, risk…"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-climate-cyan/40 rounded-lg px-3 py-2 text-[12px] text-white placeholder-gray-600 outline-none transition-colors"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #006fa6)' }}
            >
              <i className="fa-solid fa-arrow-up text-white text-[11px]" />
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes cg-dot {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
}

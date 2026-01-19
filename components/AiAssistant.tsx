import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/gemini';
import { ChatMessage } from '../types';

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Nexus IA en línea. Sistemas nominales. Listo para consultas sobre el estado de la misión, mecánica orbital o telemetría de la flota.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Format history for Gemini
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendChatMessage(userMsg.text, history);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error: Se perdió la conexión con el núcleo Nexus. Por favor, reintente la transmisión.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 rounded-full flex items-center justify-center transition-all duration-300 shadow-glow-lg
          ${isOpen ? 'size-12 bg-surface-darker text-slate-400 border border-white/20' : 'size-16 bg-primary text-[#111117] hover:scale-105'}
        `}
      >
        <span className="material-symbols-outlined" style={{ fontSize: isOpen ? '24px' : '32px' }}>
          {isOpen ? 'close' : 'voice_chat'}
        </span>
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-24 right-6 w-80 md:w-96 bg-surface-dark border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right
        ${isOpen ? 'opacity-100 scale-100 h-[500px]' : 'opacity-0 scale-90 h-0 pointer-events-none'}
      `}>
        {/* Header */}
        <div className="p-4 bg-surface-darker border-b border-white/5 flex items-center gap-3">
           <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
           </div>
           <div>
              <h3 className="text-white text-sm font-bold">Asistente Nexus IA</h3>
              <p className="text-primary text-[10px] uppercase tracking-wider flex items-center gap-1">
                 <span className="size-1.5 rounded-full bg-primary animate-pulse"></span> En línea
              </p>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#111117]/50">
           {messages.map((msg) => (
             <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-primary/10 text-white border border-primary/20 rounded-tr-none' 
                    : 'bg-surface-darker text-slate-300 border border-white/10 rounded-tl-none'}
                  ${msg.isError ? 'border-red-500/50 text-red-200 bg-red-900/10' : ''}
                `}>
                   {msg.text}
                </div>
             </div>
           ))}
           {loading && (
             <div className="flex justify-start">
                <div className="bg-surface-darker border border-white/10 p-3 rounded-lg rounded-tl-none flex gap-1">
                   <div className="size-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="size-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="size-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-surface-darker border-t border-white/5">
           <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Consultar telemetría..." 
                className="w-full bg-surface-dark text-white text-sm rounded-lg border border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 p-3 pr-10 outline-none transition-all placeholder:text-slate-600"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-white disabled:text-slate-600 transition-colors"
              >
                 <span className="material-symbols-outlined">send</span>
              </button>
           </div>
        </div>
      </div>
    </>
  );
};

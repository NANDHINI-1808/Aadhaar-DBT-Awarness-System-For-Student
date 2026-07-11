import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Sparkles, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const AIGuide: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const loadChatHistory = async () => {
    try {
      const res = await fetch(`${backendUrl}/chat/history`);
      if (res.ok) {
        const history: ChatMessage[] = await res.json();
        setMessages(history);

        // Check if there are unread notifications in history (proactive cron alerts)
        if (!isOpen) {
          const alertsCount = history.filter(
            (m) => m.role === 'assistant' && m.content.startsWith('🔔')
          ).length;
          setUnreadCount(alertsCount > 0 ? 1 : 0);
        }
      }
    } catch (err) {
      console.error('Error fetching chat logs:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadChatHistory();
      // Poll history every 30 seconds for background cron alerts
      const interval = setInterval(loadChatHistory, 30000);
      return () => clearInterval(interval);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
    // Scroll to bottom on updates
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setLoading(true);

    // Optimistically push user message
    const tempUserMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${backendUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'API request error');
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.reply,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errMessage: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting to the network helper. Please try again.',
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role === 'ADMIN') return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expandable Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col mb-4 overflow-hidden relative transition-all duration-300">
          {/* Header */}
          <div className="bg-govNavy text-white p-4 flex items-center justify-between relative">
            {/* Gov stripes inside header */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-govSaffron"></div>
            
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-govSaffron border border-govSaffron/20 shadow-inner">
                <Sparkles className="w-4 h-4 fill-govSaffron" />
              </div>
              <div>
                <h4 className="font-bold text-xs font-serifDisplay tracking-wide leading-none">Aadhaar DBT Assistant</h4>
                <span className="text-[10px] text-slate-300 font-semibold mt-1 block">Ask about DBT, bank seeding & schemes</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white transition focus:outline-none"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Logs Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 text-xs">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Bot className="w-8 h-8 mx-auto stroke-slate-300" />
                <p className="font-medium">Welcome! I am your Aadhaar DBT assistant.</p>
                <p className="text-[10px]">Type your question in Hindi, English, Tamil, or Hinglish to begin.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-full bg-govCream border border-govSaffron/20 flex items-center justify-center text-govNavy shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-govNavy text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {/* Markdown support helper */}
                      <p className="whitespace-pre-line font-medium">{m.content}</p>
                    </div>
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-govCream border border-govSaffron/20 flex items-center justify-center text-govNavy shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3.5 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask me a question..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs transition focus:bg-white focus:border-govNavy"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-govNavy text-white hover:bg-[#071f3b] p-2.5 rounded-xl transition shadow-md disabled:opacity-50"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Bubble Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-govNavy hover:bg-[#071f3b] text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govNavy"
        aria-label="Toggle chat guide"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-govCream animate-pulse">
            <Bell className="w-3 h-3" />
          </span>
        )}
      </button>
    </div>
  );
};

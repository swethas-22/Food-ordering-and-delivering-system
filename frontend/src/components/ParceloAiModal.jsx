import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Send, Plus, Trash2, Edit2, Mic, MicOff, 
  RotateCcw, AlertCircle, ShoppingBag, Check, Menu
} from 'lucide-react';
import { assistantService } from '../services/parceloServices';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export const ParceloAiModal = ({ isOpen, onClose }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('Say a food preference, budget in ₹, or order question...');

  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Gourmet picks under ₹500',
    'Pure vegetarian Italian dinner',
    'Comfort food for a cozy evening',
    'Status of my latest order',
  ];

  const sampleVoicePrompts = [
    'Suggest something rich with saffron under 500 rupees',
    'Recommend pure vegetarian Michelin inspired dishes',
    'Where is my order PRC-8914?',
    'What are the best chef specials today?',
  ];

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversations();
    }
  }, [isOpen, isAuthenticated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversations = async () => {
    try {
      const res = await assistantService.getConversations();
      setConversations(res.data);
      if (res.data.length > 0) {
        selectConversation(res.data[0].id);
      } else {
        startNewConversation();
      }
    } catch (err) {
      showToast('Error loading conversations.');
    }
  };

  const selectConversation = async (id) => {
    setActiveConvId(id);
    setSidebarOpen(false);
    try {
      const res = await assistantService.getConversation(id);
      setMessages(res.data.messages || []);
    } catch (err) {}
  };

  const startNewConversation = async () => {
    try {
      const res = await assistantService.createConversation('New Culinary Inquiry');
      setConversations((prev) => [res.data, ...prev]);
      setActiveConvId(res.data.id);
      setMessages(res.data.messages || []);
      setSidebarOpen(false);
    } catch (err) {
      showToast('Could not start new conversation.');
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || !activeConvId) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setInputText('');
    setVoiceMode(false);

    // Optimistically add user bubble
    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await assistantService.sendMessage(activeConvId, text);
      const assistantMsg = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.data.reply,
        dishes: res.data.dishes || [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation title if first message
      assistantService.getConversation(activeConvId).then((r) => {
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, title: r.data.title } : c))
        );
      });
    } catch (err) {
      if (err.response?.status === 429) {
        showToast(err.response.data.detail || 'Rate limit reached. Please wait a moment.');
      } else {
        showToast('Parcelo AI is updating with the chef. Please retry in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!activeConvId) return;
    try {
      await assistantService.clearMessages(activeConvId);
      selectConversation(activeConvId);
      showToast('Conversation cleared.');
    } catch (err) {}
  };

  const handleDeleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await assistantService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) selectConversation(remaining[0].id);
        else startNewConversation();
      }
      showToast('Conversation deleted.');
    } catch (err) {}
  };

  const handleAiAddDish = async (dish) => {
    await addToCart(
      dish,
      {
        portion: 'Regular',
        spice: 'Medium',
        extras: [],
        instructions: 'Recommended by Parcelo AI',
      },
      1
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl h-[88vh] rounded-3xl theme-bg-card border theme-border theme-shadow overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Sidebar: Saved Conversations (FR-8.3) */}
        <div
          className={`${
            sidebarOpen ? 'flex' : 'hidden'
          } md:flex flex-col w-full md:w-72 theme-bg-secondary border-r theme-border shrink-0 absolute md:relative inset-y-0 left-0 z-20`}
        >
          <div className="p-4 border-b theme-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 theme-accent-text" />
              <span className="font-serif font-bold text-sm">Culinary Inquiries</span>
            </div>
            <button
              onClick={startNewConversation}
              className="p-1.5 rounded-xl theme-accent-bg text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>

          <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
            {conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`p-3 rounded-2xl text-xs cursor-pointer flex items-center justify-between group transition-all ${
                    isActive
                      ? 'theme-accent-bg font-bold shadow-sm'
                      : 'theme-bg-card border theme-border hover:opacity-85'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="truncate leading-snug">{c.title}</p>
                    <span className="text-[10px] opacity-75 block mt-0.5">{c.time_display}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(c.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-1 cursor-pointer transition-opacity"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t theme-border flex items-center justify-between">
            <button
              onClick={handleClearChat}
              className="text-[11px] theme-text-secondary hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Clear Active Chat
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-xs font-bold theme-accent-text"
            >
              Close
            </button>
          </div>
        </div>

        {/* Right Main Panel: Feed, Quick Prompts & Voice */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          {/* Header */}
          <div className="p-4 border-b theme-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-1.5 rounded-xl theme-bg-secondary border theme-border"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <h4 className="font-serif font-bold text-lg leading-tight flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 theme-accent-text" /> Parcelo AI Concierge
                </h4>
                <p className="text-[10px] theme-text-secondary">
                  Grounded in live Michelin & flagship kitchen records
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setVoiceMode(!voiceMode)}
                className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                  voiceMode
                    ? 'theme-accent-bg border-transparent shadow-sm'
                    : 'theme-bg-secondary theme-border hover:opacity-80'
                }`}
              >
                {voiceMode ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 theme-accent-text" />}
                <span className="hidden sm:inline text-xs font-bold">Voice Mode</span>
              </button>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full theme-bg-secondary flex items-center justify-center hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Interface Overlay (FR-8.9) */}
          {voiceMode ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in">
              <div className="w-24 h-24 rounded-full theme-accent-bg flex items-center justify-center shadow-2xl animate-pulse">
                <Mic className="w-10 h-10" />
              </div>

              {/* Soundwave animation bars */}
              <div className="flex items-center justify-center gap-2 h-10">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="w-1.5 rounded-full soundwave-bar" />
                ))}
              </div>

              <div className="max-w-md">
                <p className="font-serif text-lg font-bold italic mb-1">"{voiceTranscript}"</p>
                <p className="text-[11px] theme-text-secondary">
                  Select a curated culinary phrase below to converse with the concierge:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {sampleVoicePrompts.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setVoiceTranscript(phrase);
                      setTimeout(() => handleSendMessage(phrase), 400);
                    }}
                    className="p-3 rounded-2xl theme-bg-secondary border theme-border text-xs font-semibold text-left hover:scale-[1.02] transition-transform cursor-pointer"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Text Chat Feed */
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl theme-accent-bg flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'rounded-br-sm theme-accent-bg font-medium shadow-sm'
                          : 'rounded-tl-sm theme-bg-secondary border theme-border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Grounded Dish Cards with + Add (FR-8.8) */}
                      {m.dishes && m.dishes.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {m.dishes.map((dish) => (
                            <div
                              key={dish.id}
                              className="p-2.5 rounded-xl theme-bg-card border theme-border flex items-center justify-between gap-2.5 shadow-sm"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={dish.image}
                                  alt={dish.name}
                                  className="w-12 h-12 rounded-lg object-cover shrink-0 bg-neutral-800"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate leading-snug">{dish.name}</p>
                                  <span className="text-[11px] theme-accent-text font-bold block mt-0.5">
                                    ₹{dish.price} • {dish.cuisine || dish.restaurant_name}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAiAddDish(dish)}
                                className="px-3 py-1.5 rounded-xl theme-accent-bg text-[11px] font-bold shrink-0 hover:scale-105 transition-transform flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator (FR-8.2, NFR-P2) */}
              {loading && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl theme-accent-bg flex items-center justify-center text-xs shrink-0 mt-0.5 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-sm theme-bg-secondary border theme-border flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full theme-accent-bg animate-bounce" />
                    <span className="w-2 h-2 rounded-full theme-accent-bg animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full theme-accent-bg animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Prompts Strip (FR-8.2) */}
          {!voiceMode && (
            <div className="px-4 py-2 border-t theme-border flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp)}
                  className="px-3 py-1 rounded-xl theme-bg-secondary border theme-border text-[11px] font-semibold whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-4 border-t theme-border shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about budget, mood, dietary preference, or your order..."
                className="flex-1 px-4 py-3 rounded-2xl theme-bg-secondary border theme-border text-xs sm:text-sm focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="p-3 rounded-2xl theme-accent-bg text-black flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

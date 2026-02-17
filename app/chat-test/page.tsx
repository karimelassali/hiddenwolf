'use client';

import { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';

export default function ChatTestPage() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: userMessage }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Error: Could not connect to NVIDIA AI API.' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[80vh]">
                {/* Header */}
                <div className="bg-slate-800/50 p-4 border-b border-slate-700 flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <Bot className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white">NVIDIA AI Test Console</h1>
                        <p className="text-xs text-slate-400">Testing connection to NVIDIA NIM API</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
                            <Bot className="w-12 h-12" />
                            <p>Send a message to start testing the API</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20' : 'bg-green-500/20'
                                    }`}
                            >
                                {msg.role === 'user' ? (
                                    <User className="w-4 h-4 text-indigo-400" />
                                ) : (
                                    <Bot className="w-4 h-4 text-green-400" />
                                )}
                            </div>
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none'
                                        : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                    }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-green-400" />
                            </div>
                            <div className="bg-slate-800 px-4 py-2 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                <span className="text-xs text-slate-400">Processing...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent placeholder:text-slate-600 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

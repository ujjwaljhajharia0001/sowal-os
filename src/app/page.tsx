"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Volume2, VolumeX, Sparkles, RefreshCw, Command, Compass, Layers } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "sowal";
  text: string;
  speechText?: string;
  engine?: string;
  isStreaming?: boolean;
}

export default function AppleSowalOS() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "sowal",
      text: "SOWAL OS ready hai, Ujjwal. Soil Science ya Agronomy ka kaun sa concept explore karna hai?",
      speechText: "SOWAL OS ready hai Ujjwal. Bataiye kya padhna hai?",
      engine: "Apple Neural Engine"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`$|]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const streamBotResponse = (fullText: string, speechText: string, engineName: string) => {
    const msgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: msgId, sender: "sowal", text: "", speechText, engine: engineName, isStreaming: true }
    ]);

    if (speechText) speakText(speechText);

    let currentIndex = 0;
    const chunkSize = Math.max(3, Math.ceil(fullText.length / 40));
    const interval = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= fullText.length) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: fullText, isStreaming: false } : m))
        );
        clearInterval(interval);
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, text: fullText.slice(0, currentIndex) } : m))
        );
      }
    }, 15);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: userText }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userText,
          mood: "viva",
          activeDocumentName: "Soil Science Blueprint"
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.display) {
        streamBotResponse(data.display, data.speech || "", data.engineUsed || "Gemini Flash");
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: "sowal", text: data.display || "Service temporarily unavailable.", engine: "Error" }
        ]);
      }
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "sowal", text: "Connection error.", engine: "Offline" }
      ]);
    }
  };

  const renderCleanText = (raw: string) => {
    const lines = raw.split("\n");
    return (
      <div className="space-y-2 text-[14.5px] leading-relaxed tracking-tight">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            return (
              <div key={idx} className="flex items-start space-x-2.5 pl-1">
                <span className="text-indigo-400 font-semibold">•</span>
                <span className="flex-1 text-neutral-200">{trimmed.replace(/^[*•-]\s*/, "")}</span>
              </div>
            );
          }

          return <p key={idx} className="text-neutral-200">{trimmed}</p>;
        })}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0b0b0c] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Apple Style Top Navigation Bar */}
      <header className="h-12 border-b border-white/[0.08] px-6 flex items-center justify-between bg-[#0b0b0c]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            
          </div>
          <span className="text-xs font-medium tracking-wide text-neutral-300">
            SOWAL OS <span className="text-neutral-500 mx-1">/</span> <span className="text-indigo-400">Ujjwal Jhajharia</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded-lg transition border ${
              voiceEnabled ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-white/10 text-neutral-500"
            }`}
          >
            {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col h-[calc(100vh-3rem)]">
        
        {/* Chat Card Area with Frosted Glass */}
        <div className="flex-1 flex flex-col rounded-2xl bg-neutral-900/40 border border-white/[0.08] backdrop-blur-2xl shadow-2xl overflow-hidden">
          
          {/* Subheader */}
          <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <Command size={13} className="text-indigo-400" />
              <span>Soil Science & Agronomy AI Core</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm transition-all ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white/[0.04] border border-white/[0.08] text-neutral-200 rounded-bl-sm"
                  }`}
                >
                  {m.sender === "sowal" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[11px] text-neutral-400 font-medium">
                      <span className="flex items-center gap-1.5 text-indigo-400">
                        <Sparkles size={12} /> SOWAL
                      </span>
                      {m.engine && <span className="text-[10px] text-neutral-500">{m.engine}</span>}
                    </div>
                  )}

                  {m.sender === "user" ? (
                    <p className="text-[14.5px] leading-relaxed">{m.text}</p>
                  ) : (
                    <div>
                      {renderCleanText(m.text)}
                      {m.isStreaming && (
                        <span className="inline-block w-1.5 h-3.5 ml-1 bg-indigo-400 animate-pulse align-middle" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-neutral-400 pl-2">
                <RefreshCw size={13} className="animate-spin text-indigo-400" />
                <span>Processing context...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Minimalist Input Bar */}
          <div className="p-4 border-t border-white/[0.06] bg-black/20">
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] focus-within:border-indigo-500/50 rounded-xl px-4 py-3 transition shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything about soil science or start viva..."
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none font-normal"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition shadow-sm"
              >
                <Send size={15} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
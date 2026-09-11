"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Volume2, VolumeX, Sparkles, RefreshCw, Command, Layers, ChevronRight } from "lucide-react";

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
    <main className="min-h-screen bg-[#050507] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* macOS Style Top Menu Bar */}
      <header className="h-11 border-b border-white/[0.06] px-5 flex items-center justify-between bg-[#050507]/70 backdrop-blur-2xl sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
            
          </div>
          <span className="text-xs font-medium tracking-wide text-neutral-300">
            SOWAL OS <span className="text-neutral-600 mx-1.5">•</span> <span className="text-indigo-400 font-semibold">Ujjwal Jhajharia</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            macOS Sequoia UI
          </div>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-1.5 rounded-lg transition border ${
              voiceEnabled ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400" : "border-white/10 text-neutral-500"
            }`}
          >
            {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        
        {/* Sidebar - Apple Glassmorphism Vault */}
        <aside className="hidden md:flex md:col-span-4 flex-col rounded-3xl bg-neutral-900/30 border border-white/[0.06] backdrop-blur-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
            <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold flex items-center gap-2">
              <Layers size={14} className="text-indigo-400" /> Blueprint Vault
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 font-mono">100% Target</span>
          </div>

          <div className="space-y-3 overflow-y-auto pr-1">
            {[
              { id: "01", title: "Official Blueprint & Weightage", progress: "100%" },
              { id: "02", title: "Soil Colloids & CEC Chemistry", progress: "85%" },
              { id: "03", title: "Agronomy & Weed Dynamics", progress: "90%" },
              { id: "04", title: "Fertilizers & Plant Nutrition", progress: "70%" },
            ].map((mod) => (
              <div
                key={mod.id}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-indigo-500/30 transition group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-neutral-300 group-hover:text-white transition flex items-center gap-2">
                    <span className="text-indigo-400 font-mono text-[11px]">{mod.id}.</span> {mod.title}
                  </span>
                  <ChevronRight size={13} className="text-neutral-600 group-hover:text-indigo-400 transition" />
                </div>
                <div className="w-full bg-neutral-800/80 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: mod.progress }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area - Apple Window Interface */}
        <section className="col-span-1 md:col-span-8 flex flex-col rounded-3xl bg-neutral-900/30 border border-white/[0.06] backdrop-blur-2xl shadow-2xl overflow-hidden">
          
          {/* Window Header */}
          <div className="px-6 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1.5 mr-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <Command size={14} className="text-indigo-400 ml-2" />
              <span className="text-xs font-medium text-neutral-300">SOWAL x UJJWAL • Terminal</span>
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
                  className={`max-w-[82%] rounded-2xl px-5 py-4 shadow-lg transition-all ${
                    m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-500/10"
                      : "bg-white/[0.04] border border-white/[0.06] text-neutral-200 rounded-bl-sm"
                  }`}
                >
                  {m.sender === "sowal" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[11px] text-neutral-400 font-medium">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                        <Sparkles size={12} /> SOWAL AI
                      </span>
                      {m.engine && <span className="text-[10px] font-mono text-neutral-500">{m.engine}</span>}
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
                <span>Synthesizing response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Floating Pill Input Bar (Apple Style) */}
          <div className="p-4 border-t border-white/[0.06] bg-black/20">
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] focus-within:border-indigo-500/50 rounded-2xl px-4 py-3 transition shadow-inner">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask anything or test your viva preparation..."
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none font-normal"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white transition shadow-md shadow-indigo-500/20"
              >
                <Send size={15} />
              </button>
            </div>
          </div>

        </section>

      </div>
    </main>
  );
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Volume2, VolumeX, FileText, Sparkles, RefreshCw, Cpu, Layers, ChevronRight } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "sowal";
  text: string;
  speechText?: string;
  engine?: string;
  isStreaming?: boolean;
}

export default function SowalOS() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "sowal",
      text: "SOWAL OS fully synchronized, Ujjwal. Soil Science ya Agronomy ka kaun sa topic revise karna hai ya viva start karein?",
      speechText: "SOWAL OS fully synchronized Ujjwal. Viva start karein?",
      engine: "Master Core"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [activeMood, setActiveMood] = useState<"Focused" | "Empathetic" | "Viva">("Viva");

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
    const chunkSize = Math.max(2, Math.ceil(fullText.length / 50));
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
          mood: activeMood.toLowerCase(),
          activeDocumentName: "Soil Science & Agronomy Blueprint"
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.display) {
        streamBotResponse(data.display, data.speech || "", data.engineUsed || "Gemini 3.6 Flash");
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: "sowal", text: data.display || "Error occurred.", engine: "Error" }
        ]);
      }
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: "sowal", text: "Network connection lost.", engine: "Offline" }
      ]);
    }
  };

  const renderCleanText = (raw: string) => {
    const lines = raw.split("\n");
    return (
      <div className="space-y-2 leading-relaxed text-[14px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-1">
                <span className="text-emerald-400 font-bold">•</span>
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
    <main className="min-h-screen bg-[#121413] text-neutral-100 flex flex-col font-sans">
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-black text-sm">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              SOWAL OS <span className="text-neutral-500">|</span> <span className="text-emerald-400">Ujjwal Jhajharia</span>
            </h1>
            <p className="text-[10px] text-neutral-400">MASTER STABLE EDITION • SOIL SCIENCE</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg border transition ${
              voiceEnabled ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" : "border-white/10 text-neutral-500"
            }`}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        <aside className="hidden md:flex md:col-span-4 flex-col rounded-2xl bg-neutral-900/60 border border-white/10 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium flex items-center gap-2">
              <Layers size={14} className="text-emerald-400" /> Blueprint Vault
            </span>
          </div>
          <div className="space-y-2.5">
            {["Official Blueprint & Weightage", "Soil Colloids & CEC Chemistry", "Agronomy & Weed Dynamics", "Fertilizers & Plant Nutrition"].map((title, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span className="flex items-center gap-2">
                    <FileText size={13} className="text-emerald-400" /> 0{i+1}. {title}
                  </span>
                  <ChevronRight size={13} className="text-neutral-600" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="col-span-1 md:col-span-8 flex flex-col rounded-2xl bg-neutral-900/60 border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center space-x-2">
              <Cpu size={15} className="text-emerald-400" />
              <span className="text-xs font-medium text-neutral-300">Active Viva Terminal</span>
            </div>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {(["Focused", "Empathetic", "Viva"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMood(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeMood === mode ? "bg-white/15 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                  m.sender === "user"
                    ? "bg-emerald-950/70 border border-emerald-500/30 text-emerald-100"
                    : "bg-[#1b1e1d] border border-white/10 text-neutral-200"
                }`}>
                  {m.sender === "sowal" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Sparkles size={12} /> SOWAL OS
                      </span>
                      {m.engine && <span className="text-[10px] font-mono">{m.engine}</span>}
                    </div>
                  )}
                  {m.sender === "user" ? <p className="text-[14px]">{m.text}</p> : renderCleanText(m.text)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-neutral-400 p-2">
                <RefreshCw size={14} className="animate-spin text-emerald-400" />
                <span>Evaluating response...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Apna jawab likhein ya viva sawaal puchein..."
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-black font-semibold transition"
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
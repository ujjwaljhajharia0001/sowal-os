"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  Send,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  RefreshCw,
  Cpu,
  Layers,
  ChevronRight
} from "lucide-react";

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
      text: "<b>Hello Ujjwal!</b> Welcome to your Soil Science study session.<br>I am <b>SOWAL</b>, your viva examiner and study companion.<br>Ready to test your knowledge or break down complex concepts.",
      speechText: "SOWAL OS active hai Ujjwal. Aaj kis topic par test lena hai?",
      engine: "Gemini 3.6 Flash"
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

  // Speech synthesis helper
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[*#_`$|<>\/]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Fast & Smooth Typewriter Engine
  const streamBotResponse = (fullText: string, speechText: string, engineName: string) => {
    const msgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: msgId,
        sender: "sowal",
        text: "",
        speechText,
        engine: engineName,
        isStreaming: true
      }
    ]);

    if (speechText) speakText(speechText);

    let currentIndex = 0;
    const chunkSize = Math.max(3, Math.ceil(fullText.length / 45));
    const interval = setInterval(() => {
      currentIndex += chunkSize;
      if (currentIndex >= fullText.length) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, text: fullText, isStreaming: false } : m
          )
        );
        clearInterval(interval);
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, text: fullText.slice(0, currentIndex) } : m
          )
        );
      }
    }, 18);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: userText }
    ]);
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
          {
            id: Date.now().toString(),
            sender: "sowal",
            text: data.display || "Response fetch nahi ho paya. Dobara try karein.",
            engine: "Failover"
          }
        ]);
      }
    } catch {
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: "sowal",
          text: "Network issue ya server disconnect ho gaya.",
          engine: "Offline"
        }
      ]);
    }
  };

  // Clean HTML & Markdown Renderer
  const renderFormattedText = (raw: string) => {
    const sanitized = raw.replace(/<br\s*[\/]?>/gi, "\n");
    const lines = sanitized.split("\n");

    return (
      <div className="space-y-2 leading-relaxed text-[14.5px]">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-1">
                <span className="text-emerald-400 mt-1 font-bold">•</span>
                <span className="flex-1 text-neutral-200">
                  {parseInlineHTML(trimmed.replace(/^[*•-]\s*/, ""))}
                </span>
              </div>
            );
          }

          return (
            <p key={idx} className="text-neutral-200">
              {parseInlineHTML(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  const parseInlineHTML = (str: string) => {
    const parts = str.split(/(<b>.*?<\/b>|\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if ((part.startsWith("<b>") && part.endsWith("<\/b>")) || (part.startsWith("**") && part.endsWith("**"))) {
        const content = part.startsWith("<b>") ? part.slice(3, -4) : part.slice(2, -2);
        return (
          <strong key={i} className="text-white font-semibold">
            {content}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <main className="min-h-screen bg-[#121413] text-neutral-100 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      {/* Top OS Navigation */}
      <header className="h-14 border-b border-white/10 px-6 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-black text-sm shadow-lg shadow-emerald-500/20">
            S
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              SOWAL OS <span className="text-neutral-500 font-normal">|</span> <span className="text-emerald-400 font-medium">Ujjwal Jhajharia</span>
            </h1>
            <p className="text-[10px] text-neutral-400 tracking-wider">SPATIAL VIVA ENGINE • SOIL SCIENCE & AGRONOMY</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[11px] text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Neural Engine Active
          </div>
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

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 overflow-hidden">
        
        {/* Left Side: Blueprint Modules Vault */}
        <aside className="hidden md:flex md:col-span-4 flex-col rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium flex items-center gap-2">
              <Layers size={14} className="text-emerald-400" /> Blueprint Vault
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-neutral-400">Target 100%</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1">
            {[
              { id: "01", title: "Official Blueprint & Weightage", progress: "100%", status: "Ready" },
              { id: "02", title: "Soil Colloids & CEC Chemistry", progress: "85%", status: "Review" },
              { id: "03", title: "Agronomy & Weed Dynamics", progress: "90%", status: "Active" },
              { id: "04", title: "Fertilizers & Plant Nutrition", progress: "70%", status: "In Queue" },
            ].map((mod) => (
              <div
                key={mod.id}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.06] transition group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-neutral-300 group-hover:text-emerald-300 transition flex items-center gap-2">
                    <FileText size={13} className="text-neutral-500 group-hover:text-emerald-400" />
                    {mod.id}. {mod.title}
                  </span>
                  <ChevronRight size={13} className="text-neutral-600 group-hover:text-emerald-400 transition" />
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: mod.progress }}
                  />
                </div>
                <div className="flex justify-between text-[10px] mt-1.5 text-neutral-500">
                  <span>{mod.status}</span>
                  <span className="text-emerald-400 font-mono">{mod.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Side: Primary SOWAL Viva Terminal */}
        <section className="col-span-1 md:col-span-8 flex flex-col rounded-2xl bg-neutral-900/60 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          
          {/* Terminal Subheader */}
          <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center space-x-2">
              <Cpu size={15} className="text-emerald-400" />
              <span className="text-xs font-medium text-neutral-300">SOWAL x UJJWAL</span>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
              {(["Focused", "Empathetic", "Viva"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMood(mode)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    activeMood === mode
                      ? "bg-white/15 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                    m.sender === "user"
                      ? "bg-emerald-950/70 border border-emerald-500/30 text-emerald-100 rounded-br-sm"
                      : "bg-[#1b1e1d] border border-white/10 text-neutral-200 rounded-bl-sm"
                  }`}
                >
                  {m.sender === "sowal" && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[11px] text-neutral-400">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Sparkles size={12} /> SOWAL
                      </span>
                      {m.engine && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                          {m.engine}
                        </span>
                      )}
                    </div>
                  )}

                  {m.sender === "user" ? (
                    <p className="text-[14.5px] leading-relaxed">{m.text}</p>
                  ) : (
                    <div>
                      {renderFormattedText(m.text)}
                      {m.isStreaming && (
                        <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse align-middle" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-neutral-400 p-2">
                <RefreshCw size={14} className="animate-spin text-emerald-400" />
                <span>Synthesizing conceptual viva evaluation...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User Input Dock */}
          <div className="p-4 border-t border-white/10 bg-black/40">
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/10 focus-within:border-emerald-500/50 rounded-xl px-4 py-2.5 transition">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Sawaal pucho, voice memo do ya viva test lo..."
                className="flex-1 bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-black font-semibold transition"
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
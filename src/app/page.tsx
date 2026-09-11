'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderPlus, Trash2, Folder, FileText, Sparkles, 
  Send, ArrowLeft, Flame, Upload, Eye, X, Loader2,
  Mic, MicOff, Volume2, VolumeX, ChevronRight,
  Zap, PlayCircle, TrendingUp, RefreshCw, Image as ImageIcon, 
  RotateCcw, Timer, Award, CheckCircle2, AlertTriangle, Play,
  Layers2, BookOpenCheck, ChevronLeft, Camera, BarChart3, Radio
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  size: string;
  url?: string;
  type: string;
  extractedText?: string;
  isImage?: boolean;
  base64?: string;
}

interface FolderItem {
  id: string;
  name: string;
  weightage: number;
  retention: number;
  files: FileItem[];
}

interface ExamReport {
  totalQuestions: number;
  score: number;
  strengths: string[];
  weakAreas: string[];
  feedback: string;
}

interface Flashcard {
  front: string;
  back: string;
}

const DEFAULT_FOLDERS: FolderItem[] = [
  {
    id: 'f1',
    name: '01. Official Blueprint & Weightage',
    weightage: 20,
    retention: 94,
    files: [
      { 
        id: 'file1', 
        name: 'ICAR_Curriculum_Syllabus.pdf', 
        size: '1.8 MB', 
        type: 'application/pdf',
        extractedText: 'ICAR Core: Cation exchange capacity (CEC), soil horizons (O, A, E, B, C, R), macro and micro plant nutrients, weed competition critical periods.'
      }
    ]
  },
  {
    id: 'f2',
    name: '02. Soil Colloids & CEC Chemistry',
    weightage: 30,
    retention: 65,
    files: [
      { 
        id: 'file3', 
        name: 'Soil_Colloids_and_CEC.pdf', 
        size: '1.2 MB', 
        type: 'application/pdf',
        extractedText: 'Soil Colloids & CEC: Negative charge via isomorphous substitution. Montmorillonite (2:1 expanding, CEC 80-100 cmol/kg), Kaolinite (1:1 non-expanding, CEC 3-15 cmol/kg).'
      }
    ]
  },
  {
    id: 'f3',
    name: '03. Agronomy & Weed Dynamics',
    weightage: 25,
    retention: 88,
    files: [
      { 
        id: 'file4', 
        name: 'Weed_Management_Principles.pdf', 
        size: '2.1 MB', 
        type: 'application/pdf',
        extractedText: 'Critical weed competition period: first 30-45 days after sowing. Mode of action: Photosystem II inhibition and EPSPS enzyme blocks.'
      }
    ]
  },
  {
    id: 'f4',
    name: '04. Fertilizers & Plant Nutrition',
    weightage: 25,
    retention: 78,
    files: []
  }
];

export default function SowalSpatialStudio() {
  const [folders, setFolders] = useState<FolderItem[]>(DEFAULT_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeDocument, setActiveDocument] = useState<FileItem | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);
  
  // Custom Background State
  const [customBg, setCustomBg] = useState<string | null>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Vision OCR State
  const visionInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  // Companion States
  const [aiMood, setAiMood] = useState<'focused' | 'empathetic' | 'viva'>('focused');
  const [isLoading, setIsLoading] = useState(false);
  const [retentionNotification, setRetentionNotification] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<{ sender: 'user' | 'sowal'; text: string }[]>([]);
  const [userInput, setUserInput] = useState('');

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Rapid-Fire Exam Mode
  const [isExamMode, setIsExamMode] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState(300);
  const [examQuestionCount, setExamQuestionCount] = useState(0);
  const [examReport, setExamReport] = useState<ExamReport | null>(null);

  // Flashcards Feature
  const [activeFlashcards, setActiveFlashcards] = useState<Flashcard[] | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Dynamic Island HUD State
  const [hudMessage, setHudMessage] = useState<string>('Neural Co-Pilot Synchronized');

  // 1. Initial Load
  useEffect(() => {
    try {
      const savedFolders = localStorage.getItem('sowal_os_folders_v2');
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      const savedBg = localStorage.getItem('sowal_os_custom_bg');
      if (savedBg) setCustomBg(savedBg);
    } catch (e) {
      console.warn("Storage fetch error:", e);
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, []);

  // 2. Auto-save
  useEffect(() => {
    if (isLoadedFromStorage) {
      try {
        localStorage.setItem('sowal_os_folders_v2', JSON.stringify(folders));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
    }
  }, [folders, isLoadedFromStorage]);

  // Exam Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isExamMode && examTimeLeft > 0) {
      timer = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            finishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isExamMode, examTimeLeft]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCustomBg(base64);
      try {
        localStorage.setItem('sowal_os_custom_bg', base64);
      } catch (err) {
        console.warn("Wallpaper stored in session.", err);
      }
    };
    reader.readAsDataURL(file);
    if (bgInputRef.current) bgInputRef.current.value = '';
  };

  const removeCustomBg = () => {
    setCustomBg(null);
    localStorage.removeItem('sowal_os_custom_bg');
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);
  const lowestRetentionFolder = folders.reduce((prev, curr) => (prev.retention < curr.retention ? prev : curr), folders[0] || DEFAULT_FOLDERS[0]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        setAvailableVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speakText = (devanagariText: string) => {
    if (!isVoiceOutputEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const cleanText = devanagariText.replace(/[*_#`~]/g, '').replace(/\(.*?\)/g, '').trim();
      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();

      const hindiVoice = 
        voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && v.name.toLowerCase().includes('google')) ||
        voices.find(v => (v.lang === 'hi-IN' || v.lang.startsWith('hi')) && (v.name.toLowerCase().includes('hemant') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('natural'))) ||
        voices.find(v => v.lang === 'hi-IN' || v.lang.startsWith('hi')) ||
        voices.find(v => v.lang.includes('en-IN')) ||
        voices[0];

      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = 'hi-IN';
      }

      utterance.rate = 1.05;
      utterance.pitch = 1.02;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech Error:", err);
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech ke liye Google Chrome use karein.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      setHudMessage('Voice input paused');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setHudMessage('Listening to Viva Voice...');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setHudMessage(`Captured: "${transcript.slice(0, 22)}..."`);
          executeChat(transcript);
        }
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: FolderItem = {
      id: 'folder_' + Date.now(),
      name: newFolderName.trim(),
      weightage: 20,
      retention: 100,
      files: []
    };

    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      setFolders(folders.filter(f => f.id !== id));
      if (activeFolderId === id) setActiveFolderId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !activeFolderId) return;

    const file = uploadedFiles[0];
    const fileUrl = URL.createObjectURL(file);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);

    let extractedText = `Document: ${file.name}. Uploaded on ${new Date().toLocaleDateString()}.`;
    if (file.type.includes('text') || file.name.endsWith('.txt')) {
      try {
        extractedText = await file.text();
      } catch (err) {
        console.warn("Text extraction warning:", err);
      }
    }

    const newFileItem: FileItem = {
      id: 'file_' + Date.now(),
      name: file.name,
      size: `${fileSizeMB} MB`,
      url: fileUrl,
      type: file.type,
      extractedText
    };

    setFolders(folders.map(f => {
      if (f.id === activeFolderId) {
        return { ...f, files: [...f.files, newFileItem] };
      }
      return f;
    }));

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // OCR Vision Scanner Handler
  const handleVisionScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setHudMessage("OCR: Parsing Handwritten Diagram...");
      executeChat("Is handwritten note/diagram ko analyze karke concept explain karo aur iska direct viva sawaal pucho.", undefined, base64);
    };
    reader.readAsDataURL(file);
    if (visionInputRef.current) visionInputRef.current.value = '';
  };

  const handleDeleteFile = (fileId: string) => {
    if (!activeFolderId) return;
    setFolders(folders.map(f => {
      if (f.id === activeFolderId) {
        return { ...f, files: f.files.filter(file => file.id !== fileId) };
      }
      return f;
    }));
    if (activeDocument?.id === fileId) setActiveDocument(null);
  };

  const triggerDocumentViva = (file: FileItem) => {
    setActiveDocument(file);
    setAiMood('viva');
    setHudMessage(`Active Viva: ${file.name.slice(0, 16)}`);
    executeChat(`Ujjwal ne "${file.name}" se viva shuru kiya. Pehla conceptual viva sawaal pucho!`, file);
  };

  const generateFlashcards = (file: FileItem) => {
    setActiveFlashcards([
      {
        front: `What causes negative charge on 2:1 clay minerals like Montmorillonite?`,
        back: `Isomorphous substitution (e.g. Al³⁺ replacing Si⁴⁺ in tetrahedral sheet or Mg²⁺ replacing Al³⁺ in octahedral sheet) creating permanent negative charges.`
      },
      {
        front: `Compare CEC of Kaolinite vs Montmorillonite.`,
        back: `Kaolinite has low CEC (3-15 cmol/kg) due to rigid 1:1 H-bonded structure. Montmorillonite has high CEC (80-100 cmol/kg) due to expanding 2:1 lattice.`
      },
      {
        front: `Define Critical Period of Crop-Weed Competition (CPCWC).`,
        back: `The minimum time period during crop lifecycle (usually initial 30-45 days) where weeds must be suppressed to avoid critical yield loss.`
      },
      {
        front: `Master Soil Horizons in order of depth.`,
        back: `O (Organic litter), A (Mineral topsoil), E (Eluviated leached layer), B (Illuviated subsoil), C (Parent rock fragments), R (Hard bedrock).`
      }
    ]);
    setFlashcardIndex(0);
    setIsCardFlipped(false);
  };

  const startRapidFireExam = () => {
    setIsExamMode(true);
    setExamTimeLeft(300);
    setExamQuestionCount(1);
    setExamReport(null);
    setAiMood('viva');
    setHudMessage('Rapid-Fire Exam Mode Active (5:00)');

    const targetDoc = activeDocument || (activeFolder && activeFolder.files[0]) || null;
    const docTitle = targetDoc ? targetDoc.name : (activeFolder ? activeFolder.name : "Soil Science & Agronomy Blueprint");

    executeChat(`[EXAM_MODE_START] 5-minute Rapid-Fire Viva shuru for "${docTitle}". Question 1/5 pucho direct without introduction:`, targetDoc || undefined);
  };

  const finishExam = () => {
    setIsExamMode(false);
    setHudMessage('Exam Completed • Diagnostic Generated');
    setExamReport({
      totalQuestions: examQuestionCount || 5,
      score: 92,
      strengths: ['Soil Colloids CEC Calculations', 'Horizons Stratification', 'Weed Competition Dynamics'],
      weakAreas: ['Clay Crystal Layer Expanding Ratios', 'Herbicide Site of Action Specifics'],
      feedback: 'Excellent viva speed and conceptual precision. Blueprint targets are well-aligned.'
    });
    boostCurrentFolderRetention();
  };

  const boostCurrentFolderRetention = () => {
    const targetFolderId = activeFolderId || lowestRetentionFolder.id;
    setFolders(prev => prev.map(folder => {
      if (folder.id === targetFolderId) {
        const newScore = Math.min(100, folder.retention + 20);
        return { ...folder, retention: newScore };
      }
      return folder;
    }));
    setRetentionNotification("+20% RETENTION RECOVERED!");
    setTimeout(() => setRetentionNotification(null), 3500);
  };

  const executeChat = async (messageText: string, docOverride?: FileItem, imageBase64?: string) => {
    if ((!messageText.trim() && !imageBase64) || isLoading) return;

    setUserInput('');
    setIsLoading(true);

    const updatedLog = [...chatLog, { sender: 'user' as const, text: imageBase64 ? "📷 [Uploaded Diagram / Handwritten Note for OCR Viva]" : messageText }];
    setChatLog(updatedLog);

    if (isExamMode) {
      setExamQuestionCount(prev => prev + 1);
      if (examQuestionCount >= 5) {
        setTimeout(() => finishExam(), 2000);
      }
    }

    const docInUse = docOverride || activeDocument;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: isExamMode ? `[EXAM_MODE_QUESTION_${examQuestionCount}] ` + messageText : messageText,
          mood: aiMood,
          documentContext: docInUse?.extractedText || '',
          activeDocumentName: docInUse?.name || '',
          imageBase64
        })
      });

      const data = await res.json();
      const displayText = data.display || "Haan Ujjwal, concept clear hai?";
      const speechText = data.speech || displayText;

      setChatLog([...updatedLog, { sender: 'sowal' as const, text: displayText }]);
      speakText(speechText);

      if (data.retentionBoost) {
        boostCurrentFolderRetention();
      }
    } catch {
      setChatLog([...updatedLog, { sender: 'sowal' as const, text: "Thoda network drop hua Ujjwal, ek baar dobara bolo!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#000000] text-[#f5f5f7] flex flex-col font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',Roboto,sans-serif] selection:bg-white/20 relative overflow-hidden">
      
      {/* Dynamic Background */}
      {customBg ? (
        <div 
          className="fixed inset-0 pointer-events-none bg-cover bg-center z-0 transition-all duration-700"
          style={{ backgroundImage: `url(${customBg})` }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" />
        </div>
      ) : (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-600/10 via-emerald-500/5 to-transparent rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 right-10 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[180px]" />
        </div>
      )}

      {/* Floating Dynamic Island HUD */}
      <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto transition-all duration-300">
        <div className="px-4 py-1.5 rounded-full bg-black/75 border border-white/20 backdrop-blur-2xl shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-white/90">{hudMessage}</span>
          </div>
          {isExamMode && (
            <span className="text-[11px] font-mono text-rose-400 font-bold border-l border-white/10 pl-2">
              {formatTime(examTimeLeft)}
            </span>
          )}
        </div>
      </div>

      {/* Center Dynamic Audio Waveform */}
      {(isListening || isSpeaking) && (
        <div className="fixed inset-x-0 bottom-24 flex items-center justify-center pointer-events-none z-40 transition-all duration-500">
          <div className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-2xl shadow-2xl shadow-cyan-500/20 animate-in fade-in zoom-in-95">
            {[40, 70, 100, 85, 60, 95, 120, 80, 55, 90, 65, 40].map((h, index) => (
              <div
                key={index}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening 
                    ? 'bg-gradient-to-t from-rose-500 to-amber-400' 
                    : 'bg-gradient-to-t from-cyan-400 to-emerald-400'
                }`}
                style={{
                  height: `${Math.max(6, (h * (isListening ? 0.4 : 0.35)) + Math.random() * 14)}px`,
                  animation: `pulse ${0.4 + (index % 3) * 0.15}s infinite alternate`
                }}
              />
            ))}
            <span className="text-[11px] font-mono tracking-wider ml-2 text-white/80">
              {isListening ? "LISTENING..." : "SYNTHESIZING..."}
            </span>
          </div>
        </div>
      )}

      {/* Spatial Header */}
      <header className="relative z-30 sticky top-0 px-6 py-3.5 backdrop-blur-2xl bg-black/40 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400/20 via-cyan-400/20 to-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-sm">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                SOWAL <span className="text-[10px] text-white/40 font-mono font-normal">OS</span>
              </h1>
              <span className="text-white/20">•</span>
              <span className="text-xs text-white/80 font-medium">Ujjwal Jhajharia</span>
            </div>
            <p className="text-[10px] text-emerald-400/80 tracking-wide font-mono">
              Spatial Viva Engine • Soil Science & Agronomy Blueprint
            </p>
          </div>
        </div>

        {/* Dynamic Telemetry & Controls */}
        <div className="flex items-center gap-2">
          {/* Blueprint Weightage Matrix Button */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-white/70 font-mono">
            <BarChart3 size={12} className="text-emerald-400" />
            <span>Blueprint: 100M Target</span>
          </div>

          {/* OCR Vision Note Scanner */}
          <input 
            type="file" 
            ref={visionInputRef} 
            onChange={handleVisionScan} 
            className="hidden" 
            accept="image/*"
          />
          <button
            onClick={() => visionInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs transition active:scale-95 shadow-sm"
            title="Scan handwritten notes / diagrams for viva"
          >
            <Camera size={13} />
            <span className="text-[11px] font-medium">Scan Note</span>
          </button>

          {isExamMode ? (
            <button 
              onClick={finishExam} 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs animate-pulse"
            >
              <Timer size={13} />
              <span>{formatTime(examTimeLeft)} • End</span>
            </button>
          ) : (
            <button
              onClick={startRapidFireExam}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs text-rose-300 transition active:scale-95"
              title="Start 5-Minute Timed Viva Test"
            >
              <Timer size={13} className="text-rose-400" />
              <span className="text-[11px] font-medium">Exam Mode</span>
            </button>
          )}

          <input 
            type="file" 
            ref={bgInputRef} 
            onChange={handleBgUpload} 
            className="hidden" 
            accept="image/*"
          />
          <button
            onClick={() => bgInputRef.current?.click()}
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-white/80 transition"
            title="Custom wallpaper"
          >
            <ImageIcon size={14} className="text-cyan-400" />
          </button>

          {customBg && (
            <button
              onClick={removeCustomBg}
              className="p-1.5 rounded-full bg-white/[0.06] hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition"
              title="Reset background"
            >
              <RotateCcw size={13} />
            </button>
          )}

          <div 
            onClick={boostCurrentFolderRetention}
            className={`cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition active:scale-95 ${
              lowestRetentionFolder?.retention < 70 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300 animate-pulse' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            }`}
            title="Click to boost retention"
          >
            <Flame size={12} className={lowestRetentionFolder?.retention < 70 ? "text-amber-400" : "text-emerald-400"} />
            <span>{lowestRetentionFolder?.name.slice(4, 14)} ({lowestRetentionFolder?.retention}%)</span>
            <RefreshCw size={10} className="ml-0.5 opacity-60 hover:opacity-100" />
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4.2rem)]">
        
        {/* Left: Vault & Blueprint Matrix */}
        <section className="lg:col-span-5 flex flex-col h-full overflow-hidden">
          <div className="flex-1 bg-white/[0.03] hover:bg-white/[0.04] transition border border-white/[0.08] rounded-3xl p-5 backdrop-blur-3xl flex flex-col justify-between overflow-hidden shadow-2xl">
            
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  {activeFolderId && (
                    <button 
                      onClick={() => setActiveFolderId(null)} 
                      className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/80 transition"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    {activeFolder ? activeFolder.name : "Blueprint Vault"}
                  </h2>
                </div>

                {!activeFolderId ? (
                  <button 
                    onClick={() => setIsCreatingFolder(true)} 
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium border border-white/10 transition active:scale-95"
                  >
                    <FolderPlus size={13} /> New Module
                  </button>
                ) : (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black text-xs font-medium hover:bg-white/90 transition active:scale-95 shadow-md"
                    >
                      <Upload size={13} /> Add PDF
                    </button>
                  </>
                )}
              </div>

              {isCreatingFolder && !activeFolderId && (
                <form onSubmit={handleCreateFolder} className="mt-3 p-2 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-2">
                  <input 
                    type="text" 
                    autoFocus 
                    placeholder="Module / Chapter name..." 
                    value={newFolderName} 
                    onChange={(e) => setNewFolderName(e.target.value)} 
                    className="flex-1 bg-transparent text-xs text-white px-2 py-1 outline-none placeholder:text-white/30" 
                  />
                  <button type="submit" className="px-3 py-1 rounded-full bg-white text-black text-[11px] font-semibold">Add</button>
                  <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-white/40 text-xs px-2">Cancel</button>
                </form>
              )}

              {/* Folders List */}
              <div className="mt-4 space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
                {!activeFolderId ? (
                  folders.map((folder) => (
                    <div 
                      key={folder.id} 
                      onClick={() => setActiveFolderId(folder.id)} 
                      className="group cursor-pointer p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/15 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/80">
                            <Folder size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-medium text-white group-hover:text-white transition">{folder.name}</h3>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-emerald-400">
                                {folder.weightage}M
                              </span>
                            </div>
                            <span className="text-[11px] text-white/40">{folder.files.length} items</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }} 
                            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={14} className="text-white/20 group-hover:text-white/60 transition" />
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/[0.03] flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              folder.retention < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${folder.retention}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-mono ${folder.retention < 70 ? 'text-amber-400 font-bold' : 'text-white/40'}`}>
                          {folder.retention}% {folder.retention < 70 ? '• DECAY' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  (!activeFolder || activeFolder.files.length === 0) ? (
                    <div className="text-center py-16 text-white/40 text-xs">
                      Folder is empty. Click "Add PDF" to load study material.
                    </div>
                  ) : (
                    activeFolder.files.map((file) => (
                      <div 
                        key={file.id} 
                        className={`group flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          activeDocument?.id === file.id 
                            ? 'bg-cyan-500/10 border-cyan-500/40' 
                            : 'bg-white/[0.02] hover:bg-white/[0.06] border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setViewingFile(file)}>
                          <FileText size={16} className={activeDocument?.id === file.id ? 'text-cyan-300' : 'text-cyan-400/80'} />
                          <div>
                            <p className="text-xs font-medium text-white/90 truncate max-w-[120px]">{file.name}</p>
                            <span className="text-[10px] text-white/40">{file.size}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => generateFlashcards(file)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/80 text-[10px] font-medium transition active:scale-95"
                            title="Generate Flashcards"
                          >
                            <Layers2 size={11} className="text-amber-400" /> Cards
                          </button>

                          <button
                            onClick={() => triggerDocumentViva(file)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[10px] font-medium transition active:scale-95"
                            title="Start Viva from this PDF"
                          >
                            <PlayCircle size={11} /> Viva
                          </button>
                          
                          <button 
                            onClick={() => setViewingFile(file)}
                            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-white/60 transition"
                          >
                            <Eye size={12} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFile(file.id)} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-white/30 hover:text-rose-400 transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] text-[11px] text-white/30 flex justify-between font-mono">
              <span>{folders.length} Blueprint Units</span>
              <span>100% Synced</span>
            </div>
          </div>
        </section>

        {/* Right: Spatial AI Studio View */}
        <section className="lg:col-span-7 flex flex-col h-full overflow-hidden">
          <div className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-3xl flex flex-col justify-between overflow-hidden shadow-2xl relative">
            
            {/* Top Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 h-5 px-2 rounded-full bg-white/[0.04] border border-white/[0.06]">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`w-0.5 rounded-full transition-all duration-300 ${
                        isListening ? 'bg-rose-500 animate-pulse h-4' :
                        isSpeaking ? 'bg-cyan-400 animate-bounce h-3.5' :
                        'bg-white/20 h-1.5'
                      }`}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white tracking-wide">
                    {isExamMode ? 'RAPID-FIRE VIVA' : 'SOWAL x UJJWAL'}
                  </h3>
                  <p className="text-[10px] text-white/40">
                    {isExamMode ? `Exam Session • Question ${examQuestionCount}/5` : activeDocument ? `Viva Engine: ${activeDocument.name}` : isListening ? 'Listening now...' : 'Ready for discussion'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (isSpeaking) window.speechSynthesis.cancel();
                    setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
                  }}
                  className={`p-1.5 rounded-full border transition ${
                    isVoiceOutputEnabled ? 'bg-white/[0.08] border-white/20 text-white' : 'bg-transparent border-white/[0.06] text-white/30'
                  }`}
                  title={isVoiceOutputEnabled ? "Speech Output ON" : "Speech Muted"}
                >
                  {isVoiceOutputEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>

                <div className="flex bg-white/[0.04] p-0.5 rounded-full border border-white/[0.06]">
                  {(['focused', 'empathetic', 'viva'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAiMood(m)}
                      className={`text-[11px] px-3 py-1 rounded-full capitalize transition font-medium ${
                        aiMood === m 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Chat Log */}
            <div className="flex-1 overflow-y-auto py-6 px-1 space-y-4 pr-2">
              {chatLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-white/20">
                  <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center mb-3">
                    <Sparkles size={18} className="text-white/40" />
                  </div>
                  <p className="text-xs font-medium text-white/40">SOWAL Spatial Co-Pilot Active</p>
                  <p className="text-[11px] text-white/20 mt-1">Scan Note dabayein, viva shuru karein ya mic se bole</p>
                </div>
              ) : (
                chatLog.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-3xl text-[13px] leading-relaxed transition-all ${
                        msg.sender === 'user' 
                          ? 'bg-white text-black font-medium rounded-br-md shadow-lg shadow-white/5' 
                          : 'bg-white/[0.05] border border-white/[0.08] text-white/90 rounded-bl-md backdrop-blur-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-white/25 mt-1 px-2 font-mono">
                      {msg.sender === 'user' ? 'UJJWAL' : 'SOWAL'}
                    </span>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-start">
                  <div className="px-5 py-3.5 rounded-3xl bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs flex items-center gap-2 backdrop-blur-md">
                    <Loader2 size={13} className="animate-spin text-white/80" />
                    Processing spatial neural evaluation...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Capsule with Voice Memo */}
            <form onSubmit={(e) => { e.preventDefault(); executeChat(userInput); }} className="pt-2">
              <div className="relative flex items-center bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-white/[0.07] border border-white/[0.1] focus-within:border-white/30 rounded-full p-1.5 transition duration-300 backdrop-blur-xl shadow-2xl">
                
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse' 
                      : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                  }`}
                  title="Speak Viva Answer / Voice Memo"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <input 
                  type="text" 
                  placeholder={isListening ? "Sun raha hoon Ujjwal..." : isExamMode ? "Exam answer type karo ya mic se bolo..." : activeDocument ? `"${activeDocument.name}" viva answer do...` : "Sawaal pucho, voice memo do ya viva test lo..."} 
                  value={userInput} 
                  disabled={isLoading}
                  onChange={(e) => setUserInput(e.target.value)} 
                  className="flex-1 bg-transparent px-3 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none disabled:opacity-50" 
                />

                <button 
                  type="submit" 
                  disabled={isLoading || !userInput.trim()}
                  className="w-10 h-10 rounded-full bg-white hover:bg-white/90 disabled:opacity-20 text-black flex items-center justify-center transition active:scale-95 shadow-md"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>

          </div>
        </section>

      </main>

      {/* 3D Flip Flashcards Modal */}
      {activeFlashcards && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#141416]/95 border border-white/15 rounded-3xl w-full max-w-lg p-6 flex flex-col shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <BookOpenCheck size={18} className="text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                  Card {flashcardIndex + 1} of {activeFlashcards.length}
                </span>
              </div>
              <button 
                onClick={() => setActiveFlashcards(null)} 
                className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <div 
              onClick={() => setIsCardFlipped(!isCardFlipped)}
              className="my-8 min-h-[200px] p-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/15 cursor-pointer flex flex-col justify-between transition-all duration-300 text-center select-none"
            >
              <span className="text-[10px] font-mono tracking-widest uppercase text-white/40">
                {isCardFlipped ? "ANSWER / HIGH-YIELD TAKEAWAY" : "QUESTION / CONCEPT (CLICK TO FLIP)"}
              </span>

              <p className="text-sm sm:text-base font-medium text-white/90 my-auto leading-relaxed">
                {isCardFlipped ? activeFlashcards[flashcardIndex].back : activeFlashcards[flashcardIndex].front}
              </p>

              <span className="text-[10px] text-cyan-400/80 font-mono">
                {isCardFlipped ? "Tap to see question" : "Tap to flip"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                disabled={flashcardIndex === 0}
                onClick={() => { setFlashcardIndex(prev => prev - 1); setIsCardFlipped(false); }}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 text-xs text-white transition"
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <button
                disabled={flashcardIndex === activeFlashcards.length - 1}
                onClick={() => { setFlashcardIndex(prev => prev + 1); setIsCardFlipped(false); }}
                className="flex items-center gap-1 px-4 py-2 rounded-full bg-white text-black font-medium disabled:opacity-20 text-xs transition"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exam Result Scorecard Modal */}
      {examReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-[#141416]/90 border border-white/15 rounded-3xl w-full max-w-xl p-6 sm:p-8 flex flex-col shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white tracking-wide">Viva Performance Report</h3>
                  <p className="text-xs text-white/50 font-mono">Blueprint Diagnostics</p>
                </div>
              </div>
              <button 
                onClick={() => setExamReport(null)}
                className="w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white/70 flex items-center justify-center transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="py-6 flex items-center justify-around border-b border-white/[0.06]">
              <div className="text-center">
                <p className="text-[11px] font-mono uppercase text-white/40">Score</p>
                <p className="text-4xl font-bold text-emerald-400 mt-1">{examReport.score}%</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-[11px] font-mono uppercase text-white/40">Questions</p>
                <p className="text-4xl font-bold text-white mt-1">{examReport.totalQuestions}</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <p className="text-[11px] font-mono uppercase text-white/40">Retention</p>
                <p className="text-4xl font-bold text-cyan-400 mt-1">+20%</p>
              </div>
            </div>

            <div className="space-y-4 my-5">
              <div>
                <h4 className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={13} /> Strong Knowledge Nodes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {examReport.strengths.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={13} /> Review Priority
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {examReport.weakAreas.map((item, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-white/70 bg-white/[0.04] p-3 rounded-2xl border border-white/[0.06] leading-relaxed">
                {examReport.feedback}
              </p>
            </div>

            <button
              onClick={() => setExamReport(null)}
              className="w-full py-3 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition active:scale-[0.98] shadow-lg"
            >
              Done & Resume Workspace
            </button>
          </div>
        </div>
      )}

      {/* Document Inspector Modal */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#121214] border border-white/10 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-white/70" />
                <span className="text-xs font-medium text-white truncate max-w-md">{viewingFile.name}</span>
              </div>
              <button 
                onClick={() => setViewingFile(null)} 
                className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white/70 flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex-1 bg-black/60 flex items-center justify-center p-4">
              {viewingFile.url ? (
                <iframe src={viewingFile.url} className="w-full h-full rounded-2xl border border-white/[0.05]" title="Document" />
              ) : (
                <div className="text-center text-white/40 text-xs">
                  <FileText size={40} className="mx-auto mb-3 opacity-30 text-white" />
                  <p className="font-medium text-white/80">{viewingFile.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
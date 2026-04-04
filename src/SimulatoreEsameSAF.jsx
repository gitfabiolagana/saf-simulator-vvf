import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, XCircle, Clock3, Trophy, Play, BookOpen, Keyboard, ShieldAlert,
  Layers3, History, PauseCircle, PlayCircle, BarChart3, Trash2, Settings, Sliders,
  CheckSquare, Square, Wrench, Volume2, Printer, Flame, Award, Zap, Crosshair,
  RefreshCcw, RotateCcw, Star, TrendingUp, Lightbulb, Upload, ChevronLeft, ChevronRight,
  CreditCard, Calendar, Filter, Timer, StickyNote, Target
} from "lucide-react";
import questionsAll from "./questions.all.json";

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ALL_AREAS = [
  {key:"Rischio",label:"Rischio",doc:"Mod.2"},{key:"Scenari",label:"Scenari",doc:"Mod.1"},
  {key:"Materiali",label:"Materiali",doc:"Mod.4"},{key:"Attrezzature",label:"Attrezzature",doc:"Mod.4"},
  {key:"Equipaggiamento",label:"Equipaggiamento",doc:"Kit"},{key:"Kit Evacuazione",label:"Kit Evac.",doc:"Kit"},
  {key:"Ancoraggi",label:"Ancoraggi",doc:"Mod.5"},{key:"Nodi",label:"Nodi",doc:"Mod.5"},
  {key:"Procedure",label:"Procedure",doc:"Mod.1+5"},{key:"Meccanica",label:"Meccanica",doc:"Mod.2"},
  {key:"Forze",label:"Forze",doc:"Mod.3"},
];
const DEFAULT_SETTINGS = {
  immediateFeedback: false, shuffleOptions: true, customCount: 20,
  customSeconds: 900, customPass: 80, customDifficulty: "all", ttsEnabled: true,
  customAreas: ALL_AREAS.map(a=>a.key), globalTimerSeconds: 300,
};
function RadarChart({data=[],size=220}){
  const n=data.length; if(n<3)return null;
  const cx=size/2,cy=size/2,r=size*0.36;
  const ang=i=>(2*Math.PI*i/n)-Math.PI/2;
  const pt=(i,f)=>({x:cx+Math.cos(ang(i))*r*f,y:cy+Math.sin(ang(i))*r*f});
  const grid=[.25,.5,.75,1].map(f=>data.map((_,i)=>pt(i,f)).map((p,j)=>`${j===0?'M':'L'}${p.x},${p.y}`).join(' ')+'Z');
  const poly=data.map((d,i)=>{const p=pt(i,(d.value||0)/100);return `${i===0?'M':'L'}${p.x},${p.y}`;}).join(' ')+'Z';
  return(<svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-[280px]">
    {grid.map((d,i)=><path key={i} d={d} fill="none" stroke="#e2e8f0" strokeWidth="1"/>)}
    {data.map((_,i)=>{const e=pt(i,1);return<line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#e2e8f0" strokeWidth="1"/>;})}
    <path d={poly} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2"/>
    {data.map((d,i)=>{const lp=pt(i,1.22);return<text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#475569" fontWeight="600" style={{fontSize: '9px'}}>{d.label}</text>;})}
  </svg>);
}
function LineChart({data=[]}){
  if(data.length<2)return<p className="text-center text-slate-400 text-sm py-4">Completa 2+ sessioni per il grafico.</p>;
  const pts=data.slice(-20),W=340,H=80,px=20,py=10,w=W-px*2,h=H-py*2;
  const xf=i=>px+(i/(pts.length-1))*w,yf=v=>py+h-((v/100)*h);
  const d=pts.map((p,i)=>`${i===0?'M':'L'}${xf(i)},${yf(p.y)}`).join(' ');
  return(<svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
    {[0,50,100].map(v=><line key={v} x1={px} y1={yf(v)} x2={px+w} y2={yf(v)} stroke="#f1f5f9" strokeWidth="1"/>)}
    <path d={d+`L${xf(pts.length-1)},${yf(0)}L${xf(0)},${yf(0)}Z`} fill="rgba(99,102,241,0.07)"/>
    <path d={d} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
    {pts.map((p,i)=><circle key={i} cx={xf(i)} cy={yf(p.y)} r="3" fill={p.y>=70?"#10b981":"#ef4444"}/> )}
  </svg>);
}

function getConfig(sessionMode, settings) {
  const base = {
    study:         {label:"Studio Completo",    seconds:0,   pass:0,   count:30},
    exam_easy:     {label:"Esame Facile",        seconds:480, pass:75,  count:15},
    exam_medium:   {label:"Esame Medio",         seconds:600, pass:85,  count:15},
    exam_hard:     {label:"Esame Duro",          seconds:720, pass:90,  count:15},
    exam_mix:      {label:"Esame Misto",         seconds:900, pass:90,  count:15},
    exam_survival: {label:"Survival (Hardcore)", seconds:10,  pass:100, count:50},
    quick_pick:    {label:"Quick Pick",          seconds:0,   pass:80,  count:10},
    exam_global:   {label:"Sfida Globale",       seconds:settings.globalTimerSeconds||300, pass:75, count:settings.customCount||10},
    retry_errors:  {label:"Ripasso Errori",      seconds:0,   pass:80,  count:99},
    custom:        {label:"Sessione Custom",      seconds:settings.customSeconds, pass:settings.customPass, count:settings.customCount},
  };
  return base[sessionMode];
}

function buildQuestions(selectedDataset, sessionMode, qType, settings) {
  let pool = [...questionsAll, ...(JSON.parse(localStorage.getItem("saf_custom_q") || "[]"))];
  
  // Filtering by session/dataset
  if (qType === "vf") pool = pool.filter((q) => q.type === "vf");
  if (qType === "multi") pool = pool.filter((q) => q.type === "multi");
  
  if (selectedDataset === "easy") pool = pool.filter((q) => q.difficulty === "Facile");
  if (selectedDataset === "medium") pool = pool.filter((q) => q.difficulty === "Media");
  if (selectedDataset === "hard") pool = pool.filter((q) => q.difficulty === "Difficile");
  
  // Topic Filtering (The "Documentation Reading" base)
  if (settings.customAreas && settings.customAreas.length > 0) {
    pool = pool.filter((q) => settings.customAreas.includes(q.area));
  }
  
  if (sessionMode === "custom" && settings.customDifficulty !== "all") {
    pool = pool.filter((q) => q.difficulty === settings.customDifficulty);
  }
  
  const count = getConfig(sessionMode, settings)?.count || 15;
  let selected = shuffle(pool).slice(0, count);
  
  if (settings.shuffleOptions) {
    selected.forEach(q => {
      if (q.options.length > 2 || !q.options.includes("Vero")) {
        q.options = shuffle([...q.options]);
      }
    });
  }
  return selected;
}

function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'it-IT';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }
}

function StatCard({ title, value, icon: Icon, accent = "default", extraAction }) {
  const accentMap = {
    default: "bg-slate-50 text-slate-900 border-slate-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    danger: "bg-rose-50 text-rose-900 border-rose-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    indigo: "bg-indigo-50 text-indigo-900 border-indigo-200",
    purple: "bg-purple-50 text-purple-900 border-purple-200",
  };
  return (
    <Card className={`border ${accentMap[accent]} relative overflow-hidden group transition-all duration-300 print:border-slate-300 print:shadow-none`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="min-w-0">
            <div className="text-[10px] md:text-xs uppercase tracking-wider font-semibold opacity-70 mb-1 truncate">{title}</div>
            <div className="text-xl md:text-3xl font-bold tracking-tight">{value}</div>
          </div>
          <div className="shrink-0 rounded-xl md:rounded-2xl bg-white/60 p-2 md:p-3 shadow-sm flex flex-col items-center gap-1 md:gap-2 print:hidden">
            <Icon className="h-4 w-4 md:h-6 md:w-6 opacity-80" />
            {extraAction}
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500 z-0 print:hidden">
          <Icon className="w-32 h-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SimulatoreEsameSAF() {
  const [tab, setTab] = React.useState("exam");
  const [settings, setSettings] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("saf_settings")) || DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });
  
  const [sessionMode, setSessionMode] = React.useState("exam_mix");
  const [datasetKey, setDatasetKey] = React.useState("all");
  const [questionType, setQuestionType] = React.useState("all");
  const [questions, setQuestions] = React.useState(() => buildQuestions("all", "exam_mix", "all", settings));
  const [answers, setAnswers] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [seconds, setSeconds] = React.useState(getConfig("exam_mix", settings).seconds);
  const [running, setRunning] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [onlyWrong, setOnlyWrong] = React.useState(false);
  const [mistakes, setMistakes] = React.useState([]);
  const [history, setHistory] = React.useState(() => JSON.parse(localStorage.getItem("saf_history") || "[]"));
  
  // ── New Features State ──
  const [streak, setStreak] = React.useState(() => JSON.parse(localStorage.getItem("saf_streak") || '{"count":0,"lastDate":""}'));
  const [personalNotes, setPersonalNotes] = React.useState(() => JSON.parse(localStorage.getItem("saf_notes") || "{}"));
  const [editingNote, setEditingNote] = React.useState(null);
  const [noteDraft, setNoteDraft] = React.useState("");
  const [customQuestions, setCustomQuestions] = React.useState(() => JSON.parse(localStorage.getItem("saf_custom_q") || "[]"));
  const [errorQueue, setErrorQueue] = React.useState([]);
  const [fcArea, setFcArea] = React.useState("all");
  const [fcDeck, setFcDeck] = React.useState([]);
  const [fcIndex, setFcIndex] = React.useState(0);
  const [fcFlipped, setFcFlipped] = React.useState(false);

  React.useEffect(() => {
    document.title = "SAF Training Simulator - VVF";
    const meta = document.createElement('meta'); 
    meta.name = 'theme-color'; meta.content = '#4f46e5';
    document.head.appendChild(meta);
  }, []);

  React.useEffect(() => {
    // Il focus e la posizione di scorrimento rimangono invariati
    // come richiesto dall'utente. Nessuno scroll automatico all'inizio della pagina.
  }, [currentIndex]);

  function saveNote() {
    if (!editingNote) return;
    const newNotes = { ...personalNotes, [editingNote]: noteDraft };
    setPersonalNotes(newNotes);
    localStorage.setItem("saf_notes", JSON.stringify(newNotes));
    setEditingNote(null);
  }

  const configObj = getConfig(sessionMode, settings);
  const totalAnswered = Object.keys(answers).length;
  const score = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
  const percent = questions.length ? Math.round((score / questions.length) * 100) : 0;
  const passThreshold = configObj.pass;
  
  // Nel survival il failed è immediato se sbagli, o vince se completi tutte
  const passed = sessionMode === "study" ? false : 
                 sessionMode === "exam_survival" ? (score === questions.length && submitted) : 
                 percent >= passThreshold;
                 
  const progress = questions.length ? Math.round((totalAnswered / questions.length) * 100) : 0;
  const currentQuestion = questions[currentIndex] ?? null;

  // Analitiche per la Dashboard Globale
  const totalExams = history.length;
  const passedExams = history.filter(h => h.passed).length;
  const avgPercent = totalExams ? Math.round(history.reduce((acc, h) => acc + h.percent, 0) / totalExams) : 0;
  const hasPerfect = history.some(h => h.percent === 100);
  const hasSurvival = history.some(h => h.mode.includes("Survival") && h.passed);
  
  // Radar data per area
  const radarData = ALL_AREAS.map(a => {
    const entries = history.filter(h => h.areaScores && h.areaScores[a.key] != null);
    const val = entries.length ? Math.round(entries.reduce((s,h)=>s+(h.areaScores[a.key]||0),0)/entries.length) : 0;
    return { label: a.label, value: val };
  });
  const lineData = [...history].reverse().slice(-20).map(h=>({y:h.percent}));
  const weakArea = (() => { 
    const d = radarData.filter(a => a.value > 0); 
    return d.length ? d.reduce((m,a) => a.value < m.value ? a : m, d[0]) : null; 
  })();

  React.useEffect(() => {
    localStorage.setItem("saf_settings", JSON.stringify(settings));
  }, [settings]);

  React.useEffect(() => {
    if (!running || paused || configObj.seconds === 0) return undefined;
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setRunning(false);
          performSubmit(); // Scadenza tempo = fine
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running, paused, sessionMode, configObj.seconds]);

  React.useEffect(() => {
    const handler = (e) => {
      if (tab !== "exam" || submitted || !currentQuestion || paused) return;
      if (!["1", "2", "3", "v", "V", "f", "F", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
      
      if (e.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
        return;
      }
      if (e.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
        return;
      }
      
      let optionIndex = -1;
      const keyUpper = e.key.toUpperCase();
      if (keyUpper === "V") optionIndex = currentQuestion.options.findIndex((o) => o === "Vero");
      else if (keyUpper === "F") optionIndex = currentQuestion.options.findIndex((o) => o === "Falso");
      else optionIndex = parseInt(e.key) - 1;

      if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
        handleAnswer(currentQuestion.id, currentQuestion.options[optionIndex]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitted, currentQuestion, questions.length, paused, tab]);

  React.useEffect(() => {
    if (!submitted) return;
    const wrong = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correct).map((q) => q.id);
    setMistakes(wrong);
  }, [submitted, questions, answers]);

  function handleAnswer(id, value) {
    if (submitted && sessionMode !== "study") return;
    setAnswers((prev) => ({ ...prev, [id]: value }));
    const isCorrect = value === currentQuestion.correct;

    if (sessionMode === "exam_survival") {
      if (!isCorrect) {
        // Morte improvvisa
        performSubmit();
      } else {
        // Resetta il timer a 10 e avanza
        setSeconds(10);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(curr => curr + 1);
        } else {
          performSubmit(); // Vittoria survival
        }
      }
    }
  }

  function handleTypeChange(newType) {
    setQuestionType(newType);
    const nextQuestions = buildQuestions(datasetKey, sessionMode, newType, settings);
    setQuestions(nextQuestions);
    setAnswers({});
    setSubmitted(false);
    setSeconds(configObj.seconds);
    setRunning(sessionMode !== "study");
    setCurrentIndex(0);
    setOnlyWrong(false);
    setPaused(false);
  }

  function startConfiguredMode(nextSessionMode, nextDatasetKey) {
    const nextQuestions = buildQuestions(nextDatasetKey, nextSessionMode, questionType, settings);
    setSessionMode(nextSessionMode);
    setDatasetKey(nextDatasetKey);
    setQuestions(nextQuestions);
    setAnswers({});
    setSubmitted(false);
    setSeconds(getConfig(nextSessionMode, settings).seconds);
    setRunning(nextSessionMode !== "study");
    setCurrentIndex(0);
    setOnlyWrong(false);
    setPaused(false);
    setTab("exam");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function retryMistakes() {
    const wrongQuestions = questions.filter((q) => mistakes.includes(q.id));
    if (!wrongQuestions.length) return;
    setSessionMode("retry_errors");
    setQuestions(shuffle(wrongQuestions));
    setAnswers({});
    setSubmitted(false);
    setSeconds(0);
    setRunning(false);
    setCurrentIndex(0);
    setOnlyWrong(true);
    setPaused(false);
    setTab("exam");
  }

  function startQuickPick(areaKey) {
    const pool = shuffle([...questionsAll].filter(q => q.area === areaKey && (questionType === "all" || q.type === questionType))).slice(0, 10);
    if (!pool.length) { alert("Nessuna domanda per questo argomento."); return; }
    setSessionMode("quick_pick");
    setDatasetKey("all");
    setQuestions(pool);
    setAnswers({});
    setSubmitted(false);
    setSeconds(0);
    setRunning(false);
    setCurrentIndex(0);
    setOnlyWrong(false);
    setPaused(false);
    setTab("exam");
  }

  function startGlobalMode() {
    const qs = buildQuestions("all", "exam_global", questionType, settings);
    setSessionMode("exam_global");
    setDatasetKey("all");
    setQuestions(qs);
    setAnswers({});
    setSubmitted(false);
    setSeconds(settings.globalTimerSeconds || 300);
    setRunning(true);
    setCurrentIndex(0);
    setOnlyWrong(false);
    setPaused(false);
    setTab("exam");
  }

  function saveNote() {
    const updated = { ...personalNotes, [editingNote]: noteDraft };
    if (!noteDraft.trim()) delete updated[editingNote];
    setPersonalNotes(updated);
    localStorage.setItem("saf_notes", JSON.stringify(updated));
    setEditingNote(null); setNoteDraft("");
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed)) throw 0;
        const tagged = parsed.map((q, i) => ({ ...q, id: `custom_${Date.now()}_${i}` }));
        const merged = [...customQuestions, ...tagged];
        setCustomQuestions(merged);
        localStorage.setItem("saf_custom_q", JSON.stringify(merged));
        alert(`✅ Importate ${tagged.length} domande!`);
      } catch { alert("❌ JSON non valido."); }
    };
    reader.readAsText(file); e.target.value = "";
  }

  function exportCustom() {
    const b = new Blob([JSON.stringify(customQuestions, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "domande_saf_custom.json"; a.click();
  }

  function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yest = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let ns;
    if (streak.lastDate === today) ns = streak;
    else if (streak.lastDate === yest) ns = { count: streak.count + 1, lastDate: today };
    else ns = { count: 1, lastDate: today };
    setStreak(ns); localStorage.setItem("saf_streak", JSON.stringify(ns));
  }

  function performSubmit() {
    setSubmitted(true);
    setRunning(false);
    setPaused(false);
    
    if (sessionMode !== "study" && sessionMode !== "quick_pick") {
      const finalScore = questions.reduce((acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0), 0);
      const finalPercent = questions.length ? Math.round((finalScore / questions.length) * 100) : 0;
      
      let pass = finalPercent >= configObj.pass;
      if (sessionMode === "exam_survival") pass = (finalScore === questions.length);
      
      const areaScores = {};
      ALL_AREAS.forEach(area => {
        const qs = questions.filter(q => q.area === area.key);
        if (qs.length) {
          const correct = qs.filter(q => answers[q.id] === q.correct).length;
          areaScores[area.key] = Math.round((correct / qs.length) * 100);
        }
      });

      const newEntry = {
        id: Date.now(),
        date: new Date().toLocaleString("it-IT"),
        mode: configObj.label,
        type: questionType,
        score: finalScore,
        total: questions.length,
        percent: finalPercent,
        passed: pass,
        areaScores
      };
      
      const updatedHistory = [newEntry, ...history].slice(0, 50);
      setHistory(updatedHistory);
      localStorage.setItem("saf_history", JSON.stringify(updatedHistory));
      updateStreak();
    }
  }

  function clearHistory() {
    if(confirm("Sei sicuro di voler eliminare tutto lo storico delle tue performance mentali?")) {
      setHistory([]);
      localStorage.removeItem("saf_history");
    }
  }

  function updateSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function formatTime(s) {
    const minutes = String(Math.floor(s / 60)).padStart(2, "0");
    const secs = String(s % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function getQuestionStatus(q) {
    const answer = answers[q.id];
    if (!answer) return "idle";
    const showFeedback = sessionMode === "study" || settings.immediateFeedback || submitted;
    if (!showFeedback && sessionMode !== "exam_survival") return "answered"; // survival never hides wrong answers because game over
    return answer === q.correct ? "correct" : "wrong";
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-16 selection:bg-indigo-300">
      
      {/* HEADER HERO AREA */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-8 md:py-12 text-white shadow-xl mb-8 relative print:hidden">
        <div className="mx-auto max-w-6xl space-y-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3 md:space-y-4 max-w-2xl text-center lg:text-left">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3">
                <Badge className="rounded-full bg-indigo-500/30 text-indigo-100 border border-indigo-400/20 px-3 py-1 text-[10px] md:text-xs">Simulatore SAF VVF</Badge>
                <Badge className="rounded-full bg-white/10 text-white/90 border border-white/10 px-3 py-1 text-[10px] md:text-xs">{configObj.label}</Badge>
              </div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight">Accademia Anticaduta</h1>
              <p className="text-indigo-100/70 text-xs md:text-sm lg:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                Apprendimento interattivo, dashboard analitica e generatori custom. 
                Tutto quello che serve per superare la teoria operativa SAF VVF.
              </p>
            </div>
            
            <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 md:gap-3">
              {streak.count > 0 && (
                <div className="col-span-2 sm:col-span-3 lg:col-auto flex items-center justify-center lg:justify-start gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-4 py-2 text-amber-200 text-xs md:text-sm font-semibold">
                  <Flame className="h-3 w-3 md:h-4 md:w-4 text-amber-400"/>
                  Streak: {streak.count} {streak.count===1?"giorno":"giorni"}
                </div>
              )}
              <Button size="sm" className={`rounded-xl shadow-md ${tab==="exam" ? "bg-indigo-500 text-white" : "bg-white/10 text-white"} lg:w-36 justify-center lg:justify-start h-10 md:h-12`} onClick={() => setTab("exam")}>
                <Layers3 className="mr-2 h-4 w-4 md:h-5 md:w-5" /> <span className="text-xs md:text-sm">Esame</span>
              </Button>
              <Button size="sm" className={`rounded-xl shadow-md ${tab==="flashcard" ? "bg-indigo-500 text-white" : "bg-white/10 text-white"} lg:w-36 justify-center lg:justify-start h-10 md:h-12`} onClick={() => setTab("flashcard")}>
                <CreditCard className="mr-2 h-4 w-4 md:h-5 md:w-5" /> <span className="text-xs md:text-sm">Cards</span>
              </Button>
              <Button size="sm" className={`rounded-xl shadow-md ${tab==="library" ? "bg-indigo-500 text-white" : "bg-white/10 text-white"} lg:w-36 justify-center lg:justify-start h-10 md:h-12`} onClick={() => setTab("library")}>
                <BookOpen className="mr-2 h-4 w-4 md:h-5 md:w-5" /> <span className="text-xs md:text-sm">Biblioteca</span>
              </Button>
              <Button size="sm" className={`rounded-xl shadow-md ${tab==="history" ? "bg-indigo-500 text-white" : "bg-white/10 text-white"} lg:w-36 justify-center lg:justify-start h-10 md:h-12`} onClick={() => setTab("history")}>
                <BarChart3 className="mr-2 h-4 w-4 md:h-5 md:w-5" /> <span className="text-xs md:text-sm">Dashboard</span>
              </Button>
              <Button size="sm" className={`rounded-xl shadow-md ${tab==="settings" ? "bg-indigo-500 text-white" : "bg-white/10 text-white"} lg:w-36 justify-center lg:justify-start h-10 md:h-12`} onClick={() => setTab("settings")}>
                <Sliders className="mr-2 h-4 w-4 md:h-5 md:w-5" /> <span className="text-xs md:text-sm">Config</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-8">
        <AnimatePresence mode="wait">
        
        {/* ======================================= */}
        {/* TAB 1: HISTORY & DASHBOARD              */}
        {/* ======================================= */}
        {tab === "history" && (
          <motion.div key="history" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            
            {/* KPI DASHBOARD */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <StatCard title="Test Sostenuti" value={totalExams} icon={Layers3} accent="indigo" />
              <StatCard title="Prove Superate" value={passedExams} icon={CheckCircle2} accent="success" />
              <StatCard title="Media" value={`${avgPercent}%`} icon={Trophy} accent="warning" />
              <StatCard title="Streak" value={`${streak.count}🔥`} icon={Calendar} accent="danger" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-200 shadow-lg rounded-3xl bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><Target className="h-5 w-5 text-indigo-500"/>Mappa Competenze</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {history.some(h=>h.areaScores) ? <RadarChart data={radarData} size={220}/> : <p className="text-center text-slate-400 text-sm py-10 italic">Nessun dato radar disponibile.</p>}
                  {weakArea && weakArea.value > 0 && (
                    <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 shrink-0"/>
                      <span><b>Consiglio:</b> La tua area più debole è <b>{weakArea.label}</b> ({weakArea.value}%). Ti suggeriamo una sessione Quick Pick dedicata.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-lg rounded-3xl bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
                  <CardTitle className="text-lg text-slate-800 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-indigo-500"/>Andamento Risultati</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <LineChart data={lineData}/>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 border bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-xl rounded-2xl mt-6">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <div className="text-xs uppercase tracking-wider font-black opacity-50 mb-3 ml-1">Titoli Sbloccati</div>
                <div className="flex flex-wrap gap-2">
                  {totalExams >= 1 ? <Badge className="bg-indigo-500/80 text-white border-none py-1.5 px-3 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 mr-2"/> Recluta</Badge> : <span className="text-white/40 text-sm italic ml-1">Completa il primo test per sbloccare i tuoi titoli.</span>}
                  {totalExams >= 10 && <Badge className="bg-amber-500/80 text-white border-none py-1.5 px-3 rounded-lg"><Award className="w-3.5 h-3.5 mr-2"/> Veterano</Badge>}
                  {hasPerfect && <Badge className="bg-emerald-500/80 text-white border-none py-1.5 px-3 rounded-lg"><Crosshair className="w-3.5 h-3.5 mr-2"/> Cecchino 100%</Badge>}
                  {hasSurvival && <Badge className="bg-rose-500/80 text-white border-none py-1.5 px-3 rounded-lg"><Flame className="w-3.5 h-3.5 mr-2"/> Sopravvissuto</Badge>}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden bg-white mt-8">
              <CardHeader className="bg-slate-50/80 border-b border-slate-100 p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl md:text-2xl text-slate-800 font-bold">Cronologia Dettagliata</CardTitle>
                    <CardDescription className="text-slate-500 text-sm md:text-base mt-1 md:mt-2">Gli ultimi {history.length} esami completati</CardDescription>
                  </div>
                  {history.length > 0 && (
                    <Button variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50 w-full sm:w-auto" onClick={clearHistory}>
                      <Trash2 className="h-4 w-4 mr-2" /> Cancella Dati
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {history.length === 0 ? (
                  <div className="p-16 text-center text-slate-400">
                    <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>Nessun esame registrato in locale.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map((entry) => (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center sm:text-left flex-1 min-w-0">
                            <div className="font-bold text-slate-800 text-base md:text-lg flex items-center justify-center sm:justify-start gap-2">
                               {entry.mode} {entry.mode.includes("Survival") && <Flame className="w-4 h-4 text-rose-500" />}
                            </div>
                            <div className="text-[10px] md:text-sm text-slate-500 truncate">{entry.date} • Tipo: <b className="text-slate-600">{entry.type}</b></div>
                          </div>
                          <div className="flex items-center gap-4 md:gap-6 justify-center">
                            <div className="text-right">
                              <div className="text-xl md:text-2xl font-black tracking-tight text-slate-700">{entry.percent}%</div>
                              <div className="text-[10px] font-medium text-slate-400">{entry.score} / {entry.total} PT.</div>
                            </div>
                            <Badge className={`px-3 py-1.5 md:px-4 md:py-2 text-[10px] md:text-sm rounded-xl font-bold shadow-sm whitespace-nowrap ${entry.passed ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-rose-100 text-rose-800 border-rose-200"}`}>
                              {entry.passed ? "PROMOSSO" : "FALLITO"}
                            </Badge>
                          </div>
                        </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FLASHCARD TAB */}
        {tab === "flashcard" && (
          <motion.div key="flashcard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <Card className="border-slate-200 shadow-xl rounded-3xl bg-white overflow-hidden">
              <CardHeader className="border-b border-slate-100 p-6 md:p-8 bg-slate-50/50">
                <CardTitle className="text-2xl text-slate-800 font-bold flex items-center gap-3">
                  <CreditCard className="h-7 w-7 text-indigo-500" />
                  Studio Veloce: Flashcard
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-6">
                  <button 
                    onClick={() => { setFcArea("all"); setFcDeck(shuffle([...questionsAll])); setFcIndex(0); setFcFlipped(false); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${fcArea === "all" ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                  >
                    Tutte le aree
                  </button>
                  {ALL_AREAS.map(area => (
                    <button 
                      key={area.key}
                      onClick={() => { setFcArea(area.key); setFcDeck(shuffle([...questionsAll].filter(q => q.area === area.key))); setFcIndex(0); setFcFlipped(false); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${fcArea === area.key ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-8 min-h-[400px] flex flex-col justify-center items-center">
                {fcDeck.length === 0 ? (
                  <div className="text-center space-y-4">
                    <History className="h-16 w-16 mx-auto opacity-10" />
                    <p className="text-slate-400 italic">Nessuna domanda trovata.</p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl space-y-10">
                    <div className="text-center text-xs font-black tracking-widest text-slate-300 uppercase">Quesito {fcIndex + 1} di {fcDeck.length}</div>
                      <motion.div 
                        key={`${fcIndex}-${fcFlipped}`}
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        onClick={() => setFcFlipped(!fcFlipped)}
                        className={`relative w-full cursor-pointer h-56 md:h-72 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all p-6 md:p-10 flex flex-col items-center justify-center text-center gap-4 md:gap-6 ${fcFlipped ? "bg-emerald-50 border-emerald-200 shadow-2xl shadow-emerald-100/50" : "bg-indigo-50 border-indigo-200 shadow-2xl shadow-indigo-100/50"}`}
                      >
                        {!fcFlipped ? (
                          <>
                            <Badge className="absolute top-4 md:top-6 bg-indigo-500/10 text-indigo-600 border-indigo-200 px-3 py-1 font-black rounded-full uppercase text-[9px] md:text-[10px] tracking-widest">{fcDeck[fcIndex].area}</Badge>
                            <div className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">{fcDeck[fcIndex].text}</div>
                            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] md:text-sm mt-2 md:mt-4 uppercase tracking-widest shadow-sm"><RotateCcw className="h-4 w-4" /> Tocca per la risposta</div>
                          </>
                        ) : (
                          <>
                            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 md:mb-2">Risposta Corretta</div>
                            <div className="text-2xl md:text-4xl font-black text-emerald-800">{fcDeck[fcIndex].correct}</div>
                            {fcDeck[fcIndex].explanation && <div className="text-slate-600 text-xs md:text-base mt-2 md:mt-4 max-w-md mx-auto italic">"{fcDeck[fcIndex].explanation}"</div>}
                          </>
                        )}
                      </motion.div>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" size="lg" className="rounded-2xl border-slate-200 text-slate-600" onClick={() => { setFcIndex(prev => Math.max(0, prev - 1)); setFcFlipped(false); }} disabled={fcIndex === 0}><ChevronLeft className="h-6 w-6" /></Button>
                      <Button variant="outline" size="lg" className="rounded-2xl font-black text-indigo-600 border-indigo-200 px-10" onClick={() => setFcFlipped(!fcFlipped)}>GIRA</Button>
                      <Button size="lg" className="rounded-2xl bg-indigo-600 text-white px-10" onClick={() => { setFcIndex(prev => Math.min(fcDeck.length - 1, prev + 1)); setFcFlipped(false); }} disabled={fcIndex === fcDeck.length - 1}><ChevronRight className="h-6 w-6" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ======================================= */}
        {/* TAB 3: BIBLIOTECA (DOCUMENTAZIONE)      */}
        {/* ======================================= */}
        {tab === "library" && (
          <motion.div key="library" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[
                { mod: "Mod. 1", title: "Scale e Procedure Base", doc: "Doc SAF 01", topics: ["Uso delle scale", "Segnali e comunicazione", "Sicurezza del soccorritore"] },
                { mod: "Mod. 2", title: "Rischi e Tiri", doc: "Doc SAF 02", topics: ["Analisi dei rischi", "Carrucole e paranchi", "Meccanica applicata"] },
                { mod: "Mod. 3", title: "Equilibrio e Forze", doc: "Doc SAF 03", topics: ["Centri di gravità", "Triangolo delle forze", "Sollecitazioni dinamiche"] },
                { mod: "Mod. 4", title: "Materiali e Barella", doc: "Doc SAF 04", topics: ["Corde e cordini", "Imbraghi e discensori", "Trasporto sanitario SAF"] },
                { mod: "Mod. 5", title: "Nodi e Impianti", doc: "Doc SAF 05", topics: ["Asola di nido", "Nodi di giunzione", "Impianti a fune"] },
                { mod: "Mod. 6", title: "Scenari d'Intervento", doc: "Doc SAF 06", topics: ["Piloni e tralicci", "Pozzi e cisterne", "Ambienti confinati"] }
              ].map(m => (
                <Card key={m.mod} className="border-slate-200 shadow-lg rounded-3xl bg-white overflow-hidden p-6 hover:border-indigo-400 transition-all group">
                  <Badge className="bg-indigo-600 mb-3">{m.mod}</Badge>
                  <CardDescription className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{m.doc}</CardDescription>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">{m.title}</h3>
                  <ul className="space-y-2 mb-6">
                    {m.topics.map(t => (
                      <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckSquare className="h-4 w-4 text-indigo-300" /> {t}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full rounded-xl text-indigo-600 font-bold border-indigo-100 hover:bg-indigo-50" onClick={() => { setFcArea(m.mod.replace(" ",".")); setTab("flashcard"); }}>Studio Rapido Modulo</Button>
                </Card>
              ))}
              <Card className="border-slate-200 shadow-lg rounded-3xl bg-slate-900 overflow-hidden p-8 flex flex-col justify-center text-center text-white">
                 <BookOpen className="h-12 w-12 mx-auto mb-4 text-indigo-400" />
                 <h3 className="text-xl font-bold mb-2">Manuale Operativo Totale</h3>
                 <p className="text-sm text-slate-400 mb-6">Tutta la documentazione tecnica VVF è integrata nel database delle domande.</p>
                 <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => setTab("settings")}>Configura Aree Studio</Button>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ======================================= */}
        {/* TAB 4: SETTINGS CONFIGURATION           */}
        {/* ======================================= */}
        {tab === "settings" && (
          <motion.div key="settings" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              <Card className="border-slate-200 shadow-lg rounded-3xl bg-white">
                <CardHeader className="border-b border-slate-100 p-6 md:p-8">
                  <CardTitle className="flex items-center gap-3 text-xl text-slate-800">
                    <Settings className="text-indigo-500 h-6 w-6"/> Preferenze Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-2">
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100" onClick={() => updateSetting("immediateFeedback", !settings.immediateFeedback)}>
                    <div className="mt-1">{settings.immediateFeedback ? <CheckSquare className="text-indigo-600" /> : <Square className="text-slate-400" />}</div>
                    <div>
                      <div className="font-semibold text-slate-800">Correzione Immediata Estesa</div>
                      <div className="text-sm text-slate-500 mt-1">Svela la soluzione esatta in verde o rosso ad ogni risposta, anche in Esame a Tempo.</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100" onClick={() => updateSetting("shuffleOptions", !settings.shuffleOptions)}>
                    <div className="mt-1">{settings.shuffleOptions ? <CheckSquare className="text-indigo-600" /> : <Square className="text-slate-400" />}</div>
                    <div>
                      <div className="font-semibold text-slate-800">Mescolamento Dinamico Alternative</div>
                      <div className="text-sm text-slate-500 mt-1">Randomizza ricorsivamente l'ordine alfabetico (A,B,C) delle risposte ad opzione multipla.</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer transition border border-transparent hover:border-slate-100" onClick={() => updateSetting("ttsEnabled", !settings.ttsEnabled)}>
                    <div className="mt-1">{settings.ttsEnabled ? <CheckSquare className="text-indigo-600" /> : <Square className="text-slate-400" />}</div>
                    <div>
                      <div className="font-semibold text-slate-800">Sintesi Vocale TTS</div>
                      <div className="text-sm text-slate-500 mt-1">Abilità un pulsante per leggere le domande ad alta voce (tramite l'accessibilità del browser).</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4 p-4">
                    <div className="font-semibold text-slate-800 flex items-center justify-between">
                      <span>Argomenti Preferiti (Filtro Base)</span>
                      <Button variant="ghost" size="xs" onClick={() => updateSetting("customAreas", ALL_AREAS.map(a=>a.key))} className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest px-2 py-0 border border-indigo-100 rounded-lg">Seleziona Tutti</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                       {ALL_AREAS.map(area => {
                          const active = settings.customAreas?.includes(area.key);
                          return (
                            <button key={area.key} onClick={() => {
                              const newList = active ? settings.customAreas.filter(k => k !== area.key) : [...(settings.customAreas || []), area.key];
                              updateSetting("customAreas", newList);
                            }} className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${active ? "bg-indigo-50 border-indigo-400" : "bg-white border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200"}`}>
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{area.doc}</span>
                              <span className="text-xs font-bold leading-tight">{area.label}</span>
                            </button>
                          );
                       })}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <div className="flex-1">
                       <div className="font-semibold text-slate-800">Dataset Personalizzato</div>
                       <div className="text-xs text-slate-500">{customQuestions.length} domande importate</div>
                    </div>
                    <div className="flex gap-2">
                       <input type="file" id="import-btn" className="hidden" accept=".json" onChange={handleImport} />
                       <Button size="sm" variant="outline" className="rounded-lg h-9 bg-white border-slate-200" onClick={() => document.getElementById('import-btn').click()}><Upload className="w-4 h-4 mr-2"/> Importa</Button>
                       <Button size="sm" variant="outline" className="rounded-lg h-9 bg-white border-slate-200" onClick={exportCustom} disabled={!customQuestions.length}><History className="w-4 h-4 mr-2"/> Esporta</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-100 shadow-lg rounded-3xl bg-white border-2">
                <CardHeader className="bg-indigo-50/50 border-b border-indigo-50 p-6 md:p-8">
                  <CardTitle className="flex items-center justify-between text-xl text-indigo-900">
                    <span className="flex items-center gap-3"><Wrench className="text-indigo-500 h-6 w-6"/> Generatore Sessione Custom</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Batteria Domande</span><span className="text-indigo-600">{settings.customCount} quesiti</span>
                    </div>
                    <input type="range" min="5" max="45" step="5" value={settings.customCount} onChange={(e) => updateSetting("customCount", parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Tempo a Disposizione</span><span className="text-indigo-600">{settings.customSeconds === 0 ? "Illimitato" : `${settings.customSeconds / 60} minuti`}</span>
                    </div>
                    <input type="range" min="0" max="3600" step="300" value={settings.customSeconds} onChange={(e) => updateSetting("customSeconds", parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Soglia Promozione</span><span className="text-indigo-600">{settings.customPass}% Corrette</span>
                    </div>
                    <input type="range" min="50" max="100" step="5" value={settings.customPass} onChange={(e) => updateSetting("customPass", parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  </div>
                  <div className="space-y-3">
                    <div className="font-medium text-slate-800 mb-2">Classe di Difficoltà per il pool</div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant={settings.customDifficulty === "all" ? "default" : "outline"} onClick={() => updateSetting("customDifficulty", "all")} className={`rounded-xl px-5 h-9 ${settings.customDifficulty==="all"?"bg-indigo-600":""}`}>Tutte Miste</Button>
                      <Button size="sm" variant={settings.customDifficulty === "Facile" ? "default" : "outline"} onClick={() => updateSetting("customDifficulty", "Facile")} className={`rounded-xl px-4 h-9 ${settings.customDifficulty==="Facile"?"bg-emerald-600 hover:bg-emerald-700":""}`}>Facili</Button>
                      <Button size="sm" variant={settings.customDifficulty === "Media" ? "default" : "outline"} onClick={() => updateSetting("customDifficulty", "Media")} className={`rounded-xl px-4 h-9 ${settings.customDifficulty==="Media"?"bg-amber-500 hover:bg-amber-600":""}`}>Medie</Button>
                      <Button size="sm" variant={settings.customDifficulty === "Difficile" ? "default" : "outline"} onClick={() => updateSetting("customDifficulty", "Difficile")} className={`rounded-xl px-4 h-9 ${settings.customDifficulty==="Difficile"?"bg-rose-600 hover:bg-rose-700":""}`}>Complesse</Button>
                    </div>
                  </div>
                  <Button size="lg" className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-14 text-lg font-bold" onClick={() => startConfiguredMode("custom", "all")}>
                    <Play className="mr-2 h-5 w-5" /> Avvia Questo Esame Personalizzato
                  </Button>
                </CardContent>
              </Card>

            </div>
          </motion.div>
        )}

        {/* ======================================= */}
        {/* TAB 3: ACTIVE EXAM (CORE)               */}
        {/* ======================================= */}
        {tab === "exam" && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            
            {/* CONTROLS CARD */}
            <Card className="rounded-3xl border-slate-200 shadow-sm bg-white z-20 relative overflow-hidden print:hidden">
              <CardContent className="p-6 space-y-5">
                
                <div className="flex flex-col xl:flex-row gap-5 xl:items-center justify-between border-b border-slate-100 pb-5">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={questionType === "all" ? "default" : "outline"} className={`rounded-xl h-9 px-5 ${questionType === "all" ? "bg-slate-800 text-white" : ""}`} onClick={() => handleTypeChange("all")}>Interrogazione Mista</Button>
                    <Button size="sm" variant={questionType === "vf" ? "default" : "outline"} className={`rounded-xl h-9 px-5 ${questionType === "vf" ? "bg-slate-800 text-white" : ""}`} onClick={() => handleTypeChange("vf")}>Formato V/F</Button>
                    <Button size="sm" variant={questionType === "multi" ? "default" : "outline"} className={`rounded-xl h-9 px-5 ${questionType === "multi" ? "bg-slate-800 text-white" : ""}`} onClick={() => handleTypeChange("multi")}>Opzioni Multiple</Button>
                  </div>
                </div>

                {!running && (
                  <div className="space-y-4 pt-2">
                    <Button size="xl" className="w-full rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 h-16 text-xl font-bold shadow-xl shadow-indigo-200 group relative overflow-hidden" onClick={startGlobalMode}>
                      <Zap className="mr-3 h-6 w-6 text-amber-300" /> Avvia Sfida Globale (Timer)
                    </Button>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 pt-2">
                       {ALL_AREAS.map(area => (
                         <button key={area.key} onClick={() => startQuickPick(area.key)} className="flex flex-col items-center justify-center p-2 md:p-3 rounded-xl border-2 border-slate-100 bg-white hover:border-indigo-400 hover:shadow-md transition-all text-center group">
                           <span className="text-[9px] md:text-[10px] font-black text-indigo-500 uppercase tracking-tighter mb-0.5 md:mb-1">{area.doc}</span>
                           <span className="text-[10px] md:text-[11px] font-bold text-slate-700 leading-tight line-clamp-1">{area.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-2 md:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-center">
                  <Button className="rounded-xl shadow-sm border border-slate-200 h-10 md:h-12 bg-white text-xs md:text-sm" onClick={() => startConfiguredMode("study", "all")} variant={sessionMode === "study" ? "default" : "secondary"}><BookOpen className="mr-2 h-4 w-4" /> Studio Base</Button>
                  <Button className="rounded-xl shadow-sm border border-slate-200 h-10 md:h-12 bg-white text-xs md:text-sm" onClick={() => startConfiguredMode("exam_medium", "medium")} variant={sessionMode === "exam_medium" ? "default" : "secondary"}><Play className="mr-2 h-4 w-4" /> Simulazione Media</Button>
                  <Button className="rounded-xl shadow-sm border border-indigo-200 h-10 md:h-12 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs md:text-sm" onClick={() => startConfiguredMode("exam_mix", "all")}><Layers3 className="mr-2 h-4 w-4" /> Test Ufficiale Totale</Button>
                  <Button className="rounded-xl shadow-sm border border-rose-200 h-10 md:h-12 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs md:text-sm" onClick={() => startConfiguredMode("exam_survival", "all")}><Flame className="mr-2 h-4 w-4" /> Morte Improvvisa</Button>
                </div>

                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 pt-2">
                  <StatCard title="Batteria" value={questions.length} icon={ShieldAlert} accent={sessionMode === "exam_survival" ? "danger" : "indigo"} />
                  <StatCard title="Fornite" value={totalAnswered} icon={CheckCircle2} accent="default" />
                  <StatCard title="Punteggio" value={submitted || sessionMode === "study" || settings.immediateFeedback ? `${score}` : "—"} icon={Trophy} accent={submitted ? (passed ? "success" : "danger") : "default"} />
                  <StatCard 
                    title={sessionMode === "exam_survival" ? "Timer" : "Tempo"} 
                    value={sessionMode === "study" ? "Studio" : (paused ? "PAUSA" : formatTime(seconds))} 
                    icon={sessionMode === "exam_survival" ? Zap : Clock3} 
                    accent={sessionMode === "exam_survival" || (configObj.seconds && seconds < 60) ? "danger" : "default"}
                    extraAction={
                      running && !submitted && sessionMode !== "study" && sessionMode !== "exam_survival" ? (
                        <div className="cursor-pointer rounded-full p-2 bg-slate-800 text-white hover:bg-slate-700 shadow-md" onClick={() => setPaused(!paused)}>
                          {paused ? <PlayCircle className="h-4 w-4 md:h-5 md:w-5" /> : <PauseCircle className="h-4 w-4 md:h-5 md:w-5" />}
                        </div>
                      ) : null
                    }
                  />
                </div>

                <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100 mt-2">
                  <Progress value={progress} className="h-1.5 rounded-full bg-slate-200" />
                </div>
              </CardContent>
            </Card>

            {/* In Print View, generate a flat layout of all questions and answers if submitted */}
            <div className="hidden print:block space-y-6">
              <div className="text-3xl font-bold mb-8 pb-4 border-b-2 border-black">
                 Report Esame: {configObj.label} - Punteggio: {percent}% ({passed ? "PROMOSSO" : "NON SUPERATO"})
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="mb-6 p-4 border border-gray-300 rounded-lg break-inside-avoid">
                  <div className="font-bold text-lg mb-2">{i+1}. {q.text}</div>
                  <div className="pl-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className={`mb-1 ${opt === q.correct ? "font-bold text-green-700" : ""}`}>
                         {answers[q.id] === opt ? "➤ " : "○ "} {opt} {opt === q.correct && " (Corretta)"}
                      </div>
                    ))}
                    <div className="mt-3 text-sm italic text-gray-600 bg-gray-50 p-2 rounded">Note: {q.explanation}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] items-start print:hidden">
              
              {/* === PROGRESS NAVIGATION === */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-6">
                <Card className="border-slate-200 shadow-md rounded-2xl md:rounded-3xl bg-white overflow-hidden">
                  <CardContent className="p-3 md:p-5">
                    {/* Desktop/Tablet Grid OR Mobile Scrollable Row */}
                    <div className="flex lg:grid lg:grid-cols-5 gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                      {questions.map((q, index) => {
                        const status = getQuestionStatus(q);
                        const statusClass = {
                          idle: "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                          answered: "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold",
                          correct: "bg-emerald-50 border-emerald-400 text-emerald-700 font-bold",
                          wrong: "bg-rose-50 border-rose-400 text-rose-700 font-bold",
                        }[status];
                        return (
                          <button 
                            key={q.id} disabled={sessionMode === "exam_survival"}
                            onClick={() => {
                              setCurrentIndex(index);
                              // Su mobile, scrolla il tasto al centro se cliccato (opzionale)
                            }} 
                            className={`min-w-[40px] h-10 lg:w-full rounded-xl text-xs md:text-sm border transition-all shrink-0 ${statusClass} ${currentIndex === index ? "ring-2 md:ring-4 ring-indigo-200 scale-105 shadow-md z-10" : ""} ${sessionMode === "exam_survival" ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {index + 1}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* === MAIN CONTENT AREA === */}
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {paused ? (
                    <motion.div key="paused" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
                      <Card className="border-indigo-100 shadow-2xl rounded-[2rem] bg-gradient-to-br from-indigo-50 to-white text-center py-20">
                         <PauseCircle className="h-24 w-24 text-indigo-300 mx-auto mb-6 drop-shadow-sm" />
                         <h2 className="text-4xl font-black text-indigo-900 tracking-tight">Test In Pausa</h2>
                         <Button size="lg" className="mt-8 rounded-2xl px-12 h-14 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:scale-105" onClick={() => setPaused(false)}>Riprendi</Button>
                      </Card>
                    </motion.div>
                  ) : currentQuestion ? (
                    <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                      <Card className="border-slate-200 shadow-xl rounded-[2rem] bg-white overflow-hidden">
                        <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-5 md:p-8">
                          <div className="flex flex-col gap-4 md:gap-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="rounded-md bg-slate-800 text-white font-bold tracking-wider px-2 md:px-3 py-1 text-[10px] md:text-xs">Quesito {currentIndex + 1}</Badge>
                              <Badge className="rounded-md bg-slate-200 text-slate-800 border-none px-2 md:px-3 py-1 text-[10px] md:text-xs truncate max-w-[100px] md:max-w-none">{currentQuestion.area}</Badge>
                              <Badge className="rounded-md bg-indigo-100 text-indigo-800 border-none px-2 md:px-3 py-1 text-[10px] md:text-xs">{currentQuestion.difficulty}</Badge>
                              
                              {settings.ttsEnabled && (
                                <Button variant="ghost" size="sm" onClick={() => speakText(currentQuestion.text)} className="ml-auto rounded-full w-8 h-8 p-0 bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                                  <Volume2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <CardTitle className="text-lg md:text-2xl font-extrabold text-slate-800 leading-snug md:leading-[1.4]">
                              {currentQuestion.text}
                            </CardTitle>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6 md:p-8 space-y-4">
                          <div className="flex flex-col gap-3 md:gap-4">
                            {currentQuestion.options?.map((option, idx) => {
                              const isSelected = answers[currentQuestion.id] === option;
                              const isCorrect = option === currentQuestion.correct;
                              let showCorrection = (sessionMode === "study" && answers[currentQuestion.id]) || settings.immediateFeedback && answers[currentQuestion.id] || submitted;
                              if (sessionMode === "exam_survival") showCorrection = submitted; 
                              
                              let bgClasses = "bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-300";
                              let textClasses = "text-slate-700";
                              let ringString = "";
                              let iconRender = null;
                              
                              if (isSelected) {
                                bgClasses = "bg-indigo-50 border-indigo-400";
                                textClasses = "text-indigo-900";
                                ringString = "ring-2 md:ring-4 ring-indigo-500/10";
                              }
                              
                              if (showCorrection) {
                                if (isCorrect) {
                                    bgClasses = "bg-emerald-50 border-emerald-500";
                                    textClasses = "text-emerald-900";
                                    ringString = isSelected ? "ring-2 md:ring-4 ring-emerald-500/20" : "";
                                    iconRender = <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-500 shrink-0" />;
                                } else if (isSelected && !isCorrect) {
                                    bgClasses = "bg-rose-50 border-rose-400";
                                    textClasses = "text-rose-900";
                                    iconRender = <XCircle className="h-5 w-5 md:h-6 md:w-6 text-rose-500 shrink-0" />;
                                } else { bgClasses += " opacity-50"; }
                              }

                              let shortcutTrigger = (idx + 1).toString();
                              if (option === "Vero") shortcutTrigger = "V";
                              if (option === "Falso") shortcutTrigger = "F";
                              
                              return (
                                <motion.div key={idx}>
                                  <button onClick={() => handleAnswer(currentQuestion.id, option)} disabled={showCorrection && sessionMode !== "study"} className={`w-full text-left p-3 md:p-5 min-h-[3.5rem] md:min-h-[4.5rem] rounded-xl md:rounded-2xl border-2 flex items-center gap-3 md:gap-4 transition-all duration-200 shadow-sm ${bgClasses} ${textClasses} ${ringString} ${showCorrection && sessionMode !== "study" ? "cursor-default" : "cursor-pointer"}`}>
                                    <div className={`w-6 h-6 md:w-8 md:h-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-[10px] md:text-sm shadow-sm ${isSelected && !showCorrection ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{shortcutTrigger}</div>
                                    <span className="flex-1 text-sm md:text-[17px] font-medium leading-relaxed">{option}</span>
                                    {iconRender}
                                  </button>
                                </motion.div>
                              );
                            })}
                          </div>

                          <AnimatePresence>
                            {(answers[currentQuestion.id] || submitted) && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                                <div className={`mt-6 rounded-2xl border p-6 shadow-inner ${getQuestionStatus(currentQuestion) === "correct" ? "border-emerald-200 bg-emerald-50/60" : getQuestionStatus(currentQuestion) === "wrong" ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-slate-50"}`}>
                                  {editingNote === currentQuestion.id ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest"><Pencil className="w-3.5 h-3.5"/> Modifica Nota Personale</div>
                                      <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} className="w-full bg-white border-2 border-indigo-100 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-400 min-h-[100px]" placeholder="Scrivi qui i tuoi appunti su questa domanda..." autoFocus />
                                      <div className="flex gap-2">
                                        <Button size="sm" className="bg-indigo-600 text-white rounded-lg h-9 px-4" onClick={saveNote}>Salva Nota</Button>
                                        <Button size="sm" variant="ghost" className="rounded-lg h-9" onClick={() => setEditingNote(null)}>Annulla</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="flex items-start gap-3">
                                        {getQuestionStatus(currentQuestion) === "correct" ? <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" /> : getQuestionStatus(currentQuestion) === "wrong" ? <XCircle className="h-6 w-6 text-rose-600 shrink-0" /> : <Timer className="h-6 w-6 text-slate-400 shrink-0" />}
                                        <div className="flex-1">
                                          <h4 className={`text-lg font-bold mb-1 ${getQuestionStatus(currentQuestion) === "correct" ? "text-emerald-900" : getQuestionStatus(currentQuestion) === "wrong" ? "text-rose-900" : "text-slate-900"}`}>
                                            {getQuestionStatus(currentQuestion) === "correct" ? "Risposta Corretta." : getQuestionStatus(currentQuestion) === "wrong" ? `Sbagliato. Risposta esatta: ${currentQuestion.correct}` : "In attesa di risposta..."}
                                          </h4>
                                          <p className="text-sm md:text-base leading-relaxed text-slate-700 font-medium mb-3 opacity-90">{currentQuestion.explanation}</p>
                                          
                                          {personalNotes[currentQuestion.id] ? (
                                            <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/50 flex flex-col gap-2 relative shadow-sm">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1.5"><StickyNote className="w-3 h-3"/> I miei Appunti</span>
                                                <Button variant="ghost" size="xs" onClick={() => { setEditingNote(currentQuestion.id); setNoteDraft(personalNotes[currentQuestion.id]); }} className="text-[10px] opacity-60 hover:opacity-100 uppercase tracking-widest h-6 px-3">Modifica</Button>
                                              </div>
                                              <p className="text-sm font-medium text-slate-700 italic">"{personalNotes[currentQuestion.id]}"</p>
                                            </div>
                                          ) : (
                                            <Button variant="ghost" size="sm" className="text-xs text-indigo-600 font-black uppercase tracking-widest p-0 mt-2 hover:bg-transparent hover:text-indigo-800" onClick={() => { setEditingNote(currentQuestion.id); setNoteDraft(""); }}>
                                              <StickyNote className="w-3.5 h-3.5 mr-2" /> Aggiungi Nota Personale
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ) : null}
                </AnimatePresence>

                {submitted && sessionMode !== "study" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className={`border shadow-2xl rounded-3xl overflow-hidden relative ${passed ? "border-emerald-300" : "border-rose-300"}`}>
                      <div className={`absolute top-0 left-0 right-0 h-3 ${passed ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <CardContent className="p-8 md:p-10 space-y-8 mt-4">
                        <div className={`rounded-2xl p-8 border text-center ${passed ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"}`}>
                          <div className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{passed ? "Esame Superato!" : "Prova Fallita."}</div>
                          <div className="text-xl opacity-90">Completato con il <b>{percent}%</b> di accuratezza ({score}/{questions.length} corrette).</div>
                          {sessionMode === "exam_survival" && !passed && <div className="mt-4 font-bold uppercase text-sm text-rose-600 tracking-wider"><Flame className="w-4 h-4 inline mb-1 mr-1"/> Morte Improvvisa Intervenuta</div>}
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                          <Button size="lg" onClick={() => startConfiguredMode(sessionMode, datasetKey)} className="rounded-xl shadow-lg bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg font-bold"><RefreshCcw className="mr-2 h-5 w-5"/> Riprova Sessione</Button>
                          <Button size="lg" onClick={retryMistakes} variant="outline" className="rounded-xl shadow-sm border-slate-300 h-14 px-8 text-lg font-bold" disabled={!mistakes.length}><Settings className="mr-2 h-5 w-5"/> Ripassa Errate ({mistakes.length})</Button>
                          <Button size="lg" onClick={() => window.print()} variant="ghost" className="rounded-xl border border-slate-200 h-14 px-8 font-bold"><Printer className="mr-2 h-5 w-5"/> Stampa Report Finale</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
                
                {/* Modali di consegna */}
                {/* Persistent Navigation Footer (Mobile & Desktop) */}
                {/* Persistent Navigation Footer (Fixed at bottom on Mobile) */}
                {!submitted && !paused && sessionMode !== "exam_survival" && (
                  <div className="fixed sm:sticky bottom-0 left-0 right-0 p-3 md:py-6 md:px-0 z-[100] bg-gradient-to-t from-white via-white/90 to-transparent">
                    <Card className="border-indigo-100 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] rounded-2xl md:rounded-3xl bg-white/98 backdrop-blur-md flex items-center justify-between p-3 md:p-4 gap-3 max-w-4xl mx-auto border-t-2">
                       <div className="flex items-center gap-2 md:gap-4 shrink-0">
                         <Button 
                           variant="outline" 
                           size="icon" 
                           className="h-12 w-12 md:h-14 md:w-14 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95" 
                           onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} 
                           disabled={currentIndex === 0}
                         >
                           <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" />
                         </Button>
                         
                         <div className="flex flex-col items-center px-4 py-2 bg-indigo-50/50 rounded-2xl border border-indigo-100 min-w-[70px]">
                           <span className="text-[10px] font-black uppercase text-indigo-400 leading-none mb-1">Domanda</span>
                           <span className="font-black text-lg md:text-xl text-indigo-700 leading-none">{currentIndex + 1} <span className="text-indigo-300 font-medium text-xs md:text-sm">/ {questions.length}</span></span>
                         </div>

                         <Button 
                           variant="outline" 
                           size="icon" 
                           className="h-12 w-12 md:h-14 md:w-14 rounded-2xl border-indigo-200 bg-white text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95" 
                           onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} 
                           disabled={currentIndex === questions.length - 1}
                         >
                           <ChevronRight className="h-6 w-6 md:h-7 md:w-7" />
                         </Button>
                       </div>

                       <div className="flex items-center gap-3 flex-1 justify-end">
                         {sessionMode !== "study" ? (
                           <Button 
                             onClick={performSubmit} 
                             className="rounded-2xl px-6 md:px-12 bg-slate-900 hover:bg-black text-white font-black h-12 md:h-14 text-sm md:text-base shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                           >
                             CONSEGNA <span className="hidden sm:inline ml-1">ADESSO</span>
                           </Button>
                         ) : (
                           <div className="flex flex-col text-right pr-2">
                             <div className="flex items-center gap-2 text-indigo-500 justify-end">
                               <BookOpen className="h-4 w-4" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Modalità Studio</span>
                             </div>
                             <span className="text-xs font-bold text-slate-500">Scorri per navigare</span>
                           </div>
                         )}
                       </div>
                    </Card>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

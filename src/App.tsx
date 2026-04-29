import React, { useState, useEffect, useRef } from 'react';
import { generatePuzzle, evaluateAnswer, Puzzle, EvaluationResult } from './services/geminiService';
import { Terminal, Activity, Cpu, Hexagon, Cloud, Anchor, CheckCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

const DISCIPLINES = [
  { id: 'Software', icon: Terminal, color: 'text-green-400' },
  { id: 'Electronics', icon: Cpu, color: 'text-blue-400' },
  { id: 'Mechanical', icon: Hexagon, color: 'text-orange-400' },
  { id: 'Aeronautics', icon: Anchor, color: 'text-cyan-400' },
  { id: 'DevOps', icon: Cloud, color: 'text-purple-400' },
];

export default function App() {
  const [activeDiscipline, setActiveDiscipline] = useState<string>(DISCIPLINES[0].id);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [score, setScore] = useState<number>(0);
  
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);

  const loadPuzzle = async (discipline: string, diff: number) => {
    setIsLoading(true);
    setEvalResult(null);
    setUserAnswer('');
    try {
      const p = await generatePuzzle(discipline, diff);
      setCurrentPuzzle(p);
    } catch (e) {
      console.error(e);
      // Fallback puzzle or error state
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPuzzle(activeDiscipline, difficulty);
  }, []);

  const handleDisciplineChange = (d: string) => {
    if (evaluating || isLoading) return;
    setActiveDiscipline(d);
    loadPuzzle(d, difficulty);
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !currentPuzzle || evaluating) return;

    setEvaluating(true);
    try {
      const res = await evaluateAnswer(currentPuzzle, userAnswer);
      setEvalResult(res);
      if (res.isCorrect) {
        setScore(s => s + difficulty * 10);
        setDifficulty(d => Math.min(10, d + 1));
      } else {
        setDifficulty(d => Math.max(1, d - 1));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const nextPuzzle = () => {
    loadPuzzle(activeDiscipline, difficulty);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full max-w-full m-0 p-0 overflow-hidden bg-[#050505] text-[#E0E0E0] font-sans selection:bg-[#4ADE80]/30 selection:text-white">
      {/* Sidebar */}
      <aside className="w-full md:w-[380px] border-b md:border-b-0 md:border-r border-white/10 p-10 flex flex-col gap-8 bg-[#070708]">
        <div>
          <h1 className="text-4xl font-serif italic text-white/90 mb-2">Crucible</h1>
          <div className="text-[10px] text-white/40 font-mono tracking-[0.2em] uppercase">Session ID: {activeDiscipline.substring(0,3).toUpperCase()}-882</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[10px] text-white/40 font-mono tracking-[0.2em] uppercase mb-4">Select Discipline</div>
          {DISCIPLINES.map(d => {
            const Icon = d.icon;
            const active = activeDiscipline === d.id;
            return (
              <button
                key={d.id}
                onClick={() => handleDisciplineChange(d.id)}
                disabled={isLoading || evaluating}
                className={`flex items-center gap-3 px-4 py-3 text-[11px] font-mono tracking-[0.3em] uppercase transition-all border ${active ? 'border-white/20 bg-white/5 text-[#4ADE80]' : 'border-transparent text-white/40 hover:bg-white/5 hover:text-white/80'}`}
              >
                <Icon size={14} className={active ? d.color : 'opacity-60'} />
                {d.id}
              </button>
            )
          })}
        </div>

        <div className="mt-auto flex flex-col gap-6">
          <div className="p-5 bg-white/5 rounded-sm border border-white/10">
            <div className="text-[10px] uppercase font-bold text-white/60 mb-2 tracking-widest">Clearance Level</div>
            <div className="text-2xl font-mono text-[#4ADE80] flex items-baseline gap-1">
              {difficulty}<span className="text-xs text-white/40">/ 10</span>
            </div>
          </div>
          
          <div className="p-5 bg-white/5 rounded-sm border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <Activity size={48} />
            </div>
            <div className="text-[10px] uppercase font-bold text-white/60 mb-2 tracking-widest relative z-10">Intelligence Quotient</div>
            <div className="text-2xl font-mono text-[#60A5FA] flex items-baseline gap-2 relative z-10">
              {score}<span className="text-[11px] text-white/40">pts</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 flex flex-col h-screen terminal-scroll overflow-y-auto bg-[#050505]">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/40 gap-6">
            <Loader2 className="animate-spin text-[#4ADE80]" size={32} />
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">Initializing System Dump...</div>
          </div>
        ) : currentPuzzle ? (
          <div className="w-full max-w-4xl flex flex-col gap-8 pb-32">
            
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-6">
              <div>
                <div className="text-[10px] text-[#F87171] font-mono tracking-[0.2em] uppercase mb-4">INCIDENT REPORT #{currentPuzzle.id}</div>
                <h2 className="text-4xl font-serif leading-tight text-white mb-2">{currentPuzzle.title}</h2>
              </div>
            </div>

            {/* Scenario */}
            <div className="text-sm text-white/60 leading-relaxed font-light">
              {currentPuzzle.scenario}
            </div>

            {/* Technical Data */}
            <div className="relative border border-white/10 rounded-sm overflow-hidden bg-[#09090B]">
              <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
              <div className="absolute top-0 right-0 bg-[#0A0A0C] border-b border-l border-white/10 text-white/40 text-[10px] font-mono px-4 py-1.5 uppercase z-10 tracking-[0.2em]">RAW DATA</div>
              <pre className="relative z-10 p-8 pt-12 font-mono text-[12px] text-[#60A5FA] overflow-x-auto terminal-scroll leading-relaxed bg-[#09090B]/80 backdrop-blur-sm">
                {currentPuzzle.technicalData}
              </pre>
            </div>

            {/* Question */}
            <div className="mt-2 pt-6 border-t border-white/5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-3 block">System Objective</span>
              <p className="text-[15px] italic font-serif text-white/80 leading-relaxed">{currentPuzzle.question}</p>
            </div>

            {/* Answer Input */}
            <form onSubmit={submitAnswer} className="mt-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-white/40 font-mono tracking-[0.2em] uppercase mb-2">DEBUGGER_CONSOLE_V4.0</label>
                <div className="flex gap-4 relative bg-[#0A0A0C] border border-white/10 p-2 rounded-sm focus-within:border-white/30 transition-colors">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-mono text-[#4ADE80]">{'>'}</span>
                  <input 
                    type="text" 
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={evaluating || !!evalResult}
                    placeholder="awaiting engineer input..."
                    className="flex-1 bg-transparent pl-10 pr-4 py-3 font-mono text-[13px] focus:outline-none focus:text-[#4ADE80] text-white/90 disabled:opacity-50 placeholder:text-white/30"
                  />
                  <button 
                    type="submit" 
                    disabled={!userAnswer.trim() || evaluating || !!evalResult}
                    className="px-8 py-3 bg-white/5 border border-white/10 hover:border-white/50 hover:bg-white/10 text-white/90 font-mono uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px] group"
                  >
                    {evaluating ? <Loader2 size={14} className="animate-spin text-[#4ADE80]" /> : (
                      <span className="flex items-center gap-3">
                        <div className="w-2 h-2 border border-white/40 group-hover:bg-[#4ADE80] group-hover:border-[#4ADE80] transition-colors"></div>
                        Execute
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Result */}
            {evalResult && (
              <div className={`mt-8 p-8 bg-white/5 rounded-sm border ${evalResult.isCorrect ? 'border-[#4ADE80]/40' : 'border-[#F87171]/40'} animate-in fade-in slide-in-from-bottom-4`}>
                <div className="flex items-start gap-6">
                  {evalResult.isCorrect ? (
                    <CheckCircle className="text-[#4ADE80] shrink-0 mt-0.5" size={20} />
                  ) : (
                    <XCircle className="text-[#F87171] shrink-0 mt-0.5" size={20} />
                  )}
                  <div className="flex-1 flex flex-col gap-5">
                    <h3 className={`font-mono text-[11px] uppercase tracking-[0.3em] font-bold ${evalResult.isCorrect ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                      {evalResult.isCorrect ? '[SUCCESS] ANALYSIS ACCEPTED' : '[ERR] ANALYSIS REJECTED'}
                    </h3>
                    
                    <div className="text-[15px] font-light leading-relaxed text-white/80">
                      {evalResult.feedback}
                    </div>

                    {!evalResult.isCorrect && (
                      <div className="mt-2 pt-5 border-t border-white/5 text-[12px] font-mono">
                        <span className="text-white/40 uppercase tracking-[0.2em] mr-2">Expected Parameter: </span>
                        <span className="text-[#4ADE80] bg-[#4ADE80]/10 px-2 py-1 rounded-sm">{currentPuzzle.correctAnswer}</span>
                      </div>
                    )}
                    
                    <div className="mt-2 pt-5 border-t border-white/5 space-y-3">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 block">Post-Mortem Analysis</span>
                      <div className="text-[13px] italic font-serif text-white/60 leading-relaxed">
                        {currentPuzzle.explanation}
                      </div>
                    </div>

                    <button 
                      onClick={nextPuzzle}
                      className="mt-8 self-start flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 hover:border-white/50 text-[10px] uppercase tracking-[0.3em] transition-all text-white/90 group rounded-sm"
                    >
                      <div className="w-2 h-2 border border-white/40 group-hover:bg-[#60A5FA] group-hover:border-[#60A5FA] transition-colors"></div>
                      Next Scenario <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform opacity-70" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#F87171] font-mono text-sm tracking-widest uppercase">
            [ERR] FAILED TO LOAD SCENARIO.
            <button onClick={() => loadPuzzle(activeDiscipline, difficulty)} className="mt-6 px-6 py-3 border border-white/20 hover:border-white/50 text-white/80 text-[10px] tracking-[0.2em]">RETRY CONNECTION</button>
          </div>
        )}
      </main>
    </div>
  );
}

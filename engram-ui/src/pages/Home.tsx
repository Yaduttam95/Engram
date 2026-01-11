import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Brain, ArrowRight, Sparkles, X, FileText } from 'lucide-react';
import api from '../services/api';

const Home = () => {
  const [input, setInput] = useState("");
  const [title, setTitle] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  
  const [recentMemories, setRecentMemories] = useState<any[]>([]);



  const handleAnalyze = async () => {
    if (!input.trim() && !title.trim()) return;
    setIsProcessing(true);
    
    // Combine title and input if both exist
    const fullInput = title ? `Title: ${title}\n\nContent: ${input}` : input;

    try {
      const data = await api.analysis.analyze(fullInput);

      if (!data.is_clear) {
          setAnalysis(data);
      } else {
          // Auto-save immediately if clear
          await handleAutoSave(data);
      }
    } catch (e: any) {
        console.error(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSave = async (data: any) => {
      try {
        await api.memories.save(data);
        setInput("");
        setTitle("");
        setAnalysis(null);
        
        // Add to recent memories for visual feedback
        setRecentMemories(prev => [{
            id: Date.now(),
            title: data.title,
            category: data.category,
            tags: data.tags
        }, ...prev].slice(0, 3));

      } catch (e: any) {
        console.error(`Save failed: ${e.message}`);
      }
  };

  const handleManualConfirm = async () => {
      if (!analysis) return;
      await handleAutoSave(analysis);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background transition-colors duration-300">
      {/* Dynamic Backgrounds */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '-3s' }} />

      <div className="flex-1 flex flex-col items-center justify-center -mt-16 px-6 z-10 w-full max-w-5xl mx-auto">
        <div className="mb-12 text-center space-y-2 pb-2">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-text-secondary tracking-tight pb-2">Engram Memory</h1>
            <p className="text-text-secondary font-medium">What are you thinking about?</p>
        </div>

        {/* Input Box */}
        <div className={`
            w-full transition-all duration-500 relative group
            ${analysis ? 'opacity-0 pointer-events-none h-0 scale-95' : 'opacity-100 scale-100'}
        `}>
             {/* Glow Effect */}
             <div className="absolute -inset-0.5 bg-gradient-to-r from-accent via-primary to-accent rounded-2xl opacity-20 blur-lg group-hover:opacity-40 transition duration-500"></div>
             
             <div className="relative flex flex-col bg-card rounded-2xl p-2 border border-border shadow-2xl">
                {/* Title Input */}
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Short Title or Context (Optional)"
                    className="w-full bg-transparent text-primary px-6 pt-4 pb-2 outline-none text-lg font-semibold placeholder:text-text-secondary/40 placeholder:font-normal border-b border-border/40"
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            // Focus description
                            const ta = e.currentTarget.nextElementSibling?.nextElementSibling as HTMLTextAreaElement;
                            ta?.focus();
                        }
                    }}
                />

                {/* Description Input */}
                <div className="relative w-full">
                    <textarea 
                        ref={el => {
                            if (el) {
                                el.style.height = 'auto'; 
                                el.style.height = (el.scrollHeight < 120 ? 120 : el.scrollHeight) + 'px';
                            }
                        }}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAnalyze();
                            }
                        }}
                        placeholder="Detailed description, notes, or code..."
                        className="w-full bg-transparent text-primary pl-6 pr-16 py-4 outline-none text-base placeholder:text-text-secondary/50 font-light resize-none min-h-[120px] max-h-[500px]"
                        autoFocus
                        rows={3}
                    />
                    <button 
                        onClick={handleAnalyze}
                        disabled={(!input.trim() && !title.trim()) || isProcessing}
                        className="absolute bottom-3 right-3 p-3 bg-accent hover:bg-accent-hover text-white rounded-xl transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:shadow-none z-10"
                    >
                        {isProcessing ? <Sparkles size={20} className="animate-spin" /> : <ArrowRight size={20} />}
                    </button>
                </div>
             </div>
             
             {/* Recent Memories Feed (Visual Confirmation) */}
             <div className="mt-8 space-y-2">
                 <AnimatePresence>
                    {recentMemories.map((mem) => (
                        <motion.div 
                            key={mem.id}
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-4 text-sm text-text-secondary bg-card/40 border border-border px-4 py-3 rounded-xl mx-auto max-w-lg"
                        >
                            <div className="p-1.5 bg-green-500/10 text-green-500 rounded-full"><Sparkles size={12}/></div>
                            <span className="font-medium text-primary flex-1 truncate">{mem.title}</span>
                            <span className="px-2 py-0.5 bg-secondary/50 rounded text-xs uppercase tracking-wider">{mem.category}</span>
                        </motion.div>
                    ))}
                 </AnimatePresence>
             </div>
        </div>

        {/* Analysis Card (Clarification Only) */}
        <AnimatePresence>
            {analysis && (
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="w-full bg-card rounded-3xl overflow-hidden shadow-2xl relative border-t border-border"
                >
                    <div className="absolute top-0 right-0 p-6 z-20">
                        <button onClick={() => setAnalysis(null)} className="p-2 bg-secondary/50 hover:bg-secondary rounded-full text-text-secondary hover:text-primary transition-colors"><X size={18}/></button>
                    </div>

                    {!analysis.is_clear ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-orange-500/5">
                                <Brain size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-primary mb-3">Clarification Needed</h3>
                            <p className="text-text-secondary text-xl leading-relaxed max-w-lg mb-10">"{analysis.clarifying_question}"</p>
                            
                            <div className="w-full max-w-lg mx-auto">
                                <div className="flex gap-2">
                                    <input 
                                        autoFocus
                                        className="flex-1 bg-secondary/30 border border-border rounded-xl px-4 py-3 text-primary outline-none focus:border-accent/50 transition-all placeholder:text-text-secondary/50"
                                        placeholder="Type your answer..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = (e.target as HTMLInputElement).value;
                                                if (val.trim()) {
                                                    setInput(input + ` (${val})`); 
                                                    setAnalysis(null); 
                                                    handleAnalyze();
                                                }
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={(e) => {
                                            const inputEl = e.currentTarget.previousElementSibling as HTMLInputElement;
                                            if (inputEl.value.trim()) {
                                                setInput(input + ` (${inputEl.value})`); 
                                                setAnalysis(null); 
                                                handleAnalyze();
                                            }
                                        }}
                                        className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>
                                <p className="text-xs text-text-secondary mt-3 opacity-60">
                                    Only work-related contexts are supported.
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Fallback Preview (Should rarely be seen now, but kept for logic safety)
                        <div className="p-10">
                             <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-accent/10 text-accent rounded-2xl ring-1 ring-inset ring-accent/10">
                                    <FileText size={28} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-secondary/50 rounded-lg text-xs font-mono text-text-secondary border border-border tracking-wider uppercase">{analysis.category}</span>
                                        {analysis.tags?.map((t: string) => <span key={t} className="text-xs font-mono text-accent opacity-80">#{t}</span>)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-primary leading-tight">{analysis.title}</h3>
                                </div>
                             </div>
                             
                             <div className="bg-secondary/10 p-8 rounded-2xl text-text-secondary prose prose-invert prose-p:text-text-secondary prose-headings:text-primary prose-strong:text-primary prose-lg max-w-none mb-8 border border-border">
                                <ReactMarkdown>{analysis.summary}</ReactMarkdown>
                             </div>

                             <button 
                                onClick={handleManualConfirm}
                                className="w-full py-5 bg-accent text-white text-lg font-semibold rounded-2xl hover:bg-accent-hover transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-1"
                            >
                                <Sparkles size={20} /> Add to Memory
                             </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
      </div>


    </div>
  );
};

export default Home;

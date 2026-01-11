import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Brain, AlertCircle, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const Recall = () => {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!query.trim()) return;
        
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const data = await api.analysis.ask(query);
            setResult(data);
        } catch (e: any) {
            setError("Unable to retrieve information. Cortex may be offline.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center h-full relative overflow-y-auto bg-background p-8">
            <div className="w-full max-w-3xl flex flex-col pt-12">
                
                {/* Header - Professional & Minimal */}
                <div className={`transition-all duration-300 ${result ? 'mb-6' : 'mb-12 mt-12 text-center'}`}>
                    <h1 className="text-3xl font-semibold text-primary mb-3 flex items-center gap-3 justify-center">
                        <Brain size={28} className="text-accent" /> 
                        <span>Recall Knowledge</span>
                    </h1>
                    {!result && <p className="text-text-secondary max-w-md mx-auto">Query your second brain for specific details, summaries, or insights.</p>}
                </div>

                {/* Professional Search Bar */}
                <div className="w-full relative group mb-8">
                    <div className="relative flex items-center bg-card border border-border rounded-lg shadow-sm focus-within:shadow-md focus-within:border-accent transition-all duration-200">
                        <Search className="ml-4 text-text-secondary" size={20} />
                        <input 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Ask a question..."
                            className="w-full bg-transparent text-primary px-4 py-3 outline-none text-base placeholder:text-text-secondary/60"
                            autoFocus
                        />
                        <button 
                            onClick={handleSearch}
                            disabled={!query.trim() || loading}
                            className="mr-2 p-2 text-accent hover:bg-accent/10 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"/> : <ArrowRight size={20} />}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-sm">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* Results Section */}
                <AnimatePresence>
                    {result && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"
                        >
                            {/* Answer Area */}
                            <div className="p-8">
                                <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-7">
                                    <ReactMarkdown>{result.answer}</ReactMarkdown>
                                </div>
                            </div>

                            {/* References / Citations */}
                            <div className="bg-secondary/30 border-t border-border p-6">
                                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <BookOpen size={14} /> References
                                </h3>
                                <div className="space-y-3">
                                    {result.sources.map((source: any, i: number) => (
                                        <div key={i} className="flex gap-3 text-sm group">
                                            <span className="text-text-secondary font-mono text-xs mt-1 shrink-0">[{i + 1}]</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                     <span className="font-medium text-primary hover:text-accent transition-colors cursor-pointer">
                                                        {source.title || source.filename}
                                                     </span>
                                                     <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary border border-border text-text-secondary uppercase">
                                                        {source.category || 'Note'}
                                                     </span>
                                                </div>
                                                <p className="text-text-secondary/80 text-xs line-clamp-1 italic">
                                                    "{source.snippet?.substring(0, 120)}..."
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Recall;

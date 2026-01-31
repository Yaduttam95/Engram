import { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, Brain, Sparkles, Check, RefreshCw } from 'lucide-react';
import { API_URL } from '../constants';


const Settings = () => {
    const [config, setConfig] = useState<any>({ vault_path: "", chat_model: "", available_models: [] });
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    


    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/config`);
            setConfig(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (key: string, value: string) => {
        setConfig((prev: any) => ({ ...prev, [key]: value }));
        
        try {
            await axios.post(`${API_URL}/config`, { [key]: value });
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (e) {
            console.error(e);
            fetchConfig(); // Revert on error
        }
    };

    const [notification, setNotification] = useState<{type: 'confirm'|'confirm_reset'|'success'|'error', msg: string} | null>(null);

    const startReindex = async () => {
        setNotification(null);
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/reindex`);
            setNotification({ type: 'success', msg: `Re-index complete! processed ${res.data.updated} memories.` });
            setTimeout(() => setNotification(null), 5000);
        } catch(e) {
            setNotification({ type: 'error', msg: "Re-index failed." });
        } finally {
            setLoading(false);
        }
    };

    const resetBrain = async () => {
        setNotification(null);
        setLoading(true);
        try {
            await axios.post(`${API_URL}/reset`);
            setNotification({ type: 'success', msg: "Brain completely wiped. Fresh start!" });
            setTimeout(() => setNotification(null), 5000);
        } catch(e) {
            setNotification({ type: 'error', msg: "Failed to wipe brain." });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center text-gray-500 flex-col gap-4">
        <RefreshCw className="animate-spin text-indigo-500" size={32} />
        <p>Processing Vault...</p>
    </div>;

    return (
        <div className="flex-1 overflow-y-auto p-12 bg-background relative transition-colors duration-300">
            
            {notification && (
                <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    {notification.type === 'confirm' && (
                         <div className="bg-card border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm">
                            <h3 className="text-lg font-bold text-primary mb-2">Re-index Brain?</h3>
                            <p className="text-text-secondary text-sm mb-4">This will rescan all files in your vault and update embeddings. This may take a while.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setNotification(null)} className="px-4 py-2 text-text-secondary hover:text-primary transition-colors">Cancel</button>
                                <button onClick={startReindex} className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium">Confirm</button>
                            </div>
                         </div>
                    )}
                    {notification.type === 'confirm_reset' && (
                         <div className="bg-card border-red-500 border p-6 rounded-2xl shadow-2xl max-w-sm">
                            <h3 className="text-lg font-bold text-red-500 mb-2">Wipe Everything?</h3>
                            <p className="text-text-secondary text-sm mb-4">This will DELETE ALL MEMORIES and embeddings permanently. There is no undo.</p>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setNotification(null)} className="px-4 py-2 text-text-secondary hover:text-primary transition-colors">Cancel</button>
                                <button onClick={resetBrain} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">Nuke It</button>
                            </div>
                         </div>
                    )}
                    {notification.type === 'success' && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl shadow-xl flex items-center gap-3 text-emerald-400">
                            <Check size={20} /> {notification.msg}
                        </div>
                    )}
                    {notification.type === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl shadow-xl text-red-400">
                            {notification.msg}
                        </div>
                    )}
                </div>
            )}

            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-4xl font-bold text-primary">Settings</h1>
                    {isSaved && <span className="text-emerald-400 flex items-center gap-2 text-sm font-bold animate-pulse"><Check size={16}/> Saved</span>}
                </div>
                <p className="text-text-secondary mb-10">Configure your clean, private second brain.</p>

                <div className="space-y-6">


                    {/* Vault Section */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl"><Folder size={24}/></div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Vault Location</h3>
                                <p className="text-sm text-text-secondary">Where your memories are physically stored.</p>
                            </div>
                        </div>
                        <div className="relative">
                            <input 
                                value={config.vault_path}
                                onChange={(e) => handleUpdate('vault_path', e.target.value)}
                                className="w-full bg-secondary text-primary p-4 rounded-xl outline-none border border-white/5 focus:border-accent/50 transition-colors font-mono text-sm"
                            />
                        </div>
                    </div>

                    {/* AI Model Section */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Brain size={24}/></div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Cortex Model</h3>
                                <p className="text-sm text-text-secondary">The local LLM powering your insights.</p>
                            </div>
                        </div>
                        <select 
                            value={config.chat_model}
                            onChange={(e) => handleUpdate('chat_model', e.target.value)}
                            className="w-full bg-secondary text-primary p-4 rounded-xl outline-none border border-white/5 focus:border-accent/50 transition-colors appearance-none cursor-pointer"
                        >
                            {config.available_models?.map((model: string) => (
                                <option key={model} value={model}>{model}</option>
                            ))}
                            <option value="custom">Custom (Edit Config)</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="text-lg font-semibold text-primary mb-4">Danger Zone</h3>
                         <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setNotification({ type: 'confirm', msg: '' })}
                                className="w-full py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <Sparkles size={18} /> Re-index All
                            </button>
                            <button 
                                onClick={() => setNotification({ type: 'confirm_reset', msg: '' })}
                                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <RefreshCw size={18} /> Wipe Brain
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;

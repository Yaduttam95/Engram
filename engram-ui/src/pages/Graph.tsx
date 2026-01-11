import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Sparkles, Network, X, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

const Graph = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const fgRef = useRef<any>(null);

    const fetchGraph = async () => {
        try {
            const data = await api.graph.get();
            setGraphData(data);
        } catch (e) {
            console.error("Failed to load graph", e);
        }
    };

    useEffect(() => {
        fetchGraph();
    }, []);

    useEffect(() => {
        if (!containerRef) return;
        const resizeObserver = new ResizeObserver(() => {
            setDimensions({
                width: containerRef.clientWidth,
                height: containerRef.clientHeight
            });
        });
        resizeObserver.observe(containerRef);
        return () => resizeObserver.disconnect();
    }, [containerRef]);

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(4, 2000);
    };

    const [notification, setNotification] = useState<{type: 'confirm'|'success'|'error', msg: string} | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        setIsEditing(false);
        setEditContent("");
    }, [selectedNode]);

    const handleDelete = async () => {
        if (!selectedNode) return;
        try {
            await api.memories.delete(selectedNode.id);
            setNotification({ type: 'success', msg: "Memory deleted." });
            setSelectedNode(null);
            fetchGraph();
            setTimeout(() => setNotification(null), 3000);
        } catch(e) {
            setNotification({ type: 'error', msg: "Failed to delete" });
        }
    };

    const handleSave = async () => {
        if (!selectedNode) return;
        try {
            await api.memories.update(selectedNode.id, editContent);
            setSelectedNode({ ...selectedNode, summary: editContent });
            setNotification({ type: 'success', msg: "Saved." });
            setIsEditing(false);
            setTimeout(() => setNotification(null), 3000);
            fetchGraph();
        } catch(e) {
            setNotification({ type: 'error', msg: "Save failed" });
        }
    };

    return (
        <div ref={setContainerRef} className="flex-1 bg-background relative overflow-hidden h-full font-sans">
             
             {/* Simple Header */}
             <div className="absolute top-6 left-6 z-10 p-4 rounded-lg bg-card border border-border shadow-sm flex items-center gap-4">
                <h2 className="text-lg font-semibold text-primary">Cortex Graph</h2>
                <div className="text-xs font-mono text-text-secondary flex items-center gap-2">
                    <span>{graphData.nodes.length} N</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>{graphData.links.length} L</span>
                    <button onClick={fetchGraph} className="hover:text-accent transition-colors ml-1"><Sparkles size={12}/></button>
                </div>
            </div>

            {/* Notifications */}
             <AnimatePresence>
                 {notification && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-6 left-6 z-50"
                    >
                        {notification.type === 'confirm' ? (
                             <div className="bg-card border border-border p-4 rounded-lg shadow-xl w-72">
                                <h3 className="text-sm font-semibold text-primary mb-1">Delete this memory?</h3>
                                <p className="text-text-secondary text-xs mb-3">This cannot be undone.</p>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setNotification(null)} className="px-3 py-1.5 text-xs text-text-secondary hover:bg-secondary rounded-md">Cancel</button>
                                    <button onClick={handleDelete} className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-md">Delete</button>
                                </div>
                             </div>
                        ) : (
                            <div className={`px-4 py-2 rounded-md shadow-lg border text-sm font-medium flex items-center gap-2 ${notification.type === 'success' ? 'bg-card border-green-500/20 text-green-500' : 'bg-card border-red-500/20 text-red-500'}`}>
                                 {notification.type === 'success' ? <Sparkles size={14}/> : <X size={14}/>}
                                 {notification.msg}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            {graphData.nodes.length > 0 ? (
                <ForceGraph2D
                    ref={fgRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    graphData={graphData}
                    nodeColor={(node: any) => node.color || "#334155"} // Slate-700 default
                    nodeLabel="name"
                    backgroundColor="#ffffff" // Explicit white background
                    linkColor={() => "rgba(100, 116, 139, 0.3)"} // Slightly darker slate
                    linkWidth={1}
                    nodeRelSize={4}
                    onNodeClick={handleNodeClick}
                    enableNodeDrag={false}
                    nodePointerAreaPaint={(node: any, color, ctx) => {
                        const r = 4;
                        ctx.fillStyle = color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
                        ctx.fill();
                    }}
                    nodeCanvasObject={(node: any, ctx, globalScale) => {
                        const r = 4;
                        const fontSize = 4; 
                        
                        // Node Circle
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                        ctx.fillStyle = node.color || '#334155';
                        ctx.fill();
                        
                        // Selection Ring
                        if (node === selectedNode) {
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, r + 2, 0, 2 * Math.PI, false);
                            ctx.strokeStyle = node.color;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }

                        // Label
                        if (globalScale > 1.5 || node === selectedNode) {
                            ctx.font = `${fontSize}px Inter, sans-serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#475569'; // Slate 600 (Darker for light theme)
                            ctx.fillText(node.name, node.x, node.y + r + fontSize);
                        }
                    }} 
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-text-secondary">
                    <div className="flex items-center gap-2">
                         <Network size={20} className="animate-pulse opacity-50" />
                         <span className="text-sm">Loading Cortex...</span>
                    </div>
                </div>
            )}

            {/* Side Panel - Clean Professional */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute top-0 right-0 bottom-0 w-[450px] bg-card border-l border-border shadow-2xl z-20 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold text-primary leading-tight">{selectedNode.name}</h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span style={{ backgroundColor: selectedNode.color }} className="w-2 h-2 rounded-full"/>
                                    <span className="text-xs text-text-secondary uppercase tracking-wide">{selectedNode.group}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="text-text-secondary hover:text-primary transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Properties */}
                            <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                                <div>
                                    <span className="block text-text-secondary text-xs mb-1">Created</span>
                                    <span className="text-primary font-mono text-xs">{selectedNode.created}</span>
                                </div>
                                <div>
                                    <span className="block text-text-secondary text-xs mb-1">Tags</span>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedNode.tags && String(selectedNode.tags).replace(/[\[\]']/g, '').split(',').map((tag:string) => {
                                            const t = tag.trim();
                                            if(!t) return null;
                                            return <span key={t} className="px-1.5 py-0.5 bg-secondary text-text-secondary rounded text-[10px]">{t}</span>
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Body */}
                            {isEditing ? (
                                <textarea 
                                    className="w-full h-96 bg-secondary p-4 rounded-md border border-border focus:border-accent text-sm font-mono resize-none outline-none text-slate-800"
                                    value={editContent}
                                    onChange={e => setEditContent(e.target.value)}
                                    autoFocus
                                />
                            ) : (
                                <div className="prose prose-sm prose-slate max-w-none text-slate-800 prose-ul:list-disc prose-ol:list-decimal prose-ul:ml-4 prose-ol:ml-4 prose-task-list:list-none prose-checkbox:cursor-pointer">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNode.summary}</ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border bg-secondary/10 flex justify-between items-center">
                            {isEditing ? (
                                <div className="flex gap-2 w-full justify-end">
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-primary">Cancel</button>
                                    <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-md flex items-center gap-2 hover:bg-primary-hover">
                                        <Save size={12}/> Save
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2 w-full justify-end">
                                    <button onClick={() => setNotification({ type: 'confirm', msg: '' })} className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors">
                                        Delete
                                    </button>
                                    <button onClick={() => { setEditContent(selectedNode.summary); setIsEditing(true); }} className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-border text-primary rounded-md transition-colors flex items-center gap-2">
                                        <Edit2 size={12}/> Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Graph;

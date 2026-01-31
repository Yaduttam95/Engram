import { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { X, Edit2, Save, Trash2, Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';

const Graph = () => {
    // 1. Core State
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    
    
    // Sidebar Edit State
    // const [isEditing, setIsEditing] = useState(false); // Removed
    // const [editContent, setEditContent] = useState(""); // Removed
    const [notification, setNotification] = useState<{type: 'success'|'error', msg: string} | null>(null);

    // 2. Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<any>(null);

    // 3. Init: Fetch & Resize
    useEffect(() => {
        fetchGraph();
    }, []);

    // Observer for the layout change (when sidebars open/close)
    useEffect(() => {
        if (!graphContainerRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            if (graphContainerRef.current) {
                setDimensions({
                    width: graphContainerRef.current.clientWidth,
                    height: graphContainerRef.current.clientHeight
                });
            }
        });
        resizeObserver.observe(graphContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [graphContainerRef]);

    const fetchGraph = async () => {
        try {
            const data = await api.graph.get();
            setGraphData(data);
        } catch (e) { console.error(e); }
    };

    // 4. Interaction Handlers
    const handleNodeSelect = (node: any) => {
        setSelectedNode(node);
        // setIsEditing(false); // Removed
        
        // Center Graph on Node
        fgRef.current?.centerAt(node.x, node.y, 1000);
        fgRef.current?.zoom(4, 2000);
    };



    const handleDelete = async () => {
        if (!selectedNode) return;
        if (!confirm("Are you sure you want to delete this memory?")) return;
        try {
            await api.memories.delete(selectedNode.id);
            setSelectedNode(null);
            fetchGraph(); // Reload graph
            setNotification({ type: 'success', msg: "Memory deleted." });
            setTimeout(() => setNotification(null), 3000);
        } catch(e) {
            setNotification({ type: 'error', msg: "Delete failed." });
        }
    };

    // Filter nodes for the list
    const filteredNodes = graphData.nodes.filter((n: any) => 
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (n.group && n.group.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            
            {/* LEFT SIDEBAR: LIST */}
            <div className="w-[300px] border-r border-border bg-card flex flex-col z-20 flex-shrink-0">
                <div className="p-4 border-b border-border bg-secondary/10">
                    <h2 className="font-semibold text-primary mb-3 flex items-center gap-2">
                        <FileText size={18}/> Memories
                    </h2>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-2.5 text-text-secondary"/>
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter memories..."
                            className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredNodes.length === 0 ? (
                        <div className="text-center p-8 text-text-secondary text-sm">No memories found.</div>
                    ) : (
                        <div className="space-y-1">
                            {filteredNodes.map((node: any) => (
                                <button 
                                    key={node.id}
                                    onClick={() => handleNodeSelect(node)}
                                    className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-all ${
                                        selectedNode?.id === node.id 
                                        ? 'bg-accent/10 border border-accent/20' 
                                        : 'hover:bg-secondary/50 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span className={`font-medium truncate text-sm ${selectedNode?.id === node.id ? 'text-accent' : 'text-primary'}`}>{node.name}</span>
                                        {selectedNode?.id === node.id && <div className="w-1.5 h-1.5 rounded-full bg-accent"/>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider bg-secondary px-1.5 py-0.5 rounded">{node.group}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-3 border-t border-border text-xs text-text-secondary text-center">
                    {graphData.nodes.length} total nodes
                </div>
            </div>

            {/* CENTER: GRAPH CANVAS */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col" ref={graphContainerRef}>
                {/* Stats Overlay */}
                <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-xs font-mono text-slate-500">
                    {graphData.links.length} connections
                </div>

                 {/* Notifications */}
                 <AnimatePresence>
                    {notification && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`absolute top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg border bg-white ${
                                notification.type === 'success' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                            }`}
                        >
                            {notification.msg}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Force Graph */}
                <div className="flex-1 w-full h-full cursor-crosshair">
                   <ForceGraph2D
                        ref={fgRef}
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={graphData}
                        
                        backgroundColor="#f8fafc" // Slate-50 main bg
                        nodeLabel="name"
                        nodeColor={(node: any) => node.color || "#64748b"}
                        linkColor={() => "#cbd5e1"}
                        
                        // Increase interaction sizes
                        nodeRelSize={6}
                        linkWidth={1.5}
                        
                        // CONNECT GRAPH CLICKS TO LIST SELECTION
                        onNodeClick={handleNodeSelect}
                        
                        // Always show text
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.name;
                            const fontSize = 12/globalScale;
                            const r = 6; 

                            // Node
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI, false);
                            ctx.fillStyle = node.color || "#64748b";
                            ctx.fill();

                            // Selection Halo
                            if (node.id === selectedNode?.id) {
                                ctx.beginPath();
                                ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI, false);
                                ctx.strokeStyle = node.color || "#2563eb";
                                ctx.lineWidth = 2;
                                ctx.stroke();
                            }

                            // Text
                            ctx.font = `${fontSize}px Sans-Serif`;
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#1e293b'; // Slate-800
                            ctx.fillText(label, node.x, node.y + r + fontSize); 
                        }}
                    />
                </div>
            </div>

            {/* RIGHT SIDEBAR: DETAILS (Collapsible) */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 600, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-l border-border bg-card z-20 flex flex-col overflow-hidden shadow-xl"
                    >
                        {/* Detail Header */}
                        <div className="p-5 border-b border-border flex justify-between items-start bg-secondary/5 min-w-[600px]">
                            <div>
                                <h3 className="text-xl font-bold text-primary leading-tight pr-4 break-words w-[500px]">{selectedNode.name}</h3>
                                <div className="flex items-center gap-2 mt-2">
                                     <span className="w-2 h-2 rounded-full" style={{ background: selectedNode.color }}/>
                                     <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{selectedNode.group}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNode(null)} className="text-text-secondary hover:text-primary p-1 hover:bg-secondary rounded">
                                <X size={20}/>
                            </button>
                        </div>

                        {/* Detail Body */}
                        <div className="flex-1 overflow-y-auto p-6 min-w-[600px]">
                            {/* Tags */}
                             {selectedNode.tags && (
                                <div className="flex flex-wrap gap-1.5 mb-6">
                                     {String(selectedNode.tags).replace(/[\[\]']/g, '').split(',').filter(t=>t.trim()).map(t => (
                                         <span key={t} className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 rounded border border-accent/20">#{t.trim()}</span>
                                     ))}
                                </div>
                             )}

                            <div className="prose prose-sm prose-slate max-w-none text-text-secondary">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedNode.summary}</ReactMarkdown>
                            </div>
                        </div>

                        {/* Detail Footer */}
                        <div className="p-4 border-t border-border bg-secondary/5 min-w-[600px] flex justify-between items-center">
                            <div className="flex gap-3 w-full">
                                <button onClick={handleDelete} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                                    <Trash2 size={16}/> Delete
                                </button>
                                <div className="flex-1"/>
                                {/* Edit functionality removed as per design decision */}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Graph;

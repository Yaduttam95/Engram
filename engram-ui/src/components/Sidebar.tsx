import { LayoutGrid, Network, Settings, Brain, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (t: string) => void;
}

const Sidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const tabs = [
    { id: 'home', icon: LayoutGrid, label: 'Home' },
    { id: 'recall', icon: Search, label: 'Recall' },
    { id: 'graph', icon: Network, label: 'Graph' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-[80px] h-full flex flex-col items-center py-6 border-r border-border bg-card/40 backdrop-blur-xl z-50 shrink-0">
      <div className="mb-8 p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-primary/20">
        <Brain size={24} className="text-white" />
      </div>

      <div className="flex flex-col gap-4 w-full items-center flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3 rounded-xl transition-all relative group flex justify-center items-center
                ${activeTab === tab.id 
                    ? 'text-primary bg-accent/10 shadow-inner' 
                    : 'text-text-secondary hover:text-primary hover:bg-secondary/50'}
            `}
          >
            <tab.icon size={24} strokeWidth={2} />
            {/* Tooltip */}
            <span className="absolute left-16 bg-card text-primary text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-border z-50 shadow-xl">
                {tab.label}
            </span>
            {activeTab === tab.id && (
                <motion.div layoutId="active-indicator" className="absolute left-0 top-2 bottom-2 w-1 bg-accent rounded-r-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;

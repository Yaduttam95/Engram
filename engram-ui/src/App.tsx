import { useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Graph from './pages/Graph';
import Recall from './pages/Recall';
import Settings from './pages/Settings';


function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch(activeTab) {
      case 'home': return <Home />;
      case 'graph': return <Graph />;
      case 'recall': return <Recall />;
      case 'settings': return <Settings />;
      default: return <Home />;
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans overflow-hidden transition-colors duration-300">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 relative overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

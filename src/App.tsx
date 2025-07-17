import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PatientQueue } from './components/PatientQueue/PatientQueue';
import { Resources } from './components/Resources/Resources';
import { RiskAssessmentComponent } from './components/RiskAssessment/RiskAssessment';
import { Rooms } from './components/Rooms/Rooms';
import { Inventory } from './components/Inventory/Inventory';
import { Costs } from './components/Costs/Costs';
import { History } from './components/History/History';
import { AIAssistant } from './components/AIAssistant/AIAssistant';
import { Button } from './components/UI/Button';
import { Bot } from 'lucide-react';
import { AuthPage } from './components/AuthPage';
import { Recommendationspanel } from './components/Recommendationspanel';
// Placeholder import for PatientDashboard
import { PatientDashboard } from './components/PatientDashboard/PatientDashboard';
import { InventoryItem } from './types';

export const AuthContext = createContext<{ token: string | null; username: string | null; logout: () => void }>({ token: null, username: null, logout: () => {} });

function AdminApp({ token, username, logout, setToken, setUsername }: any) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  // Shared state for recommendations, persisted in localStorage
  const [recommendationsPredictions, setRecommendationsPredictions] = useState<any[]>(
    () => JSON.parse(localStorage.getItem('recommendationsPredictions') || '[]')
  );
  const [recommendationsOrders, setRecommendationsOrders] = useState<any[]>(
    () => JSON.parse(localStorage.getItem('recommendationsOrders') || '[]')
  );
  const [recommendationsInventory, setRecommendationsInventory] = useState<InventoryItem[]>(
    () => JSON.parse(localStorage.getItem('recommendationsInventory') || '[]')
  );

  useEffect(() => {
    localStorage.setItem('recommendationsPredictions', JSON.stringify(recommendationsPredictions));
  }, [recommendationsPredictions]);

  useEffect(() => {
    localStorage.setItem('recommendationsOrders', JSON.stringify(recommendationsOrders));
  }, [recommendationsOrders]);

  useEffect(() => {
    localStorage.setItem('recommendationsInventory', JSON.stringify(recommendationsInventory));
  }, [recommendationsInventory]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onTabChange={setActiveTab} />;
      case 'patients':
        return <PatientQueue />;
      case 'resources':
        return <Resources />;
      case 'risk':
        return <RiskAssessmentComponent />;
      case 'rooms':
        return <Rooms />;
      case 'inventory':
        return <Inventory 
          onPredictions={setRecommendationsPredictions}
          onOrders={setRecommendationsOrders}
          onInventory={setRecommendationsInventory}
        />;
      case 'costs':
        return <Costs />;
      case 'history':
        return <History />;
      case 'Recommendationspanel':
        return <Recommendationspanel 
          predictions={recommendationsPredictions} 
          orders={recommendationsOrders} 
          inventory={recommendationsInventory} 
        />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={logout} username={username} />
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
      {/* Floating AI Assistant Button */}
      {!isAIAssistantOpen && (
        <Button
          variant="primary"
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow z-40"
          onClick={() => setIsAIAssistantOpen(true)}
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}
      {/* AI Assistant */}
      <AIAssistant 
        isOpen={isAIAssistantOpen} 
        onClose={() => setIsAIAssistantOpen(false)} 
      />
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access'));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'));

  useEffect(() => {
    if (token) localStorage.setItem('access', token);
    else localStorage.removeItem('access');
    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [token, username]);

  const handleAuthSuccess = (tok: string, user: string) => {
    setToken(tok);
    setUsername(user);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  };

  return (
    <AuthContext.Provider value={{ token, username, logout }}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              token ? (
                <AdminApp token={token} username={username} logout={logout} setToken={setToken} setUsername={setUsername} />
              ) : (
                <AuthPage onAuthSuccess={handleAuthSuccess} />
              )
            }
          />
          <Route
            path="/patient-dashboard"
            element={
              token ? (
                <PatientDashboard />
              ) : (
                <AuthPage onAuthSuccess={handleAuthSuccess} />
              )
            }
          />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
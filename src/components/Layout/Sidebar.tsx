import React from 'react';
import { LayoutDashboard, Users, Package, AlertTriangle, Home, Indent as Inventory, DollarSign, History, Bot, User, Settings, LogOut, Heart, icons, InboxIcon } from 'lucide-react';
import { Recommendationspanel } from '../Recommendationspanel';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  username: string | null;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patient Queue', icon: Users },
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
  { id: 'rooms', label: 'Rooms', icon: Home },
  { id: 'inventory', label: 'Inventory', icon: Inventory },
  { id: 'costs', label: 'Costs', icon: DollarSign },
  { id: 'history', label: 'History', icon: History },
  { id: 'Recommendationspanel', label: 'Recommendations', icon: InboxIcon},
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout, username }) => {
  return (
    <div className="bg-white border-r border-gray-200 w-64 h-screen flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-2 rounded-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Mama AI</h1>
            <p className="text-sm text-gray-500">Health Guardian</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200">
        {/* System Status */}
        <div className="mb-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">System Online</span>
          </div>
        </div>

        {/* AI Assistant Button */}
        <button className="w-full mb-4 flex items-center space-x-3 px-3 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-colors">
          <Bot className="w-5 h-5" />
          <span className="font-medium">AI Assistant</span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{username || 'User'}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600" onClick={onLogout}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
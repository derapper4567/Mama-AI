import React, { useState } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { 
  Bot, 
  Send, 
  X,
  MessageCircle,
  Lightbulb,
  AlertTriangle,
  Heart
} from 'lucide-react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI Health Guardian assistant. I can help you with patient care recommendations, risk assessments, resource allocation, and answer questions about maternal health. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    {
      id: '1',
      text: 'Analyze current high-risk patients',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      id: '2',
      text: 'Suggest resource optimization',
      icon: <Lightbulb className="w-4 h-4" />
    },
    {
      id: '3',
      text: 'Review today\'s schedule',
      icon: <Heart className="w-4 h-4" />
    }
  ];

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/chatbot/`, { message: content.trim() });
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: 'Sorry, I could not reach the server. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('high-risk') || input.includes('risk')) {
      return 'Based on current patient data, I\'ve identified 2 high-risk patients requiring immediate attention:\n\n• Sarah Johnson (Risk Score: 85) - Gestational diabetes + high BP\n• Jessica Williams (Risk Score: 78) - Preeclampsia symptoms\n\nRecommendations:\n1. Schedule immediate consultations\n2. Increase monitoring frequency\n3. Prepare delivery rooms if needed\n\nWould you like me to create alerts for the medical team?';
    }
    
    if (input.includes('resource') || input.includes('optimization')) {
      return 'Resource Analysis Summary:\n\n🔴 Critical: Fetal monitors (2/8 available)\n🟡 Low: Delivery beds (3/5 available)\n🟢 Adequate: Nursing staff (12/15 available)\n\nOptimization suggestions:\n1. Redistribute monitors from consultation rooms\n2. Schedule equipment maintenance during low-demand hours\n3. Consider temporary staff reallocation\n\nShall I generate a detailed resource reallocation plan?';
    }
    
    if (input.includes('schedule') || input.includes('appointment')) {
      return 'Today\'s Schedule Overview:\n\n• 4 scheduled appointments\n• 2 patients currently in progress\n• 1 emergency case pending\n• Next available slot: 3:30 PM\n\nPriority recommendations:\n1. Prioritize high-risk patients\n2. Allow buffer time for complications\n3. Prepare backup rooms for emergencies\n\nWould you like me to suggest schedule optimizations?';
    }
    
    if (input.includes('help') || input.includes('what can you do')) {
      return 'I can assist you with:\n\n📊 **Patient Care**\n• Risk assessment analysis\n• Treatment recommendations\n• Patient monitoring alerts\n\n🏥 **Resource Management**\n• Equipment allocation\n• Staff scheduling\n• Room assignments\n\n📈 **Analytics**\n• Cost analysis\n• Performance metrics\n• Trend predictions\n\n🚨 **Emergency Support**\n• Critical alerts\n• Emergency protocols\n• Rapid response coordination\n\nWhat specific area would you like help with?';
    }
    
    return 'I understand you\'re asking about "' + userInput + '". Let me provide you with relevant information and recommendations based on current patient data and best practices in maternal health care. Could you provide more specific details about what you\'d like to know?';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-25" onClick={onClose} />
      <div className="absolute right-4 top-4 bottom-4 w-96 bg-white rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Health Guardian</h3>
                <p className="text-sm text-purple-100">Online • Ready to help</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions:</p>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleSendMessage(action.text)}
                  className="w-full flex items-center space-x-2 p-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {action.icon}
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything about patient care..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              disabled={isTyping}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
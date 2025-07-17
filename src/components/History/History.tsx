import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { 
  History as HistoryIcon, 
  Calendar, 
  User, 
  Activity,
  Search,
  Filter,
  Download,
  Clock,
  ArrowRight
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Unified event type for history
interface HistoryEvent {
  id: string;
  type: 'patient_added' | 'risk_assessment';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  metadata?: any;
}

export const History: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('30');
  const [historyItems, setHistoryItems] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/patients/`),
      axios.get(`${API_BASE_URL}/risk-assessment-history/`)
    ])
      .then(([patientsRes, riskRes]) => {
        const patients = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        const riskAssessments = Array.isArray(riskRes.data) ? riskRes.data : [];
        // Map patients to history events
        const patientEvents: HistoryEvent[] = patients.map((p: any) => ({
          id: `patient_${p.id}`,
          type: 'patient_added',
          title: 'New Patient Added',
          description: `${p.name} was added to the system`,
          user: p.created_by || 'System',
          timestamp: p.created_at || p.appointmentTime || p.appointment || new Date().toISOString(),
          metadata: { patientId: p.id, riskLevel: p.riskLevel || p.risk_level }
        }));
        // Map risk assessments to history events
        const riskEvents: HistoryEvent[] = riskAssessments.map((r: any) => ({
          id: `risk_${r.id}`,
          type: 'risk_assessment',
          title: 'Risk Assessment Completed',
          description: `${r.patient_name || r.patient} risk assessment completed`,
          user: r.user || 'System',
          timestamp: r.timestamp,
          metadata: { patientId: r.patient, riskScore: r.risk_score }
        }));
        // Merge and sort by timestamp desc
        const allEvents = [...patientEvents, ...riskEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setHistoryItems(allEvents);
      })
      .catch(() => setHistoryItems([]))
      .finally(() => setLoading(false));
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'patient_added': return <User className="w-4 h-4" />;
      case 'risk_assessment': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'patient_added': return 'blue';
      case 'risk_assessment': return 'red';
      default: return 'gray';
    }
  };

  // Date filter logic
  const filterByDate = (item: HistoryEvent) => {
    if (!filterDate || filterDate === 'all') return true;
    const days = parseInt(filterDate, 10);
    if (!days) return true;
    const now = new Date();
    const itemDate = new Date(item.timestamp);
    const diff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  };

  const filteredHistory = historyItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user && item.user.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType && filterByDate(item);
  });

  const groupedHistory = filteredHistory.reduce((groups, item) => {
    const date = new Date(item.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryEvent[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity History</h1>
          <p className="text-gray-600 mt-1">View system activity and patient care history</p>
        </div>
        <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
          Export History
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{historyItems.length}</p>
            </div>
            <HistoryIcon className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Activities</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {historyItems.filter(h => 
                  new Date(h.timestamp).toDateString() === new Date().toDateString()
                ).length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Risk Assessments</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {historyItems.filter(h => h.type === 'risk_assessment').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patient Activities</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {historyItems.filter(h => 
                  h.type === 'patient_added'
                ).length}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Activities</option>
                <option value="patient_added">Patient Added</option>
                <option value="risk_assessment">Risk Assessment</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* History Timeline */}
      <div className="space-y-6">
        {loading ? (
          <Card className="text-center py-12">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading activities...</h3>
            <p className="text-gray-500">Please wait while we fetch the latest activity history.</p>
          </Card>
        ) : Object.keys(groupedHistory).length === 0 ? (
          <Card className="text-center py-12">
            <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </Card>
        ) : (
          Object.entries(groupedHistory).map(([date, items]) => (
            <Card key={date}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-sm text-gray-500">{items.length} activities</p>
              </div>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-${getTypeColor(item.type)}-100 flex items-center justify-center`}>
                      <div className={`text-${getTypeColor(item.type)}-600`}>
                        {getTypeIcon(item.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">By {item.user}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        </div>
                        <Badge variant={getTypeColor(item.type) as any}>
                          {item.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
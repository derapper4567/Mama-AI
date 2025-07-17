import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { Badge } from '../UI/Badge';
import { 
  Users, 
  Calendar, 
  AlertTriangle, 
  Activity,
  TrendingUp,
  Clock,
  Heart,
  UserCheck
} from 'lucide-react';
import { AuthContext } from '../../App';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Dashboard: React.FC<{ onTabChange?: (tab: string) => void }> = ({ onTabChange }) => {
  const [stats, setStats] = useState<any[]>([]);
  const [riskDistribution, setRiskDistribution] = useState<any>({ high: 0, medium: 0, low: 0 });
  const [resources, setResources] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { username } = useContext(AuthContext);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get(`${API_BASE_URL}/dashboard-stats/`),
      axios.get(`${API_BASE_URL}/risk-distribution/`),
      axios.get(`${API_BASE_URL}/resource-utilization-analytics/`),
      axios.get(`${API_BASE_URL}/patients/`),
    ])
      .then(([statsRes, riskRes, resourceRes, patientsRes]) => {
        setStats(statsRes.data);
        setRiskDistribution(riskRes.data);
        setResources(resourceRes.data);
        setPatients(patientsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Map stats to card config
  const statsCards = stats.map((stat: any) => {
    let icon = Users;
    if (stat.title.toLowerCase().includes('appointment')) icon = Calendar;
    if (stat.title.toLowerCase().includes('risk')) icon = AlertTriangle;
    if (stat.title.toLowerCase().includes('treatment') || stat.title.toLowerCase().includes('efficiency')) icon = Activity;
    if (stat.title.toLowerCase().includes('resource')) icon = TrendingUp;
    return {
      ...stat,
      icon,
      trend: stat.change || '+0%'
    };
  });

  // Risk distribution values
  const totalPatients = patients.length;
  const highRiskPatients = riskDistribution.high || 0;
  const mediumRiskPatients = riskDistribution.medium || 0;
  const lowRiskPatients = riskDistribution.low || 0;

  // Recent patients (last 3 by id or created order)
  const recentPatients = [...patients].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, {username || 'User'}!</h1>
            <p className="text-blue-100">Here's what's happening at your clinic today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Today</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Risk Distribution</h3>
          <div className="space-y-4">
            <ProgressBar
              label="High Risk Patients"
              value={highRiskPatients}
              max={totalPatients}
              color="red"
            />
            <ProgressBar
              label="Medium Risk Patients"
              value={mediumRiskPatients}
              max={totalPatients}
              color="yellow"
            />
            <ProgressBar
              label="Low Risk Patients"
              value={lowRiskPatients}
              max={totalPatients}
              color="green"
            />
          </div>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Resource Utilization</h3>
          <div className="space-y-4">
            {resources.map((resource: any, i: number) => (
              <ProgressBar
                key={resource.id || i}
                label={resource.item || resource.name}
                value={resource.total ? (resource.total - resource.available) : (resource.available_stock ? 0 : 0)}
                max={resource.total || resource.available_stock || 1}
                color={resource.status === 'critical' ? 'red' : resource.status === 'low' ? 'yellow' : 'green'}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Patients</h3>
          <div className="space-y-4">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.condition}</p>
                </div>
                <div className="text-right">
                  <Badge variant={patient.riskLevel || patient.risk_level}>{patient.riskLevel || patient.risk_level}</Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {patient.appointmentTime ? new Date(patient.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button
              className="w-full flex items-center space-x-3 p-3 text-left bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              onClick={() => {
                if (onTabChange) onTabChange('patients');
                setTimeout(() => {
                  window.dispatchEvent(new Event('openAddPatientModal'));
                }, 100);
              }}
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Add New Patient</span>
            </button>
            <button
              className="w-full flex items-center space-x-3 p-3 text-left bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              onClick={() => {
                if (onTabChange) onTabChange('patients');
              }}
            >
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Schedule Appointment</span>
            </button>
            <button
              className="w-full flex items-center space-x-3 p-3 text-left bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              onClick={() => {
                if (onTabChange) onTabChange('risk');
              }}
            >
              <AlertTriangle className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Risk Assessment</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};
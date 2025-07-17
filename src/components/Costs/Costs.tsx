import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Filter,
  Download,
  Plus,
  PieChart,
  BarChart3
} from 'lucide-react';
import { CostItem } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Costs: React.FC = () => {
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('30');
  const [trend, setTrend] = useState<{ date: string; total: number }[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/costs/`)
      .then(res => setCosts(res.data))
      .finally(() => setLoading(false));
    setTrendLoading(true);
    axios.get(`${API_BASE_URL}/cost-trends/`)
      .then(res => setTrend(res.data))
      .finally(() => setTrendLoading(false));
  }, []);

  const handleImport = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/import-costs/`);
      alert(`Import complete: ${res.data.created} created, ${res.data.updated} updated.`);
      window.location.reload();
    } catch (err: any) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const filteredCosts = costs.filter(cost => {
    const typeMatch = filterType === 'all' || cost.type === filterType;
    const dateMatch = true; // Simplified for demo
    return typeMatch && dateMatch;
  });

  const costStats = {
    total: filteredCosts.reduce((sum, cost) => sum + cost.amount, 0),
    treatments: filteredCosts.filter(c => c.type === 'treatment').reduce((sum, cost) => sum + cost.amount, 0),
    medications: filteredCosts.filter(c => c.type === 'medication').reduce((sum, cost) => sum + cost.amount, 0),
    equipment: filteredCosts.filter(c => c.type === 'equipment').reduce((sum, cost) => sum + cost.amount, 0),
    staff: filteredCosts.filter(c => c.type === 'staff').reduce((sum, cost) => sum + cost.amount, 0),
    facility: filteredCosts.filter(c => c.type === 'facility').reduce((sum, cost) => sum + cost.amount, 0),
  };

  const costsByType = [
    { type: 'Treatment', amount: costStats.treatments, color: 'bg-blue-500' },
    { type: 'Medication', amount: costStats.medications, color: 'bg-green-500' },
    { type: 'Equipment', amount: costStats.equipment, color: 'bg-purple-500' },
    { type: 'Staff', amount: costStats.staff, color: 'bg-yellow-500' },
    { type: 'Facility', amount: costStats.facility, color: 'bg-red-500' },
  ];

  const getTypeColor = (type: CostItem['type']) => {
    switch (type) {
      case 'treatment': return 'blue';
      case 'medication': return 'green';
      case 'equipment': return 'purple';
      case 'staff': return 'yellow';
      case 'facility': return 'red';
      default: return 'gray';
    }
  };

  // Pie chart data: group by week or just one slice for each day
  const pieData = trend.length > 0
    ? trend.map(d => ({ name: d.date, value: d.total }))
    : [];
  const pieColors = [
    '#3b82f6', '#10b981', '#a78bfa', '#f59e42', '#ef4444', '#6366f1', '#fbbf24', '#14b8a6', '#f472b6', '#8b5cf6',
    '#f87171', '#34d399', '#facc15', '#eab308', '#f472b6', '#a3e635', '#f43f5e', '#fcd34d', '#38bdf8', '#f9fafb',
    '#fca5a5', '#f87171', '#fbbf24', '#fde68a', '#fef3c7', '#f3f4f6', '#d1fae5', '#bbf7d0', '#f0abfc', '#818cf8', '#e0e7ef'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Management</h1>
          <p className="text-gray-600 mt-1">Track and analyze treatment costs</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleImport}>
            Import All Costs
          </Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
        </div>
      </div>

      {/* Costs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Facility</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Region</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base Cost (KES)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NHIF Covered</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Insurance Copay (KES)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Out-of-Pocket (KES)</th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost, idx) => (
                <tr key={idx} className="bg-white even:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">{cost.facility}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.region}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.category}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.treatment}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.cost}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.nhif_covered}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.insurance_copay}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{cost.out_of_pocket}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cost Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Costs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${typeof costStats.total === 'number' && !isNaN(costStats.total) ? costStats.total.toLocaleString() : '0'}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+12.5%</span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Treatments</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                ${typeof costStats.treatments === 'number' && !isNaN(costStats.treatments) ? costStats.treatments.toLocaleString() : '0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {costStats.total ? ((costStats.treatments / costStats.total) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medications</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                ${typeof costStats.medications === 'number' && !isNaN(costStats.medications) ? costStats.medications.toLocaleString() : '0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {costStats.total ? ((costStats.medications / costStats.total) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipment</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                ${typeof costStats.equipment === 'number' && !isNaN(costStats.equipment) ? costStats.equipment.toLocaleString() : '0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {costStats.total ? ((costStats.equipment / costStats.total) * 100).toFixed(1) : '0.0'}% of total
              </p>
            </div>
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="treatment">Treatment</option>
                <option value="medication">Medication</option>
                <option value="equipment">Equipment</option>
                <option value="staff">Staff</option>
                <option value="facility">Facility</option>
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
              </select>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" icon={<PieChart className="w-4 h-4" />}>
              Chart View
            </Button>
            <Button variant="ghost" icon={<BarChart3 className="w-4 h-4" />}>
              Analytics
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <Card className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Breakdown</h3>
          <div className="space-y-4">
            {costsByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.type}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount.toLocaleString() : '0'}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Costs */}
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Cost Entries</h3>
          <div className="space-y-4">
            {filteredCosts.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No recent cost entries.</div>
            ) : (
              filteredCosts.slice(0, 6).map((cost) => (
                <div key={cost.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{cost.description}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <Badge variant={getTypeColor(cost.type) as any}>
                        {cost.type}
                      </Badge>
                      <span className="text-sm text-gray-500">{cost.category}</span>
                      <span className="text-sm text-gray-500">
                        {cost.date && !isNaN(new Date(cost.date).getTime()) ? new Date(cost.date).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${typeof cost.amount === 'number' && !isNaN(cost.amount) ? cost.amount.toLocaleString() : '0'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Cost Trends Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Trends</h3>
        {trendLoading ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">Loading cost trends...</div>
        ) : trend.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-400">No cost trend data available.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={4} />
                  <YAxis tickFormatter={v => `KES ${v}`} />
                  <Tooltip formatter={v => `KES ${v}`} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-gray-500 mt-2">Total cost per day (last 30 days)</div>
            </div>
            {/* Pie Chart */}
            <div className="h-72 flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `KES ${v}`} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-gray-500 mt-2">Cost distribution by day (last 30 days)</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { 
  Users, 
  Package, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Resources: React.FC = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResourceId, setSelectedResourceId] = useState<string | number | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/resource-utilization-analytics/`)
      .then(res => setResources(res.data))
      .finally(() => setLoading(false));
  }, []);

  // Group resources by type if available, else by category
  const staffResources = resources.filter(r => r.category?.toLowerCase() === 'staff');
  const equipmentResources = resources.filter(r => r.category?.toLowerCase() === 'equipment');
  const suppliesResources = resources.filter(r => r.category?.toLowerCase() === 'supplies');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'red';
      case 'low': return 'yellow';
      case 'adequate': return 'green';
      default: return 'blue';
    }
  };

  const ResourceSection = ({ title, resources, icon: Icon }: {
    title: string;
    resources: any[];
    icon: React.ComponentType<any>;
  }) => (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <Badge variant="info">{resources.length} items</Badge>
      </div>
      <div className="space-y-4">
        {resources.map((resource) => (
          <div key={resource.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">{resource.name}</h4>
                <p className="text-sm text-gray-500">
                  {resource.available} available of {resource.total} total
                </p>
              </div>
              <div className="text-right">
                <Badge variant={resource.status as any}>
                  {resource.status}
                </Badge>
                <p className="text-sm text-gray-500 mt-1">
                  Cost: ${resource.cost ? resource.cost.toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
            <ProgressBar
              value={resource.total - resource.available}
              max={resource.total}
              color={getStatusColor(resource.status) as any}
              showValue={false}
            />
          </div>
        ))}
      </div>
    </Card>
  );

  const handleImport = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/import-resources/`);
      alert(`Import complete: ${res.data.created} created, ${res.data.updated} updated.`);
      window.location.reload();
    } catch (err: any) {
      alert('Import failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Find the selected resource for trend chart
  const selectedResource = resources.find(r => String(r.id) === String(selectedResourceId)) || resources[0];
  const trendData = selectedResource?.trend || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resource Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage hospital resources</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="primary" icon={<Upload className="w-4 h-4" />} onClick={handleImport}>
            Import All Resources
          </Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Report
          </Button>
          <Button variant="primary" icon={<RefreshCw className="w-4 h-4" />} onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Resources</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resources.reduce((sum, r) => sum + (r.total || 0), 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Now</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resources.reduce((sum, r) => sum + (r.available || 0), 0)}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {resources.filter(r => r.status === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${resources.reduce((sum, r) => sum + (r.cost || 0), 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Resource Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ResourceSection
          title="Staff Resources"
          resources={staffResources}
          icon={Users}
        />
        <ResourceSection
          title="Equipment"
          resources={equipmentResources}
          icon={Package}
        />
        <ResourceSection
          title="Medical Supplies"
          resources={suppliesResources}
          icon={Activity}
        />
      </div>

      {/* Resource Utilization Chart */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Resource Utilization Trends</h3>
        <div className="mb-4 flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Select Resource:</label>
          <select
            value={selectedResource?.id || ''}
            onChange={e => setSelectedResourceId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {resources.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="used" fill="#8884d8" name="Daily Usage" />
                <Line type="monotone" dataKey="used" stroke="#ff7300" name="Usage Trend" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">No usage data for this resource.</div>
          )}
        </div>
      </Card>
    </div>
  );
};
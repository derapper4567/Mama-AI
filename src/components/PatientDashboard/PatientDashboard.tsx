import React, { useEffect, useState } from 'react';
import { 
  Heart, User, LogOut, FileText, LayoutDashboard, Calendar, AlertTriangle, 
  Mail, Phone, MapPin, Edit2, Download, Search as SearchIcon,
  MessageCircle, Send, ExternalLink, Navigation, Building2, Clock, Shield
} from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  appointment: string;
  contact: string;
  emergency_contact?: string;
  email?: string;
  address?: string;
  wait_time?: string;
  location?: string;
  risk_level?: string;
  risk_factors?: string;
  notes?: string;
  risk_score?: number;
}

interface Result {
  id: number;
  risk_score: number;
  recommended_action: string;
  timestamp: string;
  screening_type?: string;
  region?: string;
  cost?: number;
}

interface Hospital {
  name: string;
  address: string;
  distance_text: string;
  distance_value: number;
  phone: string;
  operator: string;
  website: string;
  emergency: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface ConsultationGroup {
  name: string;
  description: string;
  link: string;
  color: string;
  available: boolean;
}

interface ConsultationGroups {
  whatsapp: ConsultationGroup;
  telegram: ConsultationGroup;
}

const patientMenu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'results', label: 'Results', icon: FileText },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'support', label: 'Support & Care', icon: MessageCircle },
];

export const PatientDashboard: React.FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'action'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [nearbyHospitals, setNearbyHospitals] = useState<Hospital[]>([]);
  const [consultationGroups, setConsultationGroups] = useState<ConsultationGroups | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [hospitalsCount, setHospitalsCount] = useState<number>(0);
  const [patientCoordinates, setPatientCoordinates] = useState<{lat: number; lon: number; display_name: string} | null>(null);
  const pageSize = 8;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const access = localStorage.getItem('access');
    const patient_id = localStorage.getItem('patient_id');
    if (!access || !patient_id) {
      setError('Not authenticated as patient.');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/patient-dashboard?patient_id=${patient_id}`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      
      // Existing data
      setPatient(res.data.patient);
      setResults(res.data.results);
      
      // New data
      setNearbyHospitals(res.data.nearby_hospitals || []);
      setConsultationGroups(res.data.consultation_groups || null);
      setLocationStatus(res.data.location_status || '');
      setHospitalsCount(res.data.hospitals_count || 0);
      setPatientCoordinates(res.data.patient_coordinates || null);
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch patient data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('patient_id');
    window.location.href = '/';
  };

  // Filtering and sorting logic
  const filteredResults = results.filter(r => {
    const searchLower = search.toLowerCase();
    return (
      r.recommended_action.toLowerCase().includes(searchLower) ||
      (r.screening_type || '').toLowerCase().includes(searchLower) ||
      (r.region || '').toLowerCase().includes(searchLower)
    );
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'date') {
      return sortDir === 'asc'
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else if (sortBy === 'score') {
      return sortDir === 'asc' ? a.risk_score - b.risk_score : b.risk_score - a.risk_score;
    } else if (sortBy === 'action') {
      return sortDir === 'asc'
        ? a.recommended_action.localeCompare(b.recommended_action)
        : b.recommended_action.localeCompare(a.recommended_action);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedResults.length / pageSize);
  const paginatedResults = sortedResults.slice((page - 1) * pageSize, page * pageSize);

  // CSV Export
  const handleExportCSV = () => {
    const header = ['Date', 'Score', 'Action', 'Type', 'Region', 'Cost'];
    const rows = sortedResults.map(r => [
      new Date(r.timestamp).toLocaleString(),
      r.risk_score.toFixed(2),
      r.recommended_action,
      r.screening_type || '-',
      r.region || '-',
      r.cost ? `KES ${r.cost}` : '-'
    ]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-center py-10">Loading patient dashboard...</div>;
  if (error) return <div className="text-center text-red-600 py-10">{error}</div>;
  if (!patient) return <div className="text-center py-10">No patient data found.</div>;

  // Helper for summary cards
  const summaryCards = [
    {
      label: 'Next Appointment',
      value: patient.appointment ? new Date(patient.appointment).toLocaleString() : 'N/A',
      icon: <Calendar className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50'
    },
    {
      label: 'Risk Level',
      value: patient.risk_level || 'N/A',
      icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-50'
    },
    {
      label: 'Last Result',
      value: results[0] ? results[0].recommended_action : 'N/A',
      icon: <FileText className="w-6 h-6 text-teal-500" />, color: 'bg-teal-50'
    },
    {
      label: 'Risk Score',
      value: patient.risk_score !== undefined ? patient.risk_score.toFixed(2) : 'N/A',
      icon: <Heart className="w-6 h-6 text-pink-500" />, color: 'bg-pink-50'
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="bg-white border-r border-gray-200 w-56 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mama AI</h1>
              <p className="text-sm text-gray-500">Patient Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            {patientMenu.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600'
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
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{patient.name}</p>
            </div>
            <button className="text-gray-400 hover:text-gray-600" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {activeTab === 'dashboard' && (
          <>
            <h2 className="text-2xl font-bold text-teal-700 mb-6">Welcome, {patient.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {summaryCards.map((card) => (
                <div key={card.label} className={`rounded-xl shadow bg-white p-5 flex items-center space-x-4 ${card.color}`}>
                  <div>{card.icon}</div>
                  <div>
                    <div className="text-sm text-gray-500 font-medium">{card.label}</div>
                    <div className="text-lg font-bold text-gray-900">{card.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-2">Quick Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2"><Mail className="w-4 h-4 text-gray-400" /><span>{patient.email}</span></div>
                <div className="flex items-center space-x-2"><Phone className="w-4 h-4 text-gray-400" /><span>{patient.contact}</span></div>
                <div className="flex items-center space-x-2"><MapPin className="w-4 h-4 text-gray-400" /><span>{patient.address || '-'}</span></div>
                <div className="flex items-center space-x-2"><User className="w-4 h-4 text-gray-400" /><span>{patient.emergency_contact || '-'}</span></div>
              </div>
            </div>
          </>
        )}
        {activeTab === 'results' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
              <h2 className="text-xl font-bold text-teal-700">Your Results</h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search results..."
                    className="pl-9 pr-3 py-2 border rounded text-sm"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                  />
                </div>
                <button
                  className="flex items-center px-3 py-2 bg-teal-50 text-teal-700 rounded hover:bg-teal-100 border border-teal-200 text-sm font-medium"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </button>
              </div>
            </div>
            {paginatedResults.length === 0 ? (
              <div className="text-gray-500">No results found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border rounded-xl">
                  <thead className="bg-teal-50 sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-left cursor-pointer" onClick={() => { setSortBy('date'); setSortDir(sortBy === 'date' && sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        Date {sortBy === 'date' && (sortDir === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="p-2 text-left cursor-pointer" onClick={() => { setSortBy('score'); setSortDir(sortBy === 'score' && sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        Score {sortBy === 'score' && (sortDir === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="p-2 text-left cursor-pointer" onClick={() => { setSortBy('action'); setSortDir(sortBy === 'action' && sortDir === 'desc' ? 'asc' : 'desc'); }}>
                        Action {sortBy === 'action' && (sortDir === 'asc' ? '▲' : '▼')}
                      </th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Region</th>
                      <th className="p-2 text-left">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResults.map((r, idx) => {
                      // Row highlighting for high risk or recent
                      const isHighRisk = r.risk_score > 0.7;
                      const isRecent = idx === 0;
                      return (
                        <tr key={r.id} className={
                          `${isHighRisk ? 'bg-red-50' : isRecent ? 'bg-blue-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-colors`}
                        >
                          <td className="p-2 whitespace-nowrap">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${isHighRisk ? 'bg-red-100 text-red-700' : r.risk_score > 0.4 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-700'}`}>{r.risk_score.toFixed(2)}</span>
                          </td>
                          <td className="p-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-teal-100 text-teal-800">
                              <FileText className="w-3 h-3" /> {r.recommended_action}
                            </span>
                          </td>
                          <td className="p-2">{r.screening_type || '-'}</td>
                          <td className="p-2">{r.region || '-'}</td>
                          <td className="p-2">{r.cost ? `KES ${r.cost}` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <button
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="text-sm">Page {page} of {totalPages}</span>
                <button
                  className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="bg-gradient-to-br from-teal-50 to-white rounded-2xl shadow p-0 w-full">
            <div className="flex flex-col md:flex-row items-center md:items-start p-8 pb-4">
              <div className="relative flex-shrink-0 mb-4 md:mb-0 md:mr-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-400 to-blue-400 flex items-center justify-center shadow-lg ring-4 ring-white">
                  <User className="w-12 h-12 text-white" />
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between w-full mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{patient.name}</h2>
                    <div className="text-teal-600 text-sm font-medium">Patient Profile</div>
                  </div>
                  <button className="inline-flex items-center px-4 py-1.5 bg-white border border-teal-200 text-teal-700 rounded-full shadow-sm hover:bg-teal-50 transition-colors text-sm font-semibold">
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                </div>
                <hr className="my-3 border-gray-200" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Email</div>
                    <div className="font-semibold text-gray-800 break-all">{patient.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Phone</div>
                    <div className="font-semibold text-gray-800">{patient.contact}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Address</div>
                    <div className="font-medium text-gray-700">{patient.address || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs mb-1">Emergency Contact</div>
                    <div className="font-medium text-gray-700">{patient.emergency_contact || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-teal-700 mb-6">Support & Care</h2>
            
            {/* Consultation Groups Section */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-teal-600" />
                Consultation Groups
              </h3>
              <p className="text-gray-600 mb-4">Connect with our medical team for instant consultation and support.</p>
              
              {consultationGroups ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(consultationGroups).map(([platform, group]) => (
                    <div key={platform} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: group.color + '20' }}
                          >
                            {platform === 'whatsapp' ? (
                              <MessageCircle className="w-5 h-5" style={{ color: group.color }} />
                            ) : (
                              <Send className="w-5 h-5" style={{ color: group.color }} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{group.name}</h4>
                            <p className="text-sm text-gray-500">{group.description}</p>
                          </div>
                        </div>
                        {group.available && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <a
                        href={group.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90"
                        style={{ backgroundColor: group.color }}
                      >
                        Join {platform.charAt(0).toUpperCase() + platform.slice(1)} Group
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  Consultation groups are currently unavailable.
                </div>
              )}
            </div>

            {/* Nearby Hospitals Section */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-teal-600" />
                Nearby Hospitals
                {hospitalsCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    {hospitalsCount} found
                  </span>
                )}
              </h3>
              
              {/* Location Status */}
              {locationStatus && (
                <div className="mb-4">
                  {locationStatus === 'found' && patientCoordinates && (
                    <div className="flex items-center text-green-600 text-sm">
                      <Navigation className="w-4 h-4 mr-1" />
                      Location found: {patientCoordinates.display_name}
                    </div>
                  )}
                  {locationStatus === 'no_address_provided' && (
                    <div className="flex items-center text-yellow-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Please update your address in your profile to see nearby hospitals
                    </div>
                  )}
                  {locationStatus === 'geocoding_failed' && (
                    <div className="flex items-center text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Could not locate your address. Please check your address in your profile.
                    </div>
                  )}
                  {locationStatus === 'no_hospitals_found' && (
                    <div className="flex items-center text-gray-600 text-sm">
                      <Building2 className="w-4 h-4 mr-1" />
                      No hospitals found in your area
                    </div>
                  )}
                </div>
              )}

              {/* Hospitals List */}
              {nearbyHospitals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nearbyHospitals.map((hospital, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{hospital.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{hospital.address}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Navigation className="w-4 h-4 mr-1" />
                              {hospital.distance_text}
                            </div>
                            {hospital.emergency === 'yes' && (
                              <div className="flex items-center text-red-600">
                                <Shield className="w-4 h-4 mr-1" />
                                Emergency
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Distance</div>
                          <div className="text-sm font-medium text-teal-600">{hospital.distance_text}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {hospital.phone && hospital.phone !== 'Not available' && (
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${hospital.phone}`} className="hover:text-teal-600">
                              {hospital.phone}
                            </a>
                          </div>
                        )}
                        {hospital.operator && (
                          <div className="flex items-center text-gray-600">
                            <Building2 className="w-4 h-4 mr-2" />
                            {hospital.operator}
                          </div>
                        )}
                        {hospital.website && (
                          <div className="flex items-center text-gray-600">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="hover:text-teal-600">
                              Visit Website
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.coordinates.lat},${hospital.coordinates.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-teal-700 bg-teal-50 rounded-md hover:bg-teal-100 transition-colors"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  {locationStatus === 'found' ? (
                    <div>
                      <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>No hospitals found in your area</p>
                    </div>
                  ) : (
                    <div>
                      <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Add your address to see nearby hospitals</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
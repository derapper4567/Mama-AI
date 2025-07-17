import React, { useEffect, useState } from 'react';
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

export const PatientDashboard: React.FC = () => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setPatient(res.data.patient);
        setResults(res.data.results);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch patient data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-10">Loading patient dashboard...</div>;
  if (error) return <div className="text-center text-red-600 py-10">{error}</div>;
  if (!patient) return <div className="text-center py-10">No patient data found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-teal-700">Welcome, {patient.name}</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Your Details</h3>
        <ul className="text-gray-700 space-y-1">
          <li><b>Age:</b> {patient.age}</li>
          <li><b>Email:</b> {patient.email}</li>
          <li><b>Phone:</b> {patient.contact}</li>
          <li><b>Condition:</b> {patient.condition}</li>
          <li><b>Appointment:</b> {patient.appointment}</li>
          <li><b>Risk Level:</b> {patient.risk_level}</li>
          <li><b>Risk Score:</b> {patient.risk_score?.toFixed(2)}</li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Results</h3>
        {results.length === 0 ? (
          <div className="text-gray-500">No results found.</div>
        ) : (
          <table className="w-full border mt-2">
            <thead>
              <tr className="bg-teal-100">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Score</th>
                <th className="p-2 text-left">Action</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Region</th>
                <th className="p-2 text-left">Cost</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="p-2">{r.risk_score.toFixed(2)}</td>
                  <td className="p-2">{r.recommended_action}</td>
                  <td className="p-2">{r.screening_type || '-'}</td>
                  <td className="p-2">{r.region || '-'}</td>
                  <td className="p-2">{r.cost ? `KES ${r.cost}` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}; 
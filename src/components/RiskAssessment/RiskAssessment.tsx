import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Heart,
  Activity,
  Thermometer,
  Plus,
  FileText
} from 'lucide-react';
import axios from 'axios';
import { Patient } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define the risk factor fields in the exact order expected by the model (excluding total_risk_score)
const riskFactorFields = [
  { name: 'age', label: 'Age', type: 'number', readOnly: true },
  { name: 'sexual_partners', label: 'Number of Sexual Partners', type: 'number' },
  { name: 'first_sexual_age', label: 'Age at First Sexual Intercourse', type: 'number' },
  { name: 'years_sexually_active', label: 'Years Sexually Active', type: 'number' },
  { name: 'hpv_positive', label: 'HPV Positive', type: 'boolean' },
  { name: 'abnormal_pap', label: 'Abnormal Pap Smear', type: 'boolean' },
  { name: 'smoking', label: 'Smoking', type: 'boolean' },
  { name: 'stds_history', label: 'History of STDs', type: 'boolean' },
  { name: 'insurance', label: 'Has Insurance', type: 'boolean' },
];

export const RiskAssessmentComponent: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [riskFactors, setRiskFactors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [isNewAssessmentMode, setIsNewAssessmentMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/patients/`)
      .then(res => {
        setPatients(res.data);
      })
      .catch(() => setPatients([]));
  }, []);

  const selectedPatient = patients.find(p => String(p.id) === String(selectedPatientId));
    
  // Auto-fill age when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      setRiskFactors((prev: any) => ({ ...prev, age: selectedPatient.age }));
    } else {
      setRiskFactors((prev: any) => ({ ...prev, age: '' }));
    }
  }, [selectedPatient]);

  // Fetch assessment history for all patients
  const fetchAssessmentHistory = useCallback(() => {
    setHistoryLoading(true);
    axios.get(`${API_BASE_URL}/risk-assessment-history/`)
      .then(res => setAssessmentHistory(res.data))
      .catch(() => setAssessmentHistory([]))
      .finally(() => setHistoryLoading(false));
  }, []);

  // Fetch on mount and after assessment
  useEffect(() => {
    fetchAssessmentHistory();
  }, [fetchAssessmentHistory]);

  const handleRiskFactorChange = (name: string, value: any) => {
    setRiskFactors((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload: any = {
        patient_id: selectedPatientId,
        features: [
          riskFactors.age !== undefined ? Number(riskFactors.age) : null,
          riskFactors.sexual_partners !== undefined ? Number(riskFactors.sexual_partners) : null,
          riskFactors.first_sexual_age !== undefined ? Number(riskFactors.first_sexual_age) : null,
          riskFactors.years_sexually_active !== undefined ? Number(riskFactors.years_sexually_active) : null,
          riskFactors.hpv_positive === '1' ? 1 : 0,
          riskFactors.abnormal_pap === '1' ? 1 : 0,
          riskFactors.smoking === '1' ? 1 : 0,
          riskFactors.stds_history === '1' ? 1 : 0,
          riskFactors.insurance === '1' ? 1 : 0,
          null, // total_risk_score placeholder
        ],
      };
      if (riskFactors.region) payload.region = riskFactors.region;
      if (riskFactors.screening_type) payload.screening_type = riskFactors.screening_type;
      const res = await axios.post(`${API_BASE_URL}/risk_assessment/`, payload);
      setResult(res.data);
      fetchAssessmentHistory();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error analyzing risk');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setRiskFactors({});
    setResult(null);
    setIsNewAssessmentMode(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Assessment</h1>
          <p className="text-gray-600 mt-1">Cervical cancer risk evaluation</p>
        </div>
        {!isNewAssessmentMode && (
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewAssessmentMode(true)}
          >
            New Assessment
          </Button>
        )}
      </div>

      {isNewAssessmentMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assessment Form */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Risk Assessment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Patient *</label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">-- Select --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedPatient && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="font-medium text-gray-900">{selectedPatient.name}</div>
                  <div className="text-sm text-gray-600">Age: {selectedPatient.age}</div>
                  <div className="text-sm text-gray-600">Condition: {selectedPatient.condition}</div>
                  <div className="text-sm text-gray-600">Contact: {selectedPatient.contact}</div>
                  <div className="text-sm text-gray-600">Email: {selectedPatient.email}</div>
                </div>
              )}

              {riskFactorFields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{field.label} *</label>
                  {field.type === 'boolean' ? (
                    <select
                    required
                      value={riskFactors[field.name] ?? ''}
                      onChange={e => handleRiskFactorChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">-- Select --</option>
                      <option value="1">Yes</option>
                      <option value="0">No</option>
                    </select>
                  ) : (
                  <input
                    required
                    type="number"
                      value={riskFactors[field.name] ?? ''}
                      onChange={e => handleRiskFactorChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      readOnly={field.name === 'age'}
                  />
                  )}
                </div>
              ))}

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex space-x-3 pt-4">
                <Button type="submit" variant="primary" loading={loading} className="flex-1">
                  {loading ? 'Analyzing...' : 'Analyze Risk'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>

          {/* Results */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Assessment Results</h2>
            {loading ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Analyzing patient data...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                    result.risk_score > 0.7 ? 'bg-red-100' : result.risk_score > 0.3 ? 'bg-yellow-100' : 'bg-green-100'
                  }`}>
                    {result.risk_score > 0.7 ? (
                      <AlertTriangle className="w-10 h-10 text-red-600" />
                    ) : result.risk_score > 0.3 ? (
                      <Clock className="w-10 h-10 text-yellow-600" />
                    ) : (
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Risk Score: {(result.risk_score * 100).toFixed(1)} / 100
                  </h3>
                  <Badge variant={result.risk_score > 0.7 ? 'high' : result.risk_score > 0.3 ? 'medium' : 'low'} size="lg">
                    {result.risk_score > 0.7 ? 'HIGH' : result.risk_score > 0.3 ? 'MEDIUM' : 'LOW'} RISK
                  </Badge>
                </div>
                <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                  <h3 className="font-bold mb-2">Assessment Result</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div><b>Risk Score:</b> {result.risk_score}</div>
                    <div><b>Recommended Action:</b> {result.recommended_action}</div>
                    <div><b>Age:</b> {result.age}</div>
                    <div><b>Sexual Partners:</b> {result.sexual_partners}</div>
                    <div><b>First Sexual Activity Age:</b> {result.first_sexual_age}</div>
                    <div><b>Years Sexually Active:</b> {result.years_sexually_active}</div>
                    <div><b>HPV Test Result:</b> {result.hpv_positive ? 'Positive' : 'Negative'}</div>
                    <div><b>Pap Smear Result:</b> {result.abnormal_pap ? 'Abnormal' : 'Normal'}</div>
                    <div><b>Smoking Status:</b> {result.smoking ? 'Yes' : 'No'}</div>
                    <div><b>STDs History:</b> {result.stds_history ? 'Yes' : 'No'}</div>
                    <div><b>Insurance Covered:</b> {result.insurance ? 'Yes' : 'No'}</div>
                    <div><b>Region:</b> {result.region || '-'}</div>
                    <div><b>Screening Type Last:</b> {result.screening_type || '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Patient:</span>
                    <p className="font-medium">{selectedPatient?.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Assessment Date:</span>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Fill out the assessment form to see results</p>
              </div>
            )}
          </Card>
        </div>
      ) :
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assessment Instructions</h2>
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessment in progress</h3>
            <p className="text-gray-500 mb-6">Start by creating a new risk assessment for a patient</p>
              <Button 
                variant="primary" 
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setIsNewAssessmentMode(true)}
              >
                Create Assessment
              </Button>
            </div>
        </Card>
      }

      {/* Assessment History Section (modern card UI) */}
      <Card className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment History</h2>
        {historyLoading ? (
          <div className="text-gray-500">Loading history...</div>
        ) : assessmentHistory.length === 0 ? (
          <div className="text-gray-500">No previous assessments found.</div>
          ) : (
            <div className="space-y-4">
            {assessmentHistory.map((h, i) => {
              // Risk level logic
              let riskLevel = 'low';
              let riskLabel = 'low risk';
              let riskColor = 'bg-green-100 text-green-800';
              if (h.risk_score > 0.7) {
                riskLevel = 'high';
                riskLabel = 'high risk';
                riskColor = 'bg-red-100 text-red-800';
              } else if (h.risk_score > 0.3) {
                riskLevel = 'medium';
                riskLabel = 'medium risk';
                riskColor = 'bg-yellow-100 text-yellow-800';
              }
              return (
                <div key={h.id || i} className="flex items-center justify-between p-4 rounded-lg border bg-white shadow-sm">
                    <div>
                    <div className="font-bold text-gray-900 text-base">{h.patient_name || h.patient}</div>
                    <div className="text-xs text-gray-500 mb-1">
                      {h.timestamp ? new Date(h.timestamp).toLocaleDateString() : '-'}
                      {h.age ? ` • Age: ${h.age}` : ''}
                    </div>
                    {/* Optionally add more info here */}
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{Math.round(h.risk_score * 100)}/100</div>
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${riskColor}`}>{riskLabel}</span>
                    </div>
                    {h.recommended_action && (
                      <div className="ml-4 text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded">
                        {h.recommended_action}
                  </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </Card>
    </div>
  );
};
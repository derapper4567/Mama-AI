import React, { useState } from 'react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar, 
  Phone, 
  Clock,
  Search,
  Filter,
  UserPlus,
  Home,
  MapPin
} from 'lucide-react';
import { Patient } from '../../types';
import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper to map backend patient to frontend Patient type
const mapPatient = (p: any) => ({
  ...p,
  emergencyContact: p.emergency_contact || '',
  email: p.email || '',
  address: p.address || '',
});

export const PatientQueue: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedPatientForSchedule, setSelectedPatientForSchedule] = useState<Patient | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Fetch patients from backend on mount
  React.useEffect(() => {
    axios.get(`${API_BASE_URL}/patients/`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setPatients(res.data.map(mapPatient));
        } else {
          setPatients([]); // fallback to empty array
          console.error('API did not return an array:', res.data);
        }
      })
      .catch(err => {
        setPatients([]); // fallback to empty array on error
        console.error('Failed to fetch patients:', err);
      });
  }, []);

  // Fetch rooms (for scheduling)
  const fetchRooms = () => {
    setRoomsLoading(true);
    axios.get(`${API_BASE_URL}/rooms/`)
      .then(res => setRooms(Array.isArray(res.data) ? res.data : []))
      .finally(() => setRoomsLoading(false));
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.condition.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRisk === 'all' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesFilter;
  });

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditModalOpen(true);
  };

  const handleDelete = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId) || null;
    setPatientToDelete(patient);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await axios.delete(`${API_BASE_URL}/patients/${patientToDelete.id}/`);
      setPatients(patients.filter(p => p.id !== patientToDelete.id));
    } catch (err) {
      console.error('Failed to delete patient:', err);
    } finally {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPatientToDelete(null);
  };

  const PatientForm = ({ patient, onSave, onCancel }: {
    patient?: Patient;
    onSave: (patient: Patient) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: patient?.name || '',
      age: patient?.age || '',
      condition: patient?.condition || '',
      appointmentTime: patient?.appointment || '',
      phone: patient?.contact || '',
      emergencyContact: patient?.emergencyContact || '',
      email: patient?.email || '',
      address: patient?.address || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const payload: any = {
        name: formData.name,
        age: Number(formData.age),
        condition: formData.condition,
        appointment: formData.appointmentTime,
        contact: formData.phone,
        email: formData.email,
        address: formData.address,
      };
      if (formData.emergencyContact) {
        payload.emergency_contact = formData.emergencyContact;
      }
      try {
        let res: AxiosResponse<any>;
        if (patient) {
          // Editing existing patient
          res = await axios.patch(`${API_BASE_URL}/patients/${patient.id}/`, payload);
          setPatients(prev => prev.map(p => p.id === patient.id ? res.data : p));
        } else {
          // Creating new patient
          res = await axios.post(`${API_BASE_URL}/patients/`, payload);
          setPatients(prev => [...prev, res.data]);
        }
        onSave(res.data);
      } catch (err: any) {
        console.error('Failed to save patient:', err);
        if (err.response) {
          console.error('Backend error details:', err.response.data);
        }
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Condition/Reason for Visit *
          </label>
          <input
            type="text"
            required
            value={formData.condition}
            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Enter patient's full address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Time
            </label>
            <input
              type="datetime-local"
              value={formData.appointmentTime}
              onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact
            </label>
            <input
              type="tel"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {patient ? 'Update Patient' : 'Add Patient'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Queue</h1>
          <p className="text-gray-600 mt-1">Manage patients and appointments</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Patient
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
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
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Risks</option>
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Patient List */}
      {filteredPatients.length === 0 ? (
        <Card className="text-center py-12">
          <UserPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterRisk !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first patient to the queue.'
            }
          </p>
          <Button 
            variant="primary" 
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add First Patient
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPatients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-lg">
                      {patient.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-gray-600">{patient.condition}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">Age: {patient.age}</span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {(() => {
                          const dateStr = patient.appointmentTime || patient.appointment || '';
                          if (!dateStr) return '';
                          const date = new Date(dateStr);
                          return isNaN(date.getTime()) ? dateStr : date.toLocaleString();
                        })()}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4V4zm0 0l8 8m0 0l8-8m-8 8v8" /></svg>
                        {patient.email}
                      </span>
                      <span className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {patient.contact}
                      </span>
                      {patient.address && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {patient.address.length > 30 ? patient.address.substring(0, 30) + '...' : patient.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {typeof patient.risk_score === 'number' && (
                    (() => {
                      let riskLabel = 'low risk';
                      let riskColor = 'bg-green-100 text-green-800';
                      if (patient.risk_score > 0.7) {
                        riskLabel = 'high risk';
                        riskColor = 'bg-red-100 text-red-800';
                      } else if (patient.risk_score > 0.3) {
                        riskLabel = 'medium risk';
                        riskColor = 'bg-yellow-100 text-yellow-800';
                      }
                      return (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${riskColor}`}>
                          {riskLabel}
                        </span>
                      );
                    })()
                  )}
                  <Badge variant={patient.status === 'waiting' ? 'warning' : patient.status === 'in-progress' ? 'info' : 'success'}>
                    {patient.status}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Calendar className="w-4 h-4" />}
                      onClick={() => {
                        setSelectedPatientForSchedule(patient);
                        setIsScheduleModalOpen(true);
                        setSelectedRoomId('');
                        fetchRooms();
                      }}
                    >
                      Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit3 className="w-4 h-4" />}
                      onClick={() => handleEdit(patient)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => handleDelete(patient.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Schedule Room Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setSelectedPatientForSchedule(null);
          setSelectedRoomId('');
        }}
        title="Assign Room to Patient"
        size="md"
      >
        {roomsLoading ? (
          <div className="text-center text-gray-500 py-8">Loading available rooms...</div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Select an available room for <span className="font-semibold">{selectedPatientForSchedule?.name}</span>:</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rooms.filter(r => r.status === 'available').length === 0 ? (
                  <div className="text-gray-400 text-center py-4">No available rooms.</div>
                ) : (
                  rooms.filter(r => r.status === 'available').map(room => (
                    <button
                      key={room.id}
                      className={`w-full text-left p-3 border rounded-lg flex items-center space-x-3 ${selectedRoomId === room.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <Home className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-gray-900">{room.name || room.number}</span>
                      <span className="text-xs text-gray-500 capitalize">{room.type}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  setSelectedPatientForSchedule(null);
                  setSelectedRoomId('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!selectedRoomId}
                onClick={async () => {
                  if (!selectedRoomId || !selectedPatientForSchedule) return;
                  try {
                    await axios.patch(`${API_BASE_URL}/rooms/${selectedRoomId}/`, {
                      status: 'occupied',
                      patient: selectedPatientForSchedule.id
                    });
                    setIsScheduleModalOpen(false);
                    setSelectedPatientForSchedule(null);
                    setSelectedRoomId('');
                    // Refresh patients and rooms
                    axios.get(`${API_BASE_URL}/patients/`).then(res => setPatients(Array.isArray(res.data) ? res.data : []));
                    fetchRooms();
                  } catch (err) {
                    alert('Failed to assign room.');
                  }
                }}
              >
                Assign Room
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Patient"
        size="lg"
      >
        <PatientForm
          onSave={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Edit Patient Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patient"
        size="lg"
      >
        <PatientForm
          patient={selectedPatient || undefined}
          onSave={(updatedPatient) => {
            setPatients(patients.map(p => p.id === updatedPatient.id ? updatedPatient : p));
            setIsEditModalOpen(false);
            setSelectedPatient(null);
          }}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedPatient(null);
          }}
        />
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to remove <span className="font-semibold">{patientToDelete?.name}</span> from the patient queue?</p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={cancelDelete}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
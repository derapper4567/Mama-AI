import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { 
  Home, 
  Users, 
  Plus, 
  Bed,
  Activity,
  Settings,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Room, Patient } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', type: '', status: 'available' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/rooms/`)
      .then(res => setRooms(res.data))
      .finally(() => setLoading(false));
    setPatientsLoading(true);
    axios.get(`${API_BASE_URL}/patients/`)
      .then(res => setPatients(Array.isArray(res.data) ? res.data.map(mapPatient) : []))
      .finally(() => setPatientsLoading(false));
  }, []);

  const refreshRooms = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/rooms/`)
      .then(res => setRooms(res.data))
      .finally(() => setLoading(false));
  };

  const refreshPatients = () => {
    setPatientsLoading(true);
    axios.get(`${API_BASE_URL}/patients/`)
      .then(res => setPatients(Array.isArray(res.data) ? res.data.map(mapPatient) : []))
      .finally(() => setPatientsLoading(false));
  };

  const refreshAll = () => {
    refreshRooms();
    refreshPatients();
  };

  const availablePatients = patients.filter(p => p.status === 'waiting');

  const getRoomStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'occupied': return 'error';
      case 'available': return 'success';
      case 'maintenance': return 'warning';
      default: return 'info';
    }
  };

  const getRoomTypeIcon = (type: Room['type']) => {
    switch (type) {
      case 'delivery': return <Bed className="w-5 h-5" />;
      case 'recovery': return <Activity className="w-5 h-5" />;
      case 'consultation': return <UserCheck className="w-5 h-5" />;
      case 'emergency': return <AlertCircle className="w-5 h-5" />;
      default: return <Home className="w-5 h-5" />;
    }
  };

  const handleAssignPatient = async (roomId: string, patientId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/rooms/${roomId}/`, {
        status: 'occupied',
        patient: patientId
      });
      setIsAssignModalOpen(false);
      setSelectedRoom(null);
      refreshAll();
    } catch (err) {
      alert('Failed to assign patient.');
    }
  };

  const handleDischargePatient = async (roomId: string) => {
    try {
      await axios.patch(`${API_BASE_URL}/rooms/${roomId}/`, {
        status: 'available',
        patient: null
      });
      refreshAll();
    } catch (err) {
      alert('Failed to discharge patient.');
    }
  };

  const roomStats = {
    total: rooms.length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    available: rooms.filter(r => r.status === 'available').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  };

  // Helper to map backend patient to frontend Patient type
  const mapPatient = (p: any) => ({
    ...p,
    riskLevel: p.riskLevel || p.risk_level || undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage room occupancy</p>
        </div>
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
          Add Room
        </Button>
      </div>

      {/* Room Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{roomStats.total}</p>
            </div>
            <Home className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{roomStats.occupied}</p>
            </div>
            <Users className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{roomStats.available}</p>
            </div>
            <Activity className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{roomStats.maintenance}</p>
            </div>
            <Settings className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">No rooms found.</div>
        ) : rooms.map((room) => (
          <Card key={room.id} className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  room.type === 'delivery' ? 'bg-purple-100' :
                  room.type === 'recovery' ? 'bg-blue-100' :
                  room.type === 'consultation' ? 'bg-green-100' :
                  'bg-red-100'
                }`}>
                  {getRoomTypeIcon(room.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Room {room.number}</h3>
                  <p className="text-sm text-gray-500 capitalize">{room.type}</p>
                </div>
              </div>
              <Badge variant={getRoomStatusColor(room.status)}>
                {room.status}
              </Badge>
            </div>

            {room.patient ? (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{room.patient.name}</h4>
                  <Badge variant={room.patient.riskLevel}>
                    {room.patient.riskLevel}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{room.patient.condition}</p>
                <p className="text-xs text-gray-500 mt-1">Age: {room.patient.age}</p>
              </div>
            ) : (
              <div
                className={
                  room.status === 'available'
                    ? 'bg-green-50 rounded-lg p-4 mb-4 text-center'
                    : room.status === 'occupied'
                    ? 'bg-red-50 rounded-lg p-4 mb-4 text-center'
                    : 'bg-yellow-50 rounded-lg p-4 mb-4 text-center'
                }
              >
                {room.status === 'available' && (
                  <>
                    <p className="text-green-800 font-medium">Room Available</p>
                    <p className="text-sm text-green-600">Ready for patient assignment</p>
                  </>
                )}
                {room.status === 'occupied' && (
                  <>
                    <p className="text-red-800 font-medium">Room Occupied</p>
                    <p className="text-sm text-red-600">A patient is currently assigned to this room.</p>
                  </>
                )}
                {room.status === 'maintenance' && (
                  <>
                    <p className="text-yellow-800 font-medium">Room Under Maintenance</p>
                    <p className="text-sm text-yellow-600">This room is being cleaned and is not available.</p>
                  </>
                )}
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Equipment:</p>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(room.equipment) && room.equipment.length > 0 ? (
                  room.equipment.map((item, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400">No equipment listed</span>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              {room.status === 'available' ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedRoom(room);
                    setIsAssignModalOpen(true);
                  }}
                  disabled={availablePatients.length === 0}
                >
                  Assign Patient
                </Button>
              ) : room.status === 'occupied' ? (
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDischargePatient(room.id)}
                >
                  Discharge
                </Button>
              ) : (
                <Button
                  variant="warning"
                  size="sm"
                  className="flex-1"
                  onClick={() => {/* Handle maintenance completion */}}
                >
                  Complete Maintenance
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Assign Patient Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRoom(null);
        }}
        title="Assign Patient to Room"
        size="md"
      >
        {selectedRoom && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Room {selectedRoom.number}</h3>
              <p className="text-sm text-gray-600 capitalize">{selectedRoom.type} room</p>
              <p className="text-sm text-gray-600">Capacity: {selectedRoom.capacity} patients</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Patient:
              </label>
              {patientsLoading ? (
                <p className="text-gray-500 text-center py-4">Loading patients...</p>
              ) : availablePatients.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No patients available for assignment</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availablePatients.map((patient) => (
                    <button
                      key={patient.id}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => handleAssignPatient(selectedRoom.id, patient.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">{patient.condition}</p>
                          <p className="text-xs text-gray-500">Age: {patient.age}</p>
                        </div>
                        <Badge variant={patient.riskLevel}>
                          {patient.riskLevel}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedRoom(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAddForm({ name: '', type: '', status: 'available' });
          setAddError(null);
        }}
        title="Register New Room"
        size="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setAddLoading(true);
            setAddError(null);
            try {
              await axios.post(`${API_BASE_URL}/rooms/`, addForm);
              setIsAddModalOpen(false);
              setAddForm({ name: '', type: '', status: 'available' });
              refreshRooms();
            } catch (err: any) {
              setAddError(err.response?.data?.detail || 'Failed to add room.');
            } finally {
              setAddLoading(false);
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name/Number</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={addForm.type}
              onChange={e => setAddForm(f => ({ ...f, type: e.target.value }))}
              required
            >
              <option value="">Select type</option>
              <option value="delivery">Delivery</option>
              <option value="recovery">Recovery</option>
              <option value="consultation">Consultation</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={addForm.status}
              onChange={e => setAddForm(f => ({ ...f, status: e.target.value }))}
              required
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Cleaning</option>
            </select>
          </div>
          {addError && <div className="text-red-500 text-sm">{addError}</div>}
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setAddForm({ name: '', type: '', status: 'available' });
                setAddError(null);
              }}
              disabled={addLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={addLoading}
            >
              Register Room
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Rooms;
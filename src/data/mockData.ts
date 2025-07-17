import { Patient, Room, Resource, RiskAssessment, InventoryItem, CostItem } from '../types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    age: 28,
    riskLevel: 'high',
    appointmentTime: '2025-01-15T09:00:00',
    status: 'waiting',
    condition: 'Gestational Diabetes',
    lastVisit: '2025-01-10',
    phone: '+1 (555) 123-4567',
    emergencyContact: '+1 (555) 987-6543'
  },
  {
    id: '2',
    name: 'Maria Rodriguez',
    age: 24,
    riskLevel: 'medium',
    appointmentTime: '2025-01-15T10:30:00',
    status: 'in-progress',
    condition: 'Regular Checkup',
    lastVisit: '2025-01-08',
    phone: '+1 (555) 234-5678',
    emergencyContact: '+1 (555) 876-5432'
  },
  {
    id: '3',
    name: 'Emily Chen',
    age: 32,
    riskLevel: 'low',
    appointmentTime: '2025-01-15T11:00:00',
    status: 'waiting',
    condition: 'Prenatal Care',
    lastVisit: '2025-01-12',
    phone: '+1 (555) 345-6789',
    emergencyContact: '+1 (555) 765-4321'
  },
  {
    id: '4',
    name: 'Jessica Williams',
    age: 29,
    riskLevel: 'high',
    appointmentTime: '2025-01-15T14:00:00',
    status: 'waiting',
    condition: 'Preeclampsia',
    lastVisit: '2025-01-13',
    phone: '+1 (555) 456-7890',
    emergencyContact: '+1 (555) 654-3210'
  }
];

export const mockRooms: Room[] = [
  {
    id: '1',
    number: 'D-101',
    type: 'delivery',
    status: 'occupied',
    patient: mockPatients[1],
    capacity: 2,
    equipment: ['Fetal Monitor', 'Delivery Bed', 'Emergency Kit']
  },
  {
    id: '2',
    number: 'D-102',
    type: 'delivery',
    status: 'available',
    capacity: 2,
    equipment: ['Fetal Monitor', 'Delivery Bed', 'Emergency Kit']
  },
  {
    id: '3',
    number: 'C-201',
    type: 'consultation',
    status: 'available',
    capacity: 3,
    equipment: ['Ultrasound Machine', 'Examination Table']
  },
  {
    id: '4',
    number: 'R-301',
    type: 'recovery',
    status: 'occupied',
    patient: mockPatients[0],
    capacity: 1,
    equipment: ['Monitor', 'IV Stand']
  }
];

export const mockResources: Resource[] = [
  {
    id: '1',
    name: 'Registered Nurses',
    type: 'staff',
    available: 12,
    total: 15,
    status: 'adequate',
    cost: 75000
  },
  {
    id: '2',
    name: 'Delivery Beds',
    type: 'equipment',
    available: 3,
    total: 5,
    status: 'low',
    cost: 25000
  },
  {
    id: '3',
    name: 'Fetal Monitors',
    type: 'equipment',
    available: 2,
    total: 8,
    status: 'critical',
    cost: 15000
  },
  {
    id: '4',
    name: 'Medical Supplies',
    type: 'supplies',
    available: 850,
    total: 1000,
    status: 'adequate',
    cost: 12000
  }
];

export const mockRiskAssessments: RiskAssessment[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'Sarah Johnson',
    age: 28,
    gestationalWeek: 32,
    bloodPressure: '150/95',
    heartRate: 85,
    temperature: 98.6,
    complications: ['Gestational Diabetes', 'High Blood Pressure'],
    riskScore: 85,
    riskLevel: 'high',
    recommendations: [
      'Immediate medical attention required',
      'Monitor blood glucose levels hourly',
      'Consider early delivery if condition worsens'
    ],
    assessmentDate: '2025-01-15T08:30:00'
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Maria Rodriguez',
    age: 24,
    gestationalWeek: 28,
    bloodPressure: '120/80',
    heartRate: 75,
    temperature: 98.2,
    complications: [],
    riskScore: 35,
    riskLevel: 'medium',
    recommendations: [
      'Continue regular prenatal care',
      'Monitor fetal movement daily',
      'Schedule next appointment in 2 weeks'
    ],
    assessmentDate: '2025-01-15T10:00:00'
  }
];

export const mockInventory: InventoryItem[] = [
  {
    id: '1',
    name: 'Prenatal Vitamins',
    category: 'Medications',
    stock: 150,
    minStock: 50,
    unitPrice: 25.99,
    supplier: 'MedSupply Co.',
    expiryDate: '2026-06-15',
    status: 'in-stock'
  },
  {
    id: '2',
    name: 'Sterile Gloves',
    category: 'Medical Supplies',
    stock: 25,
    minStock: 100,
    unitPrice: 0.50,
    supplier: 'SafeMed Supplies',
    expiryDate: '2025-12-31',
    status: 'low-stock'
  },
  {
    id: '3',
    name: 'Ultrasound Gel',
    category: 'Medical Supplies',
    stock: 0,
    minStock: 20,
    unitPrice: 12.50,
    supplier: 'MedTech Solutions',
    expiryDate: '2025-08-30',
    status: 'out-of-stock'
  }
];

export const mockCosts: CostItem[] = [
  {
    id: '1',
    category: 'Treatment',
    description: 'Emergency C-Section',
    amount: 8500,
    date: '2025-01-14',
    type: 'treatment'
  },
  {
    id: '2',
    category: 'Medication',
    description: 'Prenatal Medications',
    amount: 450,
    date: '2025-01-14',
    type: 'medication'
  },
  {
    id: '3',
    category: 'Equipment',
    description: 'Fetal Monitor Maintenance',
    amount: 1200,
    date: '2025-01-13',
    type: 'equipment'
  }
];
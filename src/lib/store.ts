// Simple role-based state management
export type UserRole = 'patient' | 'chp' | 'doctor';

export interface MockUser {
  name: string;
  role: UserRole;
  phone: string;
  afyaId: string;
}

export const MOCK_USERS: Record<UserRole, MockUser> = {
  patient: {
    name: 'Amina Wanjiku',
    role: 'patient',
    phone: '+254712345678',
    afyaId: 'AFYA-2024-7891',
  },
  chp: {
    name: 'Joseph Ochieng',
    role: 'chp',
    phone: '+254723456789',
    afyaId: 'CHP-NAIROBI-042',
  },
  doctor: {
    name: 'Dr. Sarah Muthoni',
    role: 'doctor',
    phone: '+254734567890',
    afyaId: 'DOC-KNH-118',
  },
};

export interface MockAlert {
  id: string;
  patientName: string;
  phone: string;
  symptom: string;
  severity: 'critical' | 'high' | 'medium';
  location: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged';
}

export const MOCK_ALERTS: MockAlert[] = [
  {
    id: '1',
    patientName: 'Mary Akinyi',
    phone: '+254711223344',
    symptom: 'Severe bleeding',
    severity: 'critical' as const,
    location: 'Kibera, Nairobi',
    timestamp: new Date(Date.now() - 5 * 60000),
    status: 'pending' as const,
  },
  {
    id: '2',
    patientName: 'John Kamau',
    phone: '+254722334455',
    symptom: 'High fever (39.5°C) for 3 days',
    severity: 'high' as const,
    location: 'Mathare, Nairobi',
    timestamp: new Date(Date.now() - 25 * 60000),
    status: 'acknowledged' as const,
  },
  {
    id: '3',
    patientName: 'Grace Njeri',
    phone: '+254733445566',
    symptom: 'Persistent cough, difficulty breathing',
    severity: 'medium' as const,
    location: 'Dandora, Nairobi',
    timestamp: new Date(Date.now() - 2 * 3600000),
    status: 'pending' as const,
  },
];

export const MOCK_PATIENTS = [
  {
    id: 'UPI-12345',
    name: 'Mary Akinyi',
    phone: '+254711223344',
    age: 28,
    gender: 'Female',
    lastVisit: '2026-03-15',
    records: [
      { date: '2026-03-15', type: 'Observation', code: 'Blood Pressure', value: '130/85 mmHg', hash: 'a3f2b1...' },
      { date: '2026-03-10', type: 'Observation', code: 'Temperature', value: '37.2°C', hash: 'c7d8e9...' },
      { date: '2026-02-28', type: 'Immunization', code: 'Tetanus Booster', value: 'Administered', hash: 'f1a2b3...' },
    ],
  },
  {
    id: 'UPI-67890',
    name: 'John Kamau',
    phone: '+254722334455',
    age: 45,
    gender: 'Male',
    lastVisit: '2026-03-14',
    records: [
      { date: '2026-03-14', type: 'Observation', code: 'Blood Sugar', value: '6.8 mmol/L', hash: 'b4c5d6...' },
      { date: '2026-03-01', type: 'Encounter', code: 'General Checkup', value: 'Normal', hash: 'e7f8a9...' },
    ],
  },
];

export const RAFIKI_RESPONSES: Record<string, string> = {
  'fever': 'Based on your symptoms, ensure you stay hydrated and monitor your temperature. If it exceeds 38.5°C, seek medical attention immediately. Would you like me to alert your nearest CHP?',
  'headache': 'For persistent headaches, rest in a dark quiet room and stay hydrated. If headaches persist for more than 48 hours or are accompanied by vision changes, please visit your nearest health facility.',
  'cough': 'A persistent cough may indicate a respiratory infection. Monitor for difficulty breathing or chest pain. If symptoms worsen, I can trigger a referral to your Community Health Promoter.',
  'default': 'I am Rafiki, your AI health companion. I can help with symptom assessment, medication reminders, and connecting you to healthcare professionals. What symptoms are you experiencing?',
};

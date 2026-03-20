import { Language } from '@/components/msaidizi/MsaidiziProvider';

// Global app translations
export const translations: Record<string, Record<Language, string>> = {
  // Dashboard Common
  'Dashboard': { en: 'Dashboard', sw: 'Paneli' },
  'Welcome': { en: 'Welcome', sw: 'Karibu' },
  'Today': { en: 'Today', sw: 'Leo' },
  'View Details': { en: 'View Details', sw: 'Angalia Maelezo' },
  'Start': { en: 'Start', sw: 'Anza' },
  'Next': { en: 'Next', sw: 'Inayofuata' },
  'Back': { en: 'Back', sw: 'Nyuma' },
  'Cancel': { en: 'Cancel', sw: 'Ghairi' },
  'Save': { en: 'Save', sw: 'Hifadhi' },
  'Delete': { en: 'Delete', sw: 'Futa' },
  'Edit': { en: 'Edit', sw: 'Hariri' },
  'Close': { en: 'Close', sw: 'Funga' },

  // Patient Home
  'Quick Health Check': { en: 'Quick Health Check', sw: 'Uchunguzi wa Haraka wa Afya' },
  'Add Vital Signs': { en: 'Add Vital Signs', sw: 'Ongeza Alama za Maisha' },
  'Blood Pressure': { en: 'Blood Pressure', sw: 'Pressure ya Damu' },
  'Heart Rate': { en: 'Heart Rate', sw: 'Kiwango cha Moyo' },
  'Temperature': { en: 'Temperature', sw: 'Joto' },
  'Blood Sugar': { en: 'Blood Sugar', sw: 'Sukari ya Damu' },
  'Recent Visits': { en: 'Recent Visits', sw: 'Ziara za Hivi Karibuni' },
  'Health Records': { en: 'Health Records', sw: 'Kumbukumbu za Afya' },
  'Medications': { en: 'Medications', sw: 'Dawa' },
  'Allergies': { en: 'Allergies', sw: 'Ukasiringi' },
  'Medical History': { en: 'Medical History', sw: 'Historia ya Kimatibabu' },
  'Book Appointment': { en: 'Book Appointment', sw: 'Chakula Kiti' },
  'Available Doctors': { en: 'Available Doctors', sw: 'Madaktari Anayepatikana' },

  // CHP Dashboard
  'Community Health': { en: 'Community Health Programs', sw: 'Programu za Afya ya Jamii' },
  'Active Patients': { en: 'Active Patients', sw: 'Wagonjwa Wenye Umeme' },
  'Pending Referrals': { en: 'Pending Referrals', sw: 'Maamuzi Yanayosubiri' },
  'Community Outreach': { en: 'Community Outreach', sw: 'Kumfika Jamii' },
  'Schedule Visit': { en: 'Schedule Home Visit', sw: 'Jadwali ya Ziara ya Nyumba' },
  'Report Health': { en: 'Report Health Issue', sw: 'Ripoti ya Suala la Afya' },
  'Create Referral': { en: 'Create Referral', sw: 'Tengeneza Kumbukumbu' },

  // Doctor Dashboard
  'Patient List': { en: 'Patient List', sw: 'Orodha ya Wagonjwa' },
  'My Schedule': { en: 'My Schedule', sw: 'Jadwali Langu' },
  'Consultation': { en: 'Start Consultation', sw: 'Anza Ushauri' },
  'Upload Results': { en: 'Upload Test Results', sw: 'Pakia Matokeo ya Jaribio' },
  'Diagnose': { en: 'Add Diagnosis', sw: 'Ongeza Upimaji' },
  'Prescribe': { en: 'Prescribe Medication', sw: 'Agiza Dawa' },

  // Settings (covered by SettingsPanel)
  'Settings': { en: 'Settings', sw: 'Mipangilio' },
  'Profile': { en: 'Profile', sw: 'Wasifu' },
  'Theme': { en: 'Theme', sw: 'Mandhari' },
  'Language': { en: 'Language', sw: 'Lugha' },
  'Notifications': { en: 'Notifications', sw: 'Arifa' },
  'Privacy': { en: 'Privacy', sw: 'Faragha' },

  // Messages
  'Loading': { en: 'Loading...', sw: 'Inapakia...' },
  'Error': { en: 'An error occurred', sw: 'Kuna hitilafu' },
  'Success': { en: 'Success', sw: 'Kumfanikiwa' },
  'No Data': { en: 'No data available', sw: 'Hakuna data inayopatikana' },

  // Navigation
  'Home': { en: 'Home', sw: 'Nyumbani' },
  'Records': { en: 'Records', sw: 'Kumbukumbu' },
  'Messages': { en: 'Messages', sw: 'Ujumbe' },
  'More': { en: 'More', sw: 'Zaidi' },

  // Login/Role
  'Login': { en: 'Login', sw: 'Ingia' },
  'Select Role': { en: 'Select Your Role', sw: 'Chagua Jukumu Lako' },
  'Patient': { en: 'Patient', sw: 'Mgonjwa' },
  'CHP': { en: 'Community Health Practitioner', sw: 'Mtendaji wa Afya ya Jamii' },
  'Doctor': { en: 'Doctor', sw: 'Daktari' },
  'Phone': { en: 'Phone Number', sw: 'Namba ya Simu' },
  'Enter Phone': { en: 'Enter your phone number', sw: 'Ingiza namba yako ya simu' },
  'Continue': { en: 'Continue', sw: 'Endelea' },

  // Empty States
  'No appointments': { en: 'No upcoming appointments', sw: 'Hakuna miadi inayokuja' },
  'No messages': { en: 'No messages yet', sw: 'Hakuna ujumbe bado' },
  'No records': { en: 'No health records', sw: 'Hakuna kumbukumbu za afya' },

  // Tour Messages
  'Welcome to Dawa': { en: 'Welcome to Dawa Mashinani! Your health, our priority. 🌍', sw: 'Karibu kwa Dawa Mashinani! Afya yako, kipaumbele chetu. 🌍' },
  'Your Vital Signs': { en: 'Track your vital signs here to stay healthy.', sw: 'Fuatilia alama zako za maisha hapa ili kubaki salama.' },
  'Book Appointments': { en: 'Book appointments with available healthcare providers nearby.', sw: 'Chakula kiti na watoaji wa huduma ya afya waliopo karibu.' },
  'Your Health Journey': { en: 'Your complete health journey in one place.', sw: 'Yote kuhusu afya yako mahali panapolingana.' },
};

export const t = (key: string, lang: Language): string => {
  return translations[key]?.[lang] || key;
};

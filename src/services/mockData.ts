import type { AttendanceRecord, QRCode, Announcement } from '../types';

// Real student names from BOOTCAMP-data.csv
const realStudentNames = [
  'ARUNKUMAR A',
  'GOWTHAM C M',
  'HARI PRASATH S',
  'MEETH R',
  'NAVEEN PANDI C',
  'SUJEL RAM S',
  'VIJAYAMURUGAN S',
  'MATTHEWLYNN M',
  'BHARATH KUMAR B',
  'CHENDUR M',
  'DIVYA PRABHA M N',
  'HARINI N',
  'VIGNESH M',
  'V. AJITHKUMAR',
  'ARISURYA VJ',
  'DAKSHA G',
  'R.DARIO FERNANDO',
  'DEEPIKA TAMIL ARASI NV',
  'DHARSHNA SRI.L',
  'EDWIN KOSHY'
];

// Mock attendance records using real student names
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    userId: '23105071',
    userName: 'ARUNKUMAR A',
    department: 'BCA',
    timestamp: new Date('2024-01-15T09:00:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '2',
    userId: '23105083',
    userName: 'GOWTHAM C M',
    department: 'BCA',
    timestamp: new Date('2024-01-15T09:15:00'),
    qrCodeId: 'qr1',
    checkedOut: true,
    checkoutTime: new Date('2024-01-15T17:00:00'),
  },
  {
    id: '3',
    userId: '23105084',
    userName: 'HARI PRASATH S',
    department: 'BCA',
    timestamp: new Date('2024-01-15T09:30:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '4',
    userId: '23105097',
    userName: 'MEETH R',
    department: 'BCA',
    timestamp: new Date('2024-01-15T09:45:00'),
    qrCodeId: 'qr1',
    checkedOut: true,
    checkoutTime: new Date('2024-01-15T16:30:00'),
  },
  {
    id: '5',
    userId: '23105105',
    userName: 'NAVEEN PANDI C',
    department: 'BCA',
    timestamp: new Date('2024-01-15T10:00:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '6',
    userId: '23105128',
    userName: 'SUJEL RAM S',
    department: 'BCA',
    timestamp: new Date('2024-01-15T10:15:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '7',
    userId: '23105130',
    userName: 'VIJAYAMURUGAN S',
    department: 'BCA',
    timestamp: new Date('2024-01-15T10:30:00'),
    qrCodeId: 'qr1',
    checkedOut: true,
    checkoutTime: new Date('2024-01-15T17:15:00'),
  },
  {
    id: '8',
    userId: '23105132',
    userName: 'MATTHEWLYNN M',
    department: 'BCA',
    timestamp: new Date('2024-01-15T10:45:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  }
];

// Mock QR codes
export const mockQRCodes: QRCode[] = [
  {
    id: 'qr1',
    code: 'attendance_session_2024_01_15',
    isActive: true,
    createdAt: new Date('2024-01-15T08:00:00'),
    expiresAt: new Date('2024-01-15T17:00:00'),
    scannedBy: ['23105071', '23105083', '23105084', '23105097', '23105105', '23105128', '23105130', '23105132'],
  },
];

// Mock announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to BCA Bootcamp! 🎓',
    message: 'Welcome all BCA students to the new semester. We have 387 students enrolled across different batches.',
    createdAt: new Date('2024-01-10'),
    isActive: true,
  },
  {
    id: '2',
    title: 'Attendance System Update 📱',
    message: 'New QR-based attendance system is now live. Please scan QR codes for attendance.',
    createdAt: new Date('2024-01-12'),
    isActive: true,
  },
  {
    id: '3',
    title: 'BCA Department Notice 📢',
    message: 'All BCA students please ensure regular attendance. Minimum 75% attendance required.',
    createdAt: new Date('2024-01-14'),
    isActive: true,
  }
];

// Mock attendance service
export const mockAttendanceService = {
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAttendanceRecords;
  },

  markAttendance: async (userId: string, qrCodeId: string): Promise<AttendanceRecord> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find a real student name for the new user
    const studentIndex = parseInt(userId) % realStudentNames.length;
    const studentName = realStudentNames[studentIndex];
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId,
      userName: studentName,
      department: 'BCA', // Assuming all new records are BCA
      timestamp: new Date(),
      qrCodeId,
      checkedOut: false,
    };

    mockAttendanceRecords.push(newRecord);
    return newRecord;
  },

  checkoutUser: async (recordId: string): Promise<AttendanceRecord> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const record = mockAttendanceRecords.find(r => r.id === recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    record.checkedOut = true;
    record.checkoutTime = new Date();
    return record;
  },

  getAttendanceStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const total = mockAttendanceRecords.length;
    const present = mockAttendanceRecords.filter(r => !r.checkedOut).length;
    const checkedOut = mockAttendanceRecords.filter(r => r.checkedOut).length;
    
    return { total, present, checkedOut };
  }
};

// Mock QR code service
export const mockQRService = {
  generateQRCode: async (): Promise<QRCode> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newQR: QRCode = {
      id: Date.now().toString(),
      code: `attendance_session_${Date.now()}`,
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      scannedBy: [],
    };

    mockQRCodes.push(newQR);
    return newQR;
  },

  getActiveQRCodes: async (): Promise<QRCode[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockQRCodes.filter(qr => qr.isActive);
  },

  getQRCodes: async (): Promise<QRCode[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockQRCodes;
  },
};

// Mock announcement service
export const mockAnnouncementService = {
  getAnnouncements: async (): Promise<Announcement[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockAnnouncements.filter(ann => ann.isActive);
  },

  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newAnnouncement: Announcement = {
      ...announcement,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    mockAnnouncements.push(newAnnouncement);
    return newAnnouncement;
  },
};

import type { AttendanceRecord, QRCode, Announcement } from '../types';

// Mock attendance records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'John Doe',
    timestamp: new Date('2024-01-15T09:00:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Jane Smith',
    timestamp: new Date('2024-01-15T09:15:00'),
    qrCodeId: 'qr1',
    checkedOut: true,
    checkoutTime: new Date('2024-01-15T17:00:00'),
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Mike Johnson',
    timestamp: new Date('2024-01-15T09:30:00'),
    qrCodeId: 'qr1',
    checkedOut: false,
  },
  {
    id: '4',
    userId: 'user4',
    userName: 'Sarah Wilson',
    timestamp: new Date('2024-01-15T09:45:00'),
    qrCodeId: 'qr1',
    checkedOut: true,
    checkoutTime: new Date('2024-01-15T16:30:00'),
  },
];

// Mock QR codes
export const mockQRCodes: QRCode[] = [
  {
    id: 'qr1',
    code: 'attendance_session_2024_01_15',
    isActive: true,
    createdAt: new Date('2024-01-15T08:00:00'),
    expiresAt: new Date('2024-01-15T17:00:00'),
    scannedBy: ['user1', 'user2', 'user3', 'user4'],
  },
];

// Mock announcements
export const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Welcome to the new semester!',
    message: 'We hope everyone has a great start to the new academic year.',
    createdAt: new Date('2024-01-10'),
    isActive: true,
  },
  {
    id: '2',
    title: 'Important Update',
    message: 'Please check your email for important course information.',
    createdAt: new Date('2024-01-12'),
    isActive: true,
  },
];

// Mock attendance service
export const mockAttendanceService = {
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAttendanceRecords;
  },

  markAttendance: async (userId: string, qrCodeId: string): Promise<AttendanceRecord> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId,
      userName: `User ${userId}`,
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

  checkoutAllUsers: async (): Promise<AttendanceRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    mockAttendanceRecords.forEach(record => {
      if (!record.checkedOut) {
        record.checkedOut = true;
        record.checkoutTime = new Date();
      }
    });
    
    return mockAttendanceRecords;
  },
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

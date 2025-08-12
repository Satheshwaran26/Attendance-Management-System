import type { User, AttendanceRecord, QRCode, Announcement } from '../types';

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '+1234567890',
    isAdmin: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567891',
    isAdmin: false,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567892',
    isAdmin: false,
    createdAt: new Date('2024-01-03'),
  },
];

// Mock attendance records
export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    userId: '2',
    userName: 'John Doe',
    timestamp: new Date('2024-01-15T09:00:00'),
    qrCodeId: 'qr1',
  },
  {
    id: '2',
    userId: '3',
    userName: 'Jane Smith',
    timestamp: new Date('2024-01-15T09:15:00'),
    qrCodeId: 'qr1',
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
    scannedBy: ['2', '3'],
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
    title: 'Important Update for John Doe',
    message: 'Please check your email for important course information.',
    targetUserId: '2',
    createdAt: new Date('2024-01-12'),
    isActive: true,
  },
];

// Mock authentication service
export const mockAuthService = {
  login: async (email: string, password: string): Promise<User | null> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = mockUsers.find(u => u.email === email);
    if (user && password === 'password') {
      return user;
    }
    return null;
  },

  registerUser: async (userData: Omit<User, 'id' | 'isAdmin' | 'createdAt'>): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      isAdmin: false,
      createdAt: new Date(),
    };
    
    mockUsers.push(newUser);
    return newUser;
  },
};

// Mock attendance service
export const mockAttendanceService = {
  getAttendanceRecords: async (): Promise<AttendanceRecord[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAttendanceRecords;
  },

  markAttendance: async (userId: string, qrCodeId: string): Promise<AttendanceRecord> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      throw new Error('User not found');
    }

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId,
      userName: user.name,
      timestamp: new Date(),
      qrCodeId,
    };

    mockAttendanceRecords.push(newRecord);
    return newRecord;
  },

  getUsers: async (): Promise<User[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockUsers;
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
  getAnnouncements: async (userId?: string): Promise<Announcement[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (userId) {
      return mockAnnouncements.filter(
        ann => ann.isActive && (!ann.targetUserId || ann.targetUserId === userId)
      );
    }
    
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

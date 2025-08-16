export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  qrCodeId: string;
  checkedOut?: boolean;
  checkoutTime?: Date;
}

export interface Student {
  id: string;
  name: string;
  registerNumber: string;
  classYear: string;
  aadharNumber: string;
  phoneNumber: string;
  email?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AttendanceMarking {
  id: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
}

export interface QRCode {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  expiresAt: Date;
  scannedBy?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetUserId?: string;
  targetUserIds?: string[];
  createdAt: Date;
  isActive: boolean;
}

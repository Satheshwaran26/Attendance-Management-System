export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: Date;
  qrCodeId: string;
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRegistration {
  name: string;
  email: string;
  phone: string;
}

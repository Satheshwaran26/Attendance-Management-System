import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { mockAttendanceService, mockQRService } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, QrCode, AlertCircle } from 'lucide-react';

const QRScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      startScanner();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning]);

  const startScanner = () => {
    if (!user) return;

    scannerRef.current = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scannerRef.current.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      () => {
        // Ignore scanning errors
      }
    );
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (!user) return;

    setIsLoading(true);
    setScanResult(decodedText);
    setErrorMessage('');

    try {
      // Find the QR code in our mock data
      const qrCodes = await mockQRService.getActiveQRCodes();
      const qrCode = qrCodes.find(qr => qr.code === decodedText);

      if (!qrCode) {
        throw new Error('Invalid QR code');
      }

      if (!qrCode.isActive) {
        throw new Error('QR code is no longer active');
      }

      if (qrCode.expiresAt < new Date()) {
        throw new Error('QR code has expired');
      }

      // Check if user already scanned this QR code
      if (qrCode.scannedBy?.includes(user.id)) {
        throw new Error('You have already scanned this QR code');
      }

      // Mark attendance
      await mockAttendanceService.markAttendance(user.id, qrCode.id);
      
      // Update QR code to mark as scanned by this user
      if (qrCode.scannedBy) {
        qrCode.scannedBy.push(user.id);
      } else {
        qrCode.scannedBy = [user.id];
      }

      setIsSuccess(true);
      setIsScanning(false);
      
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setScanResult(null);
      }, 3000);

    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setIsSuccess(false);
    setErrorMessage('');
    setScanResult(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Attendance Marked!
            </h2>
            <p className="text-gray-600 mb-4">
              Your attendance has been successfully recorded.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600">
                <strong>Time:</strong> {new Date().toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>QR Code:</strong> {scanResult}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            QR Code Scanner
          </h1>
          <p className="text-gray-600">
            Scan the QR code to mark your attendance
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-8">
          {!isScanning ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-primary-100 mb-6">
                <QrCode className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Ready to Scan
              </h3>
              <p className="text-gray-600 mb-6">
                Click the button below to start scanning QR codes for attendance.
              </p>
              <button
                onClick={startScanning}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <QrCode className="h-5 w-5 mr-2" />
                )}
                Start Scanning
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Scanning QR Code
                </h3>
                <p className="text-gray-600">
                  Position the QR code within the scanner frame
                </p>
              </div>

              <div id="qr-reader" className="w-full max-w-md mx-auto"></div>

              <div className="text-center">
                <button
                  onClick={stopScanning}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Stop Scanning
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to use:
          </h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 text-xs font-medium">1</span>
              </div>
              <p>Click "Start Scanning" to activate your camera</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 text-xs font-medium">2</span>
              </div>
              <p>Point your camera at the QR code displayed by your admin</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 text-xs font-medium">3</span>
              </div>
              <p>Hold steady until the code is scanned</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-primary-600 text-xs font-medium">4</span>
              </div>
              <p>Your attendance will be automatically recorded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

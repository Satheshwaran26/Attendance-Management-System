# Attendance System Backend

Backend API for the Attendance System with Neon database integration and CSV import functionality.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Setup
1. Copy `env.example` to `.env`
2. Add your Neon database connection string:
```env
DATABASE_URL=postgresql://username:password@host/database
PORT=5000
```

### 3. Database Setup
```bash
# Create database tables
npm run setup-db

# Import your BCA CSV data
npm run import-csv
```

### 4. Start Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📊 CSV Import

The system is configured to import your BCA student data from `../src/assets/BCA.csv`.

**CSV Format Expected:**
- S.No
- Name of the Student
- Register Number
- Class & Year
- Aadhar number
- Phone number

**Features:**
- ✅ Automatic table creation
- ✅ Data validation
- ✅ Duplicate prevention
- ✅ Error handling
- ✅ Progress logging

## 🗄️ Database Schema

### Students Table
```sql
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  register_number VARCHAR(50) UNIQUE NOT NULL,
  class_year VARCHAR(100) NOT NULL,
  aadhar_number VARCHAR(20) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  department VARCHAR(100) DEFAULT 'BCA',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Attendance Records Table
```sql
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/search?q=query&year=year` - Search students
- `GET /api/students/register/:registerNumber` - Get student by register number
- `POST /api/students` - Add new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Attendance
- `GET /api/attendance?date=YYYY-MM-DD` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Health
- `GET /api/health` - Server health check

## 📝 Scripts

- `npm run setup-db` - Create database tables
- `npm run import-csv` - Import BCA student data
- `npm run dev` - Start development server
- `npm start` - Start production server

## 🔧 Configuration

### Environment Variables
- `DATABASE_URL` - Neon database connection string
- `PORT` - Server port (default: 5000)

### Neon Database Setup
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Get your connection string
4. Update `.env` file

## 🚨 Troubleshooting

### Common Issues

**CSV Import Fails**
- Check file path: `../src/assets/BCA.csv`
- Verify CSV format matches expected columns
- Ensure database connection is working

**Database Connection Error**
- Verify `DATABASE_URL` in `.env`
- Check Neon database status
- Ensure network connectivity

**Port Already in Use**
- Change `PORT` in `.env`
- Kill existing process on port 5000

## 📱 Frontend Integration

The backend is configured with CORS to work with your React frontend. Update your frontend API calls to use:

```javascript
const API_BASE = 'http://localhost:5000/api';

// Example: Fetch students
const response = await fetch(`${API_BASE}/students`);
const students = await response.json();
```

## 🔒 Security Notes

- **Production**: Use HTTPS and proper authentication
- **Environment**: Keep `.env` file secure and never commit to version control
- **Validation**: All inputs are validated and sanitized
- **CORS**: Configure CORS settings for production domains

## 📈 Performance

- Database indexes for fast queries
- Parameterized queries to prevent SQL injection
- Efficient bulk operations for CSV import
- Connection pooling with Neon serverless driver




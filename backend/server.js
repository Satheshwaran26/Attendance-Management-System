require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://attendances-system.vercel.app',
      'https://attendances-system.vercel.app/',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(null, true); // Temporarily allow all origins for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Connect to database
client.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await client.query('SELECT 1');
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const testResult = await client.query('SELECT COUNT(*) as count FROM students');
    console.log('Test query result:', testResult.rows[0]);
    
    res.json({ 
      success: true, 
      message: 'Database is working',
      studentCount: testResult.rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
    timestamp: new Date().toISOString()
  });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const result = await client.query(`
      SELECT id, name, register_number, class_year, department, is_active, created_at
      FROM students 
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get students stats
app.get('/api/students/stats', async (req, res) => {
  try {
    const [totalResult, activeResult, departmentStats] = await Promise.all([
      client.query('SELECT COUNT(*) as total FROM students'),
      client.query('SELECT COUNT(*) as active FROM students WHERE is_active = true'),
      client.query(`
        SELECT department, COUNT(*) as count 
        FROM students 
        GROUP BY department
        ORDER BY count DESC
      `)
    ]);

    res.json({
      total: parseInt(totalResult.rows[0].total),
      active: parseInt(activeResult.rows[0].active),
      byDepartment: departmentStats.rows
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ error: 'Failed to fetch student statistics' });
  }
});

// Get students by department
app.get('/api/students/department/:department', async (req, res) => {
  try {
    const { department } = req.params;
    const result = await client.query(`
      SELECT id, name, register_number, class_year, department, is_active, created_at
      FROM students 
      WHERE LOWER(department) LIKE LOWER($1)
      ORDER BY name ASC
    `, [`%${department}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students by department:', error);
    res.status(500).json({ error: 'Failed to fetch students by department' });
  }
});

// Get students by year
app.get('/api/students/year/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const result = await client.query(`
      SELECT id, name, register_number, class_year, department, is_active, created_at
      FROM students 
      WHERE class_year = $1
      ORDER BY name ASC
    `, [parseInt(year)]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching students by year:', error);
    res.status(500).json({ error: 'Failed to fetch students by year' });
  }
});

// Get student statistics
app.get('/api/students/stats', async (req, res) => {
  try {
    console.log('Fetching student statistics...');
    
    console.log('Executing total count query...');
    const totalResult = await client.query('SELECT COUNT(*) FROM students');
    console.log('Total result:', totalResult.rows[0]);
    
    console.log('Executing department count query...');
    const deptResult = await client.query('SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY count DESC');
    console.log('Department result rows:', deptResult.rows.length);
    
    console.log('Executing year count query...');
    const yearResult = await client.query('SELECT class_year, COUNT(*) as count FROM students GROUP BY class_year ORDER BY class_year DESC');
    console.log('Year result rows:', yearResult.rows.length);
    
    const stats = {
      total: parseInt(totalResult.rows[0].count),
      byDepartment: Object.fromEntries(deptResult.rows.map(row => [row.department, parseInt(row.count)])),
      byYear: Object.fromEntries(yearResult.rows.map(row => [row.class_year, parseInt(row.count)]))
    };
    
    console.log('Final stats object:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching student statistics:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch student statistics', details: error.message });
  }
});

// Add new student
app.post('/api/students', async (req, res) => {
  try {
    const { name, register_number, class_year, department, aadhar_number, phone_number, email } = req.body;
    
    // Validate required fields
    if (!name || !register_number || !class_year || !department) {
      return res.status(400).json({ error: 'Name, register number, class year, and department are required' });
    }
    
    // Check if register number already exists
    const existingResult = await client.query(
      'SELECT id FROM students WHERE register_number = $1',
      [register_number]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Student with this register number already exists' });
    }
    
    // Insert new student
    const result = await client.query(`
      INSERT INTO students (name, register_number, class_year, department, aadhar_number, phone_number, email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `, [name, register_number, class_year, department, aadhar_number || '', phone_number || '', email || '']);
    
    console.log('New student added:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding student:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

// Search students
app.get('/api/students/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const result = await client.query(`
      SELECT id, name, register_number, class_year, department, is_active, created_at
      FROM students 
      WHERE LOWER(name) LIKE LOWER($1) 
         OR LOWER(register_number) LIKE LOWER($1)
         OR LOWER(department) LIKE LOWER($1)
      ORDER BY name ASC
    `, [`%${q}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

// Check if attendance exists for a student on a specific date
app.get('/api/attendance/check', async (req, res) => {
  try {
    const { student_id, date } = req.query;
    
    if (!student_id || !date) {
      return res.status(400).json({ error: 'Student ID and date are required' });
    }
    
    const result = await client.query(`
      SELECT * FROM attendance 
      WHERE student_id = $1 AND date = $2
    `, [student_id, date]);
    
    if (result.rows.length > 0) {
      const record = result.rows[0];
      // Check if the student has been checked out (has check_out_time)
      const isCheckedOut = record.check_out_time !== null;
      
      res.json({ 
        exists: true, 
        record: record,
        isCheckedOut: isCheckedOut,
        canMarkPresent: isCheckedOut // Can mark present again if checked out
      });
    } else {
      res.json({ 
        exists: false, 
        record: null,
        isCheckedOut: false,
        canMarkPresent: true
      });
    }
  } catch (error) {
    console.error('Error checking attendance:', error);
    res.status(500).json({ error: 'Failed to check attendance' });
  }
});

// Mark attendance
app.post('/api/attendance', async (req, res) => {
  try {
    const { student_id, date, status, check_in_time, notes } = req.body;
    
    console.log('Marking attendance:', { student_id, date, status, check_in_time, notes });
    
    // Check if record already exists for this student and date
    const existingResult = await client.query(`
      SELECT * FROM attendance 
      WHERE student_id = $1 AND date = $2
    `, [student_id, date]);
    
    if (existingResult.rows.length > 0) {
      const record = existingResult.rows[0];
      
      // If student has been checked out, allow them to be marked present again (re-registration)
      if (record.check_out_time) {
        console.log(`Student ${student_id} was checked out, allowing re-registration`);
        
        // Create a NEW attendance record for re-registration
        // This preserves the original session data
        const result = await client.query(`
          INSERT INTO attendance (student_id, date, status, check_in_time, notes)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [student_id, date, status, check_in_time, notes]);
        
        console.log('Re-registration record created:', result.rows[0]);
        return res.status(201).json(result.rows[0]);
      } else {
        // Student is already present and not checked out
        console.log(`Student ${student_id} is already present and not checked out`);
        return res.status(400).json({ error: 'Student is already present and not checked out' });
      }
    }
    
    // Create new record if none exists (first time registration)
    console.log(`Creating new attendance record for student ${student_id}`);
    const result = await client.query(`
      INSERT INTO attendance (student_id, date, status, check_in_time, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [student_id, date, status, check_in_time, notes]);
    
    console.log('New attendance record created:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance records
app.get('/api/attendance', async (req, res) => {
  try {
    const { date } = req.query;
    let query = 'SELECT * FROM attendance';
    let params = [];
    
    if (date) {
      query += ' WHERE DATE(date) = $1';
      params.push(date);
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await client.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});

// Checkout student (update check_out_time)
app.put('/api/attendance/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out_time, session } = req.body;
    
    console.log(`Attempting to checkout attendance record ${id} with session ${session}`);
    
    // Validate session value
    if (session && !['session1', 'session2'].includes(session)) {
      return res.status(400).json({ error: "Invalid session. Must be 'session1' or 'session2'" });
    }
    
    // Update the attendance record with check_out_time and session
    const result = await client.query(`
      UPDATE attendance 
      SET check_out_time = $1, session = $2
      WHERE id = $3
      RETURNING *
    `, [check_out_time, session, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    
    console.log(`Successfully checked out record ${id}:`, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error checking out student:', error);
    console.error('Error details:', {
      id: req.params.id,
      check_out_time: req.body.check_out_time,
      session: req.body.session,
      errorMessage: error.message,
      errorCode: error.code
    });
    res.status(500).json({ 
      error: "Failed to checkout student",
      details: error.message 
    });
  }
});

// Batch checkout endpoint
app.post('/api/attendance/batch-checkout', async (req, res) => {
  try {
    const { records } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    const results = [];
    
    for (const record of records) {
      try {
        const result = await client.query(`
          UPDATE attendance 
          SET check_out_time = $1, session = $2
          WHERE id = $3
          RETURNING *
        `, [record.check_out_time, record.session, record.id]);
        
        if (result.rows.length > 0) {
          results.push(result.rows[0]);
        }
      } catch (error) {
        console.error(`Error checking out record ${record.id}:`, error);
      }
    }
    
    res.json({ 
      message: `Successfully checked out ${results.length} students`,
      checkedOutCount: results.length,
      results: results
    });
  } catch (error) {
    console.error('Error during batch checkout:', error);
    res.status(500).json({ error: 'Failed to process batch checkout' });
  }
});

// Delete entire session endpoint
app.delete('/api/attendance/delete-session', async (req, res) => {
  try {
    const { date, session } = req.body;
    
    console.log('Received delete session request:', { date, session, body: req.body });
    
    if (!date || !session) {
      console.log('Missing required fields:', { date: !!date, session: !!session });
      return res.status(400).json({ error: 'Date and session are required' });
    }
    
    if (!['session1', 'session2'].includes(session)) {
      console.log('Invalid session value:', session);
      return res.status(400).json({ error: "Invalid session. Must be 'session1' or 'session2'" });
    }
    
    console.log(`Attempting to delete ${session} for date ${date}`);
    
    // First, let's check what records exist for this date and session
    const checkQuery = `
      SELECT COUNT(*) as count, 
             MIN(check_in_time) as min_time, 
             MAX(check_in_time) as max_time,
             MIN(DATE(check_in_time)) as min_date,
             MAX(DATE(check_in_time)) as max_date
      FROM attendance 
      WHERE session = $1
    `;
    
    const checkResult = await client.query(checkQuery, [session]);
    console.log('Records found for session:', checkResult.rows[0]);
    
    // Let's also check what happens when we try to match the exact date
    const testQuery = `
      SELECT COUNT(*) as count, 
             MIN(check_in_time) as min_time,
             MIN(DATE(check_in_time)) as min_date
      FROM attendance 
      WHERE EXTRACT(YEAR FROM check_in_time) = EXTRACT(YEAR FROM $1::date) 
        AND EXTRACT(MONTH FROM check_in_time) = EXTRACT(MONTH FROM $1::date)
        AND EXTRACT(DAY FROM check_in_time) = EXTRACT(DAY FROM $1::date)
        AND session = $2
    `;
    
    const testResult = await client.query(testQuery, [date, session]);
    console.log('Test query result for exact date match:', testResult.rows[0]);
    
    // Delete all attendance records for the specific date and session
    // Use a simpler date comparison method
    const result = await client.query(`
      DELETE FROM attendance 
      WHERE TO_CHAR(check_in_time, 'YYYY-MM-DD') = $1 AND session = $2
    `, [date, session]);
    
    // Get the count of deleted records from the result
    const deletedCount = result.rowCount;
    
    console.log(`Successfully deleted ${deletedCount} records for ${session} on ${date}`);
    
    res.json({ 
      message: `Successfully deleted ${deletedCount} records for ${session} on ${date}`,
      deletedCount: deletedCount,
      date: date,
      session: session
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ 
      error: 'Failed to delete session',
      details: error.message 
    });
  }
});

// Delete both sessions for a specific date endpoint
app.delete('/api/attendance/delete-date', async (req, res) => {
  try {
    const { date } = req.body;
    
    console.log('Received delete date request:', { date, body: req.body });
    
    if (!date) {
      console.log('Missing required field: date');
      return res.status(400).json({ error: 'Date is required' });
    }
    
    console.log(`Attempting to delete all sessions for date ${date}`);
    
    // First, let's check what records exist for this date
    const checkQuery = `
      SELECT COUNT(*) as total_count,
             COUNT(CASE WHEN session = 'session1' THEN 1 END) as session1_count,
             COUNT(CASE WHEN session = 'session2' THEN 1 END) as session2_count
      FROM attendance 
      WHERE TO_CHAR(check_in_time, 'YYYY-MM-DD') = $1
    `;
    
    const checkResult = await client.query(checkQuery, [date]);
    console.log('Records found for date:', checkResult.rows[0]);
    
    // Let's also check what dates are actually in the database
    const debugQuery = `
      SELECT DISTINCT TO_CHAR(check_in_time, 'YYYY-MM-DD') as db_date,
             COUNT(*) as record_count
      FROM attendance 
      GROUP BY TO_CHAR(check_in_time, 'YYYY-MM-DD')
      ORDER BY db_date DESC
      LIMIT 5
    `;
    
    const debugResult = await client.query(debugQuery);
    console.log('Available dates in database:', debugResult.rows);
    
    // Delete all attendance records for the specific date (both sessions)
    const result = await client.query(`
      DELETE FROM attendance 
      WHERE TO_CHAR(check_in_time, 'YYYY-MM-DD') = $1
    `, [date]);
    
    const deletedCount = result.rowCount;
    
    console.log(`Successfully deleted ${deletedCount} records for date ${date}`);
    
    res.json({ 
      message: `Successfully deleted ${deletedCount} records for date ${date}`,
      deletedCount: deletedCount,
      date: date,
      session1Count: parseInt(checkResult.rows[0].session1_count),
      session2Count: parseInt(checkResult.rows[0].session2_count)
    });
  } catch (error) {
    console.error('Error deleting date:', error);
    res.status(500).json({ 
      error: 'Failed to delete date',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await client.end();
    process.exit(0);
});

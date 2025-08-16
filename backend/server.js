require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { neon } = require("./node_modules/@neondatabase/serverless");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection middleware
const checkDatabaseConnection = (req, res, next) => {
  if (!dbConnected || !sql) {
    return res.status(503).json({ 
      error: "Database connection not available",
      message: "Please try again in a few moments"
    });
  }
  next();
};

// Database connection with retry mechanism
let sql;
let dbConnected = false;

const initializeDatabase = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create connection with timeout configuration
    sql = neon(process.env.DATABASE_URL, {
      // Add connection timeout options if available
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
      }
    });
    
    // Test the connection
    await sql("SELECT 1");
    dbConnected = true;
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    dbConnected = false;
  }
};

// Initialize database on startup
initializeDatabase();

// Retry database connection every 30 seconds if disconnected
setInterval(async () => {
  if (!dbConnected) {
    console.log("🔄 Attempting to reconnect to database...");
    await initializeDatabase();
  }
}, 30000);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Attendance System Backend Running",
    database: dbConnected ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Get all students
app.get("/api/students", checkDatabaseConnection, async (req, res) => {
  try {
    const students = await sql("SELECT * FROM students ORDER BY name");
    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    
    // Check if it's a database connection error
    if (error.message && error.message.includes('fetch failed')) {
      res.status(503).json({ 
        error: "Database connection error",
        message: "Unable to connect to database. Please try again."
      });
    } else {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  }
});

// Get student by register number
app.get("/api/students/register/:registerNumber", async (req, res) => {
  try {
    const { registerNumber } = req.params;
    const students = await sql(
      "SELECT * FROM students WHERE register_number = $1",
      [registerNumber]
    );
    
    if (students.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    res.json(students[0]);
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

// Add new student
app.post("/api/students", async (req, res) => {
  try {
    const { name, register_number, class_year, aadhar_number, phone_number, email, department } = req.body;
    
    const result = await sql(`
      INSERT INTO students (name, register_number, class_year, aadhar_number, phone_number, email, department)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, register_number, class_year, aadhar_number, phone_number, email, department]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error adding student:", error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ error: "Student with this register number already exists" });
    } else {
      res.status(500).json({ error: "Failed to add student" });
    }
  }
});

// Update student
app.put("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, register_number, class_year, aadhar_number, phone_number, email, department, is_active } = req.body;
    
    const result = await sql(`
      UPDATE students 
      SET name = $1, register_number = $2, class_year = $3, aadhar_number = $4, 
          phone_number = $5, email = $6, department = $7, is_active = $8
      WHERE id = $9
      RETURNING *
    `, [name, register_number, class_year, aadhar_number, phone_number, email, department, is_active, id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql("DELETE FROM students WHERE id = $1 RETURNING *", [id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// Search students
app.get("/api/students/search", async (req, res) => {
  try {
    const { q, year, register_number } = req.query;
    let query = "SELECT * FROM students WHERE 1=1";
    let params = [];
    let paramCount = 0;
    
    if (register_number) {
      // Exact match for register number
      paramCount++;
      query += ` AND register_number = $${paramCount}`;
      params.push(register_number);
    } else if (q) {
      // General search
      paramCount++;
      query += ` AND (name ILIKE $${paramCount} OR register_number ILIKE $${paramCount} OR aadhar_number ILIKE $${paramCount})`;
      params.push(`%${q}%`);
    }
    
    if (year && year !== 'all') {
      paramCount++;
      query += ` AND class_year = $${paramCount}`;
      params.push(year);
    }
    
    query += " ORDER BY name";
    
    const students = await sql(query, params);
    res.json(students);
  } catch (error) {
    console.error("Error searching students:", error);
    res.status(500).json({ error: "Failed to search students" });
  }
});

// Get attendance records
app.get("/api/attendance", checkDatabaseConnection, async (req, res) => {
  try {
    const { date } = req.query;
    let query = "SELECT * FROM attendance_records";
    let params = [];
    
    if (date) {
      query += " WHERE DATE(date) = $1";
      params.push(date);
    }
    
    query += " ORDER BY date DESC";
    
    const records = await sql(query, params);
    res.json(records);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    
    // Check if it's a database connection error
    if (error.message && error.message.includes('fetch failed')) {
      res.status(503).json({ 
        error: "Database connection error",
        message: "Unable to connect to database. Please try again."
      });
    } else {
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  }
});

// Check if attendance exists for a student on a specific date
app.get("/api/attendance/check", async (req, res) => {
  try {
    const { student_id, date } = req.query;
    
    if (!student_id || !date) {
      return res.status(400).json({ error: "Student ID and date are required" });
    }
    
    const existing = await sql(
      "SELECT * FROM attendance_records WHERE student_id = $1 AND DATE(date) = $2",
      [student_id, date]
    );
    
    if (existing.length > 0) {
      const record = existing[0];
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
    console.error("Error checking attendance:", error);
    res.status(500).json({ error: "Failed to check attendance" });
  }
});

// Mark attendance
app.post("/api/attendance", async (req, res) => {
  try {
    const { student_id, date, status, notes, check_in_time } = req.body;
    
    // Check if record already exists for this student and date
    const existing = await sql(
      "SELECT * FROM attendance_records WHERE student_id = $1 AND DATE(date) = $2",
      [student_id, date]
    );
    
    if (existing.length > 0) {
      const record = existing[0];
      
      // If student has been checked out, allow them to be marked present again
      if (record.check_out_time) {
        // Update the existing record with new check-in time and clear check-out time
        const result = await sql(`
          UPDATE attendance_records 
          SET check_in_time = $1, check_out_time = NULL, notes = $2
          WHERE id = $3
          RETURNING *
        `, [check_in_time, notes, record.id]);
        
        return res.status(200).json(result[0]);
      } else {
        // Student is already present and not checked out
        return res.status(400).json({ error: "Student is already present and not checked out" });
      }
    }
    
    // Create new record if none exists
    const result = await sql(`
      INSERT INTO attendance_records (student_id, date, status, notes, check_in_time)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [student_id, date, status, notes, check_in_time]);
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

// Checkout student (update check_out_time)
app.put("/api/attendance/:id/checkout", async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out_time, session } = req.body;
    
    console.log(`Attempting to checkout attendance record ${id} with session ${session}`);
    
    // Validate session value
    if (session && !['session1', 'session2'].includes(session)) {
      return res.status(400).json({ error: "Invalid session. Must be 'session1' or 'session2'" });
    }
    
    // Update the attendance record with check_out_time and session
    const result = await sql(`
      UPDATE attendance_records 
      SET check_out_time = $1, session = $2
      WHERE id = $3
      RETURNING *
    `, [check_out_time, session, id]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: "Attendance record not found" });
    }
    
    console.log(`Successfully checked out record ${id}:`, result[0]);
    res.json(result[0]);
  } catch (error) {
    console.error("Error checking out student:", error);
    console.error("Error details:", {
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

// Delete all attendance data endpoint
app.delete("/api/attendance/all", checkDatabaseConnection, async (req, res) => {
  try {
    console.log("Deleting all attendance records...");
    
    // Delete all records from attendance_records table
    const result = await sql(`DELETE FROM attendance_records RETURNING *`);
    
    console.log(`Deleted ${result.length} attendance records`);
    res.json({ 
      message: `Successfully deleted ${result.length} attendance records`,
      deletedCount: result.length 
    });
  } catch (error) {
    console.error("Error deleting all attendance data:", error);
    
    // Check if it's a database connection error
    if (error.message && error.message.includes('fetch failed')) {
      res.status(503).json({ 
        error: "Database connection error",
        message: "Unable to connect to database. Please try again."
      });
    } else {
      res.status(500).json({ error: "Failed to delete all attendance data" });
    }
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

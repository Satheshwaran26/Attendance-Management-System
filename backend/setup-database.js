require("dotenv").config();
const { neon } = require("./node_modules/@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log("🔧 Setting up database tables...");
    
    // Drop and recreate students table to ensure correct structure
    await sql("DROP TABLE IF EXISTS students CASCADE");
    await sql(`
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
      )
    `);
    console.log("✅ Students table created/verified");
    
    // Create attendance_records table
    await sql(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        session VARCHAR(20) CHECK (session IN ('session1', 'session2')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Attendance records table created/verified");
    
    // Create index for better performance
    await sql(`
      CREATE INDEX IF NOT EXISTS idx_attendance_student_date 
      ON attendance_records(student_id, date)
    `);
    console.log("✅ Database indexes created/verified");
    
    console.log("🎉 Database setup completed successfully!");
    console.log("📊 You can now run: npm run import-csv");
    
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    process.exit();
  }
})();

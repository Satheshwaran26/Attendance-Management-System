const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Drop existing attendance table to fix schema issues
    await client.query('DROP TABLE IF EXISTS attendance CASCADE');
    console.log('Dropped existing attendance table');

    // Create students table with support for all departments
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        register_number VARCHAR(50) UNIQUE NOT NULL,
        class_year INTEGER NOT NULL,
        department VARCHAR(100) NOT NULL,
        aadhar_number VARCHAR(20) DEFAULT '',
        phone_number VARCHAR(20) DEFAULT '',
        email VARCHAR(255) DEFAULT '',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create attendance table with correct schema
    await client.query(`
      CREATE TABLE attendance (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'present',
        session VARCHAR(20) CHECK (session IN ('session1', 'session2')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create QR codes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) UNIQUE NOT NULL,
        student_id INTEGER REFERENCES students(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully');

    // Check if students table has data
    const studentCount = await client.query('SELECT COUNT(*) FROM students');
    console.log(`📊 Current students in database: ${studentCount.rows[0].count}`);

    if (studentCount.rows[0].count === 0) {
      console.log('💡 No students found. Run "npm run import-csv" to import student data.');
    } else {
      // Show department breakdown
      const deptBreakdown = await client.query('SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY count DESC');
      console.log('\n🏫 Department breakdown:');
      deptBreakdown.rows.forEach(dept => {
        console.log(`   ${dept.department}: ${dept.count} students`);
      });
    }

    await client.end();
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    await client.end();
  }
}

setupDatabase();

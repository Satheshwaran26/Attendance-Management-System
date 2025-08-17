require("dotenv").config();
const { Client } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function importCSV() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Drop existing table and recreate for clean import
    await client.query('DROP TABLE IF EXISTS students CASCADE');
    
    // Create students table with proper structure
    await client.query(`
      CREATE TABLE students (
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

    console.log('Students table created');

    const students = [];
    let totalCount = 0;
    let departmentCounts = {};

    // Read and process CSV file
    fs.createReadStream('BOOTCAMP-data.csv')
      .pipe(csv())
      .on('data', (row) => {
        // Skip empty rows
        if (!row['Name of the Student'] || !row['Register Number'] || !row['Department']) {
          return;
        }

        const name = row['Name of the Student'].trim();
        const registerNumber = row['Register Number'].trim();
        const department = row['Department'].trim();

        // Skip if any required field is empty
        if (!name || !registerNumber || !department) {
          return;
        }

        // Extract year from register number (first 2 digits)
        const yearMatch = registerNumber.match(/^(\d{2})/);
        const classYear = yearMatch ? parseInt(yearMatch[1]) : 25; // Default to 25 if can't parse

        // Count by department
        if (!departmentCounts[department]) {
          departmentCounts[department] = 0;
        }
        departmentCounts[department]++;

        students.push({
          name,
          register_number: registerNumber,
          class_year: classYear,
          department
        });

        totalCount++;
      })
      .on('end', async () => {
        console.log(`\n📊 Processing ${totalCount} students from CSV...`);

        // Insert all students
        for (const student of students) {
          try {
            await client.query(`
              INSERT INTO students (name, register_number, class_year, department)
              VALUES ($1, $2, $3, $4)
            `, [student.name, student.register_number, student.class_year, student.department]);
          } catch (error) {
            if (error.code === '23505') { // Unique constraint violation
              console.log(`⚠️  Duplicate register number: ${student.register_number} - Skipping`);
            } else {
              console.error(`❌ Error inserting ${student.name}:`, error.message);
            }
          }
        }

        // Display final statistics
        console.log('\n🎉 Import completed successfully!');
        console.log(`📈 Total students imported: ${totalCount}`);
        console.log('\n📋 Department Breakdown:');
        
        for (const [dept, count] of Object.entries(departmentCounts)) {
          console.log(`   ${dept}: ${count} students`);
        }

        await client.end();
      });

  } catch (error) {
    console.error('❌ Error:', error);
    await client.end();
  }
}

importCSV();

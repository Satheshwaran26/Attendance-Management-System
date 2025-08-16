require("dotenv").config();
const fs = require("fs");
const csv = require("csv-parser");
const { neon } = require("./node_modules/@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  let rows = [];
  
  // Create students table if it doesn't exist
  try {
    await sql(`
      CREATE TABLE IF NOT EXISTS students (
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
  } catch (error) {
    console.error("❌ Error creating table:", error);
    return;
  }

  fs.createReadStream("../src/assets/BCA.csv")
    .pipe(csv())
    .on("data", (row) => {
      // Map CSV columns to our database fields
      rows.push({
        name: row['Name of the Student'],
        register_number: row['Register Number'],
        class_year: row['Class & Year'],
        aadhar_number: row['Aadhar number'],
        phone_number: row['Phone number']
      });
    })
    .on("end", async () => {
      console.log(`📊 Read ${rows.length} rows from CSV`);
      
      try {
        // Clear existing data (optional - remove if you want to keep existing)
        await sql("DELETE FROM students");
        console.log("🗑️  Cleared existing students data");
        
        // Insert new data
        for (const row of rows) {
          await sql(`
            INSERT INTO students (name, register_number, class_year, aadhar_number, phone_number)
            VALUES ($1, $2, $3, $4, $5)
          `, [row.name, row.register_number, row.class_year, row.aadhar_number, row.phone_number]);
        }
        
        console.log("✅ Bulk insert completed successfully!");
        console.log(`📈 Inserted ${rows.length} students into database`);
      } catch (error) {
        console.error("❌ Error during bulk insert:", error);
      }
      
      process.exit();
    })
    .on("error", (error) => {
      console.error("❌ Error reading CSV:", error);
      process.exit(1);
    });
})();

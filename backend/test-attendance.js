require("dotenv").config();
const { neon } = require("./node_modules/@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  try {
    console.log("Creating test attendance record...");
    
    // First, let's check if we have students
    const students = await sql("SELECT * FROM students LIMIT 1");
    console.log("Students found:", students.length);
    
    if (students.length > 0) {
      const student = students[0];
      console.log("Using student:", student.name);
      
      // Create a test attendance record
      const result = await sql(`
        INSERT INTO attendance_records (student_id, date, status, check_in_time, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [student.id, new Date().toISOString().split('T')[0], 'present', new Date().toISOString(), 'Test record']);
      
      console.log("Created attendance record:", result[0]);
      
      // Now test checkout
      const checkoutResult = await sql(`
        UPDATE attendance_records 
        SET check_out_time = $1, session = $2
        WHERE id = $3
        RETURNING *
      `, [new Date().toISOString(), 'session1', result[0].id]);
      
      console.log("Checkout result:", checkoutResult[0]);
    } else {
      console.log("No students found");
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit();
  }
})();






require("dotenv").config();
const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  console.log('📡 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    console.log('💡 Make sure you have a .env file with your database connection string.');
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Attempting to connect...');
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL database!');
    
    // Test a simple query
    console.log('🧪 Testing basic query...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    console.log('📊 Query result:', result.rows[0]);
    
    // Test if students table exists
    try {
      const tableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'students'
        );
      `);
      console.log('📋 Students table exists:', tableCheck.rows[0].exists);
      
      if (tableCheck.rows[0].exists) {
        const countResult = await client.query('SELECT COUNT(*) as student_count FROM students');
        console.log('👥 Total students:', countResult.rows[0].student_count);
      }
    } catch (tableError) {
      console.log('⚠️  Could not check students table:', tableError.message);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('🔍 Full error:', error);
  } finally {
    await client.end();
    console.log('🔌 Connection closed.');
  }
}

testConnection();

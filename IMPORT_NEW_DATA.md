# Import New Bootcamp Data

## 📊 New Data Structure
Your new `BOOTCAMP-data.csv` file contains:
- **Total Students**: 387 BCA students
- **Columns**: S.No, Name of the Student, Register Number, Department
- **Batches**: 2023-2024, 2024-2025, 2025-2026 (based on register numbers)

## 🚀 How to Import

### Option 1: Using the Import Script (Recommended)
1. Navigate to the backend directory:
   ```bash
   cd attendances_system/backend
   ```

2. Make sure your `.env` file has the correct `DATABASE_URL`

3. Run the import script:
   ```bash
   npm run import-csv
   ```

### Option 2: Manual Import
1. Copy `BOOTCAMP-data.csv` to the backend directory
2. Update the database manually using your preferred method

## 🔄 What Gets Updated

### Database Changes:
- ✅ **Students Table**: Cleared and repopulated with new data
- ✅ **Student Names**: Real names from your bootcamp
- ✅ **Register Numbers**: Actual student IDs
- ✅ **Class Years**: Automatically calculated from register numbers
- ✅ **Department**: Set to 'BCA' for all students

### Frontend Updates:
- ✅ **Dashboard**: Shows correct student count (387)
- ✅ **Mock Data**: Uses real student names
- ✅ **Statistics**: Realistic attendance numbers
- ✅ **Announcements**: BCA-specific content

## 📋 Sample Imported Data
```
- ARUNKUMAR A (23105071) - 2023-2024 - BCA
- GOWTHAM C M (23105083) - 2023-2024 - BCA
- HARI PRASATH S (23105084) - 2023-2024 - BCA
- BHARATH KUMAR B (24105010) - 2024-2025 - BCA
- ADHAVAN R M (25105002) - 2025-2026 - BCA
```

## ⚠️ Important Notes
- **Existing Data**: All previous student data will be replaced
- **Backup**: Consider backing up your database before import
- **Testing**: Test the system after import to ensure everything works

## 🎯 After Import
1. **Test Frontend**: Verify dashboard shows correct numbers
2. **Test Backend**: Check `/api/students` endpoint
3. **Test Attendance**: Try marking attendance for new students
4. **Deploy**: Update your production system if needed

## 🆘 Troubleshooting
If you encounter issues:
1. Check database connection in `.env`
2. Verify CSV file path in import script
3. Check console logs for error messages
4. Ensure database has proper permissions

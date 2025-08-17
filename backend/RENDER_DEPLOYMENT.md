# Render Backend Deployment Guide

## Prerequisites
- Render account (free tier available)
- Neon database (or any PostgreSQL database)
- Your frontend already deployed on Vercel

## Deployment Steps

### 1. Connect Your Repository
1. Go to [render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Select the `attendances_system/backend` directory

### 2. Configure the Service
- **Name**: `attendance-system-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

### 3. Environment Variables
Add these environment variables in Render:

```
DATABASE_URL=your_neon_database_connection_string
NODE_ENV=production
PORT=5000
```

### 4. Deploy
Click "Create Web Service" and wait for deployment.

### 5. Update Frontend
Your frontend components are already configured to use:
- **Development**: `http://localhost:5000/api`
- **Production**: `https://attendance-management-system-z2cc.onrender.com/api`

## Important Notes

- The free tier of Render will spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds
- Your health check endpoint `/api/health` will help Render monitor the service
- Make sure your Neon database allows connections from Render's IP addresses

## Testing
After deployment, test your backend:
```
https://attendance-management-system-z2cc.onrender.com/api/health
```

You should see:
```json
{
  "status": "OK",
  "message": "Attendance System Backend Running",
  "database": "Connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

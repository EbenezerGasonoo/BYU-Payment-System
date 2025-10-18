# 🍃 MongoDB Setup for Windows

MongoDB is not detected on your system. Follow these steps to install it:

## Quick Installation (Windows)

### Option 1: MongoDB Community Server (Recommended)

1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select: Windows
   - Click "Download"

2. **Install MongoDB**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - **Important:** Check "Install MongoDB as a Service"
   - Leave default settings

3. **Verify Installation**
   - Open a new PowerShell/Terminal window
   - Run: `mongosh`
   - You should see the MongoDB shell
   - Type `exit` to quit

### Option 2: MongoDB Atlas (Cloud - Free)

If you prefer not to install MongoDB locally:

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free cluster (M0)
4. Get your connection string
5. Update `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/byu_virtual
   ```

## Verify MongoDB is Running

After installation, test the connection:

```bash
# Open PowerShell/Terminal
mongosh

# You should see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb://127.0.0.1:27017
# Using MongoDB: x.x.x

# Type 'exit' to quit
exit
```

## Alternative: Use Docker (If you have Docker)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## After MongoDB is Running

1. Start the backend:
   ```bash
   cd "I:\Projects\BYU Payment System\backend"
   npm run dev
   ```

2. You should see:
   ```
   ✅ MongoDB connected successfully
   ```

## Troubleshooting

### MongoDB Service Not Starting

1. Open "Services" (Win + R → services.msc)
2. Find "MongoDB Server"
3. Right-click → Start

### Connection Error

If you see "MongoNetworkError":
- Make sure MongoDB service is running
- Check if port 27017 is available
- Try restarting your computer

### Still Not Working?

Use MongoDB Atlas (cloud database):
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update MONGODB_URI in backend/.env

---

**Note:** The application cannot start without MongoDB. Please install it before proceeding.


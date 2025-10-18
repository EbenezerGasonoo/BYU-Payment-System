# 📡 Network Access Guide

## Your Network URLs

### Frontend (React App)
- **Local**: http://localhost:5173
- **Network**: http://192.168.100.9:5173

### Backend (API)
- **Local**: http://localhost:3000
- **Network**: http://192.168.100.9:3000

## 📱 Access from Mobile Device

1. **Make sure your mobile device is on the same WiFi network**
2. **Open browser on your phone**
3. **Go to**: http://192.168.100.9:5173

## 🔥 Restart Servers with Network Access

### Stop Current Servers:
- Press `Ctrl + C` in both terminal windows (backend and frontend)

### Start Backend (with network access):
```bash
cd "I:\Projects\BYU Payment System\backend"
npm run dev
```

### Start Frontend (with network access):
```bash
cd "I:\Projects\BYU Payment System\frontend"
npm run dev
```

The frontend will now show:
```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.100.9:5173/
```

## 🛡️ Firewall Notes

If you can't access from other devices:

### Windows Firewall:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature"
3. Make sure Node.js is allowed for both Private and Public networks

Or run this in PowerShell as Administrator:
```powershell
netsh advfirewall firewall add rule name="Node.js Server" dir=in action=allow protocol=TCP localport=3000,5173
```

## 📱 Testing

1. **On your phone, open**: http://192.168.100.9:5173
2. **You should see the beautiful BYU Payment System!**
3. All features will work the same as on desktop

## 🎯 QR Code (Optional)

You can generate a QR code for easy mobile access:
- Visit: https://www.qr-code-generator.com/
- Enter: http://192.168.100.9:5173
- Scan with your phone!

## ⚠️ Important Notes

- Your IP address may change if you reconnect to WiFi
- The servers must be running for network access to work
- Both devices must be on the SAME WiFi network
- Some public/corporate WiFi networks block device-to-device communication

## 🔒 Security

This is for local development only. For production:
- Use HTTPS
- Implement proper authentication
- Use environment variables
- Deploy to a proper hosting service

---

**Your Local IP**: 192.168.100.9
**Network is now exposed!** 🚀



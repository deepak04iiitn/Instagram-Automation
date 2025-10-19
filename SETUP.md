# Instagram Automation Setup Guide

This guide will walk you through setting up the Instagram Automation system step by step.

## 📋 Prerequisites Checklist

- [ ] Node.js (v14 or higher) installed
- [ ] MongoDB installed and running
- [ ] Google Cloud Project created
- [ ] Instagram Business Account
- [ ] Facebook Developer Account
- [ ] Gmail account with 2FA enabled

## 🔧 Step-by-Step Setup

### 1. Google Cloud Setup

#### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Instagram Automation"
4. Click "Create"

#### 1.2 Enable Required APIs
1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search and enable:
   - **Google AI Studio API** (for Gemini)
   - **Google Drive API**

#### 1.3 Create Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Desktop application"
4. Name: "Instagram Automation"
5. Click "Create"
6. Download the JSON file and note the Client ID and Client Secret

#### 1.4 Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select your project
4. Copy the API key

#### 1.5 Get Google Drive Refresh Token
1. Use the OAuth 2.0 Playground: [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, find "Drive API v3"
6. Select "https://www.googleapis.com/auth/drive"
7. Click "Authorize APIs"
8. Sign in with your Google account
9. Click "Exchange authorization code for tokens"
10. Copy the "Refresh token"

### 2. Instagram/Facebook Setup

#### 2.1 Create Facebook Developer Account
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Get Started"
3. Sign in with your Facebook account
4. Complete the developer verification

#### 2.2 Create Facebook App
1. In Facebook Developers, click "My Apps" → "Create App"
2. App type: "Business"
3. App name: "Instagram Automation"
4. App contact email: your email
5. Click "Create App"

#### 2.3 Add Instagram Basic Display
1. In your app dashboard, click "Add Product"
2. Find "Instagram Basic Display" and click "Set Up"
3. Go to "Instagram Basic Display" → "Basic Display"
4. Click "Create New App"
5. Add your website URL (can be localhost for testing)
6. Add OAuth Redirect URIs: `http://localhost:3000/auth/instagram/callback`

#### 2.4 Get Instagram Access Token
1. Go to "Instagram Basic Display" → "Basic Display"
2. Click "Generate Token"
3. Select your Instagram account
4. Copy the access token

#### 2.5 Get Instagram Account ID
1. Use the Graph API Explorer: [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app
3. Get User Token
4. Make a GET request to: `me/accounts`
5. Find your Instagram account and copy the ID

### 3. Email Setup (Gmail)

#### 3.1 Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the setup process

#### 3.2 Generate App Password
1. In Google Account Security, click "App passwords"
2. Select app: "Mail"
3. Select device: "Other (custom name)"
4. Enter: "Instagram Automation"
5. Click "Generate"
6. Copy the 16-character password

### 4. Database Setup

#### 4.1 Install MongoDB
**Windows:**
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB Compass (optional GUI)

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

#### 4.2 Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb/brew/mongodb-community
```

### 5. Application Setup

#### 5.1 Clone and Install
```bash
git clone <your-repository-url>
cd instagram-automation
npm install
```

#### 5.2 Environment Configuration
1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/instagram-automation
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_from_step_1.4
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_gmail_address
   EMAIL_PASS=your_16_character_app_password_from_step_3.2
   ADMIN_EMAIL=your_gmail_address
   
   # Instagram Graph API Configuration
   INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_from_step_2.4
   INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_from_step_2.5
   
   # Google Drive Configuration
   GOOGLE_DRIVE_CLIENT_ID=your_client_id_from_step_1.3
   GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_from_step_1.3
   GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_from_step_1.5
   GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id
   
   # App Configuration
   APP_URL=http://localhost:3000
   ```

#### 5.3 Create Google Drive Folder
1. Go to [Google Drive](https://drive.google.com/)
2. Create a new folder: "Instagram Automation"
3. Right-click the folder → "Get link"
4. Copy the folder ID from the URL (the long string after `/folders/`)

### 6. Testing the Setup

#### 6.1 Start the Application
```bash
npm run dev
```

#### 6.2 Test Health Check
```bash
curl http://localhost:3000/health
```

#### 6.3 Test Manual Automation
```bash
curl -X POST http://localhost:3000/api/run
```

#### 6.4 Check Logs
Monitor the console output for any errors. The application should:
1. Connect to MongoDB
2. Initialize all services
3. Start the scheduler
4. Show "Services initialized successfully"

### 7. Verification Checklist

- [ ] MongoDB is running and accessible
- [ ] All environment variables are set correctly
- [ ] Gemini API key is valid
- [ ] Instagram access token is valid
- [ ] Google Drive credentials are working
- [ ] Email configuration is working
- [ ] Application starts without errors
- [ ] Scheduler is running (check logs)
- [ ] Manual automation run works
- [ ] Approval emails are received

### 8. Troubleshooting

#### Common Issues:

**"MongoDB connection error"**
- Ensure MongoDB is running
- Check connection string in `.env`

**"Instagram API error"**
- Verify access token is valid
- Check if account is Business type
- Ensure app is approved for Instagram Basic Display

**"Email not sending"**
- Verify Gmail credentials
- Check if 2FA is enabled
- Ensure app password is used (not regular password)

**"Google Drive upload error"**
- Verify OAuth credentials
- Check if APIs are enabled
- Ensure folder ID is correct

**"Image generation error"**
- Check if Canvas dependencies are installed
- Verify image output directory exists

### 9. Production Deployment

For production deployment:

1. **Use a production MongoDB instance** (MongoDB Atlas recommended)
2. **Set up proper environment variables** on your hosting platform
3. **Use a production email service** (SendGrid, AWS SES, etc.)
4. **Set up monitoring and logging**
5. **Use PM2 or similar process manager**
6. **Set up SSL certificates**
7. **Configure proper error handling and alerts**

### 10. Maintenance

- **Monitor API usage** and set up alerts
- **Regularly backup** your database
- **Update dependencies** regularly
- **Monitor logs** for errors
- **Test the automation** regularly
- **Keep API keys secure** and rotate them periodically

---

## 🆘 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify all credentials are correct
4. Test each service individually
5. Create an issue with detailed error information

**Happy Automating! 🚀**

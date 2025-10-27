# Google Drive Setup Instructions

## Issue
Your Google Drive backup service is currently disabled due to expired authentication.

## Solution

### Quick Fix (Skip Google Drive)
The system is already configured to skip Google Drive when it's unavailable. Your Instagram automation will continue to work using Cloudinary as the primary storage.

### Re-enable Google Drive (Optional)

If you want to re-enable Google Drive backup, follow these steps:

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

#### Step 2: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "+ CREATE CREDENTIALS" > "OAuth client ID"
3. Choose "Desktop app" as the application type
4. Give it a name (e.g., "Instagram Automation")
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

#### Step 3: Generate Refresh Token
Run this Node.js script to generate a new refresh token:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Get auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/drive'],
  prompt: 'consent'
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('REFRESH_TOKEN:', token.refresh_token);
  });
});
```

Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with the values from Step 2.

#### Step 4: Create Google Drive Folder
1. Open Google Drive
2. Create a folder for your Instagram automation backups
3. Right-click the folder > "Share" > "Get link"
4. Copy the folder ID from the URL (the long string after `folders/`)

#### Step 5: Update Environment Variables
Add these to your `.env` file:

```env
GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

#### Step 6: Restart Your Application
After updating the environment variables, restart your application.

## Notes
- Google Drive is **optional** - your automation works fine without it
- Cloudinary is the primary storage provider
- If you don't need backups, you can skip Google Drive entirely
- Refresh tokens may expire after 6 months of inactivity

## Troubleshooting

### "invalid_grant" Error
This means your refresh token has expired. Generate a new one following Step 3.

### "Access denied" Error
Make sure you've enabled the Google Drive API in Google Cloud Console.

### Folder Not Found
Double-check your folder ID and ensure the folder exists in your Google Drive.

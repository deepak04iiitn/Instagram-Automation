# Instagram Automation System

A complete Node.js automation system for Instagram content posting using the Instagram Graph API (Business Account) and Gemini API.

## 🚀 Features

- **Daily Content Generation**: Automatically generates content based on the day of the week
- **AI-Powered Content**: Uses Google's Gemini API for intelligent content creation
- **Email Approval System**: Sends approval emails with Accept/Decline/Retry buttons
- **Image Generation**: Converts text content to Instagram-ready images
- **Instagram Integration**: Posts directly to Instagram Business Account
- **Google Drive Storage**: Automatically uploads images to organized Google Drive folders
- **Automated Scheduling**: Runs daily at 10 AM using node-cron
- **Monitoring Dashboard**: Real-time React dashboard for system monitoring and control
- **Analytics & Charts**: Visual analytics with post performance metrics
- **Error Handling**: Comprehensive error handling and notifications

## 📅 Daily Topics

- **Sunday**: Coding question of the day
- **Monday**: Interview experience
- **Tuesday**: UI Testing
- **Wednesday**: API Testing
- **Thursday**: Performance Testing
- **Friday**: SDET Tools
- **Saturday**: AI in Testing

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: React 19, Tailwind CSS, Recharts
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini API
- **Email**: Nodemailer
- **Scheduling**: node-cron
- **Image Generation**: Canvas
- **Cloud Storage**: Google Drive API
- **Social Media**: Instagram Graph API
- **Charts**: Recharts for data visualization

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v14 or higher)
2. **MongoDB** (local or cloud instance)
3. **Google Cloud Project** with:
   - Gemini API enabled
   - Google Drive API enabled
4. **Instagram Business Account** with:
   - Instagram Graph API access
   - Facebook Developer Account
5. **Email Service** (Gmail recommended)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd instagram-automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/instagram-automation
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Gemini AI Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password_here
   ADMIN_EMAIL=admin@example.com
   
   # Instagram Graph API Configuration
   INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
   INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
   
   # Google Drive Configuration
   GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
   GOOGLE_DRIVE_CLIENT_SECRET=your_google_client_secret_here
   GOOGLE_DRIVE_REFRESH_TOKEN=your_google_refresh_token_here
   GOOGLE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
   
   # App Configuration
   APP_URL=http://localhost:3000
   ```

## 🔑 API Keys Setup

### 1. Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

### 2. Instagram Graph API
1. Create a [Facebook Developer Account](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Get your access token and account ID
5. Add them to your `.env` file

### 3. Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create credentials (OAuth 2.0)
5. Get client ID, client secret, and refresh token
6. Add them to your `.env` file

### 4. Email Configuration (Gmail)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use your Gmail address and app password in `.env`

## 🚀 Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Run the application**
   ```bash
   # Backend (Terminal 1)
   npm run dev
   
   # Frontend Dashboard (Terminal 2)
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the dashboard**
   - Open your browser to `http://localhost:5173`
   - Monitor system status and posts in real-time
   - Use the control panel for manual operations

4. **Test the automation**
   ```bash
   # Manual trigger via API
   curl -X POST http://localhost:3000/api/run
   
   # Or use the dashboard "Run Now" button
   ```

## 📊 Monitoring Dashboard

The system includes a comprehensive React-based monitoring dashboard accessible at `http://localhost:5173`:

### Dashboard Features
- **Real-time Monitoring**: Live system status and post updates
- **Analytics Charts**: Visual representation of post performance and status distribution
- **Control Panel**: Manual operations including automation triggers and cleanup
- **Recent Posts**: List of recent posts with detailed status and content preview
- **System Health**: Real-time monitoring of all services and connections
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### Dashboard Components
- **Status Cards**: Key metrics and system indicators
- **Analytics Charts**: Pie charts for status distribution, bar charts for topic analysis
- **Control Panel**: Manual automation trigger, cleanup operations, system refresh
- **Recent Posts**: Expandable post list with status indicators and action buttons
- **Error Handling**: Comprehensive error boundaries and user notifications

### Getting Started with Dashboard
1. Start the backend: `npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Open browser to `http://localhost:5173`
4. Monitor your automation system in real-time

## 📡 API Endpoints

### Automation Endpoints
- `POST /api/run` - Manually trigger automation
- `GET /api/status` - Get automation status
- `GET /api/posts` - Get posts with pagination
- `GET /api/posts/:postId` - Get specific post

### Approval Endpoints
- `GET /api/approve/:postId/:emailId/accept` - Accept post
- `GET /api/approve/:postId/:emailId/decline` - Decline post
- `GET /api/approve/:postId/:emailId/retry` - Retry post

### Utility Endpoints
- `GET /health` - Health check
- `POST /api/cleanup/images` - Clean up old images
- `POST /api/cleanup/posts` - Clean up old posts

## 🔄 Automation Flow

1. **Daily Trigger**: Scheduler runs at 10 AM daily
2. **Content Generation**: Gemini API generates content based on day's topic
3. **Email Approval**: Admin receives email with content and approval buttons
4. **Admin Action**:
   - **Accept**: Generates images, uploads to Google Drive, posts to Instagram
   - **Decline**: Stops process for the day
   - **Retry**: Generates new content and sends new approval email
5. **Success Notification**: Admin receives confirmation email

## 📁 Project Structure

```
instagram-automation/
├── backend/
│   ├── controllers/
│   │   └── automationController.js
│   ├── models/
│   │   ├── Post.js
│   │   ├── Approval.js
│   │   ├── Configuration.js
│   │   └── index.js
│   ├── routes/
│   │   └── automation.js
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── emailService.js
│   │   ├── imageGenerationService.js
│   │   ├── googleDriveService.js
│   │   ├── instagramService.js
│   │   └── schedulerService.js
│   ├── uploads/
│   │   └── images/
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── StatusCard.jsx
│   │   │   ├── RecentPosts.jsx
│   │   │   ├── AnalyticsChart.jsx
│   │   │   ├── ControlPanel.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── cn.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── env.example
│   └── README.md
├── env.example
├── package.json
└── README.md
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`

2. **Instagram API Error**
   - Verify access token is valid
   - Check account ID is correct
   - Ensure Instagram account is Business type

3. **Email Not Sending**
   - Verify email credentials
   - Check if 2FA is enabled and app password is used
   - Ensure SMTP settings are correct

4. **Google Drive Upload Error**
   - Verify OAuth credentials
   - Check if Google Drive API is enabled
   - Ensure folder ID is correct

5. **Image Generation Error**
   - Check if Canvas dependencies are installed
   - Verify image output directory exists

### Logs

Check the console output for detailed error messages. All services log their activities and errors.

## 🔒 Security Notes

- Never commit `.env` file to version control
- Use strong, unique passwords for all services
- Regularly rotate API keys
- Monitor API usage and set up alerts
- Use environment-specific configurations

## 📈 Monitoring

The application includes:
- Health check endpoint (`/health`)
- Status endpoint (`/api/status`)
- Error notifications via email
- Comprehensive logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue with detailed information
4. Include error messages and steps to reproduce

## 🔄 Updates

To update the application:
1. Pull the latest changes
2. Run `npm install` to update dependencies
3. Update your `.env` file if needed
4. Restart the application

---

**Happy Automating! 🚀**

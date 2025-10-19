# Instagram Automation Dashboard

A modern, responsive React dashboard for monitoring and controlling the Instagram automation system.

## 🚀 Features

- **Real-time Monitoring**: Live updates of system status and post data
- **Analytics Dashboard**: Visual charts and statistics for post performance
- **Control Panel**: Manual operations and system management
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Auto-refresh**: Automatic data updates every 30 seconds

## 🛠️ Tech Stack

- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Date-fns** for date formatting

## 📦 Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
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
   VITE_API_URL=http://localhost:3000
   VITE_NODE_ENV=development
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🎨 Dashboard Components

### Main Dashboard (`Dashboard.jsx`)
- Central hub for all monitoring data
- Auto-refresh functionality
- Error handling and loading states
- Header with manual controls

### Status Cards (`StatusCard.jsx`)
- Key metrics display
- Color-coded status indicators
- Trend information
- Customizable styling

### Recent Posts (`RecentPosts.jsx`)
- List of recent posts with status
- Expandable post details
- Action buttons for each post
- Real-time status updates

### Analytics Chart (`AnalyticsChart.jsx`)
- Post status distribution (pie chart)
- Topic distribution (bar chart)
- Summary statistics
- Interactive tooltips

### Control Panel (`ControlPanel.jsx`)
- Manual automation trigger
- System cleanup operations
- Real-time notifications
- System status indicators

### Utility Components
- **LoadingSpinner**: Loading states
- **ErrorBoundary**: Error handling
- **StatusCard**: Reusable status display

## 🔧 API Integration

The dashboard communicates with the backend through the `api.js` service:

```javascript
// Get automation status
const status = await automationAPI.getStatus();

// Run automation manually
await automationAPI.runAutomation();

// Get posts with pagination
const posts = await automationAPI.getPosts(1, 10);

// Cleanup operations
await automationAPI.cleanupImages();
await automationAPI.cleanupPosts();
```

## 📱 Responsive Design

The dashboard is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🎯 Key Features

### Real-time Updates
- Automatic refresh every 30 seconds
- Manual refresh button
- Live status indicators

### Visual Analytics
- Post status distribution charts
- Topic performance metrics
- System health indicators

### Control Operations
- Manual automation trigger
- Image cleanup
- Post cleanup
- System refresh

### Error Handling
- Comprehensive error boundaries
- User-friendly error messages
- Retry mechanisms
- Development error details

## 🚀 Usage

### Starting the Dashboard
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run preview
```

### Environment Configuration
- `VITE_API_URL`: Backend API URL
- `VITE_NODE_ENV`: Environment mode

### API Endpoints Used
- `GET /api/status` - System status
- `POST /api/run` - Manual automation
- `GET /api/posts` - Posts list
- `POST /api/cleanup/images` - Image cleanup
- `POST /api/cleanup/posts` - Post cleanup

## 🎨 Customization

### Styling
The dashboard uses Tailwind CSS with custom utilities:
- Custom color schemes
- Responsive breakpoints
- Component-specific styles
- Dark mode support (ready)

### Components
All components are modular and reusable:
- Props-based configuration
- Customizable styling
- Event handlers
- Loading states

### Charts
Recharts integration for data visualization:
- Pie charts for status distribution
- Bar charts for topic analysis
- Custom tooltips
- Responsive sizing

## 🔍 Monitoring Features

### System Health
- Database connection status
- API service status
- Scheduler status
- Email service status

### Post Management
- Recent posts list
- Status tracking
- Content preview
- Action buttons

### Analytics
- Visual data representation
- Performance metrics
- Trend analysis
- Summary statistics

## 🛡️ Error Handling

### Error Boundaries
- Component-level error catching
- User-friendly error messages
- Development error details
- Recovery mechanisms

### API Error Handling
- Network error handling
- Timeout management
- Retry logic
- User notifications

### Loading States
- Skeleton loading
- Spinner indicators
- Progress feedback
- Disabled states

## 📊 Performance

### Optimization
- React.memo for components
- useCallback for functions
- useMemo for calculations
- Lazy loading ready

### Bundle Size
- Tree shaking enabled
- Code splitting ready
- Optimized imports
- Minimal dependencies

## 🔧 Development

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Structure
```
src/
├── components/          # React components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── StatusCard.jsx  # Status display
│   ├── RecentPosts.jsx # Posts list
│   ├── AnalyticsChart.jsx # Charts
│   ├── ControlPanel.jsx # Controls
│   ├── LoadingSpinner.jsx # Loading
│   └── ErrorBoundary.jsx # Error handling
├── services/           # API services
│   └── api.js         # API client
├── utils/             # Utilities
│   └── cn.js         # Class name helper
├── App.jsx           # Main app
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Set production environment variables:
```env
VITE_API_URL=https://your-api-domain.com
VITE_NODE_ENV=production
```

### Static Hosting
The build creates static files that can be served from:
- Vercel
- Netlify
- AWS S3
- Any static hosting service

## 🆘 Troubleshooting

### Common Issues

**API Connection Error**
- Check `VITE_API_URL` in `.env`
- Ensure backend is running
- Check CORS configuration

**Build Errors**
- Clear node_modules and reinstall
- Check for TypeScript errors
- Verify all dependencies

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check for conflicting styles
- Verify responsive breakpoints

### Debug Mode
Set `VITE_NODE_ENV=development` for:
- Detailed error messages
- Console logging
- Development tools

## 📈 Future Enhancements

- [ ] Dark mode toggle
- [ ] Real-time WebSocket updates
- [ ] Advanced filtering and search
- [ ] Export functionality
- [ ] User authentication
- [ ] Multi-language support
- [ ] PWA capabilities
- [ ] Advanced analytics

---

**Happy Monitoring! 📊**
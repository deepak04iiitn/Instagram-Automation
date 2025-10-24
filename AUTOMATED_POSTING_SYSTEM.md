# Automated Daily Posting System

## Overview

This system implements an automated daily posting system for Instagram with 2 scheduled posts per day in IST timezone:

1. **10:00 AM IST** - Post current random prompt image (existing logic)
2. **5:00 PM IST** - Post job update image showing 2 jobs

## Features

### 🕙 Morning Post (10:00 AM IST)
- Uses existing random prompt generation system
- Generates SDET interview questions and solutions
- Requires email approval before posting
- Posts educational content for the tech community

### 🕔 Evening Post (5:00 PM IST)
- Fetches 2 random QA jobs from your job listing API
- Generates beautiful job posting images
- Includes company name, position, experience, and location
- Posts directly without approval (automated)
- Includes apply links using your existing link generation function
- Filters specifically for QA category jobs

## Job Posting Features

### Job Card Information
Each job card includes:
- **Company Name** - Displayed prominently
- **Position Name** - Job title/role
- **Minimum Years of Experience** - Required experience
- **Location** - Job location(s)

### Link Generation
- Uses your existing `formatUrlString` function
- Generates apply links in format: `https://route2hire.com/fulljd/{company}-{title}/{jobId}`
- Links are included in the Instagram caption

### Deduplication System
- Tracks recently posted jobs in memory
- Prevents posting the same job multiple times
- Automatically cleans up old job IDs from memory
- Ensures fresh content daily

### Fallback Handling
- If no jobs are available, system logs error and sends notification
- Continues with other scheduled tasks
- Graceful error handling with email notifications

## Technical Implementation

### New Services

#### JobPostingService (`backend/services/jobPostingService.js`)
- Fetches QA jobs from your job listing API
- Generates job posting images
- Handles link generation and caption creation
- Manages job deduplication
- Posts to Instagram automatically
- Filters for QA category jobs only

#### Updated SchedulerService (`backend/services/schedulerService.js`)
- Added IST timezone support
- New job posting schedule at 5 PM IST
- Updated all schedules to use IST timezone
- Added job memory cleanup task

### New API Endpoints

#### Job Posting Endpoints
- `POST /api/jobs/post` - Manually trigger job posting
- `GET /api/jobs/status` - Get job posting service status
- `GET /api/jobs/test` - Test job fetching functionality

### Image Generation

#### Specialized Job Posting Template
- Beautiful HTML template for job postings
- Displays 2 jobs in card format
- Includes icons for company, experience, and location
- Matches your existing brand styling
- Responsive design for Instagram

## Configuration

### Environment Variables
Add these to your `.env` file:

```env
# Job API Configuration
JOB_API_BASE_URL=https://route2hire.com/backend

# Domain for link generation
DOMAIN=https://route2hire.com
```

### Timezone Configuration
All schedules are configured for IST (Asia/Kolkata):
- Daily automation: 10:00 AM IST (4:30 AM UTC)
- Job posting: 5:00 PM IST (11:30 AM UTC)
- Image cleanup: 2:00 AM IST (8:30 PM UTC)
- Post cleanup: 3:00 AM IST (9:30 PM UTC) - Sundays only
- Job memory cleanup: 1:00 AM IST (7:30 PM UTC)

## Usage

### Automatic Operation
The system runs automatically once started. No manual intervention required.

### Manual Testing
You can manually trigger job posting for testing:

```bash
# Test job fetching
curl -X GET http://localhost:3000/api/jobs/test

# Manually post job update
curl -X POST http://localhost:3000/api/jobs/post

# Check job posting status
curl -X GET http://localhost:3000/api/jobs/status
```

### Monitoring
- Check server logs for scheduled task execution
- Email notifications for success/failure
- API endpoints for status monitoring

## Error Handling

### Job Fetching Errors
- If job API is unavailable, logs error and sends notification
- Continues with other scheduled tasks
- Retries on next scheduled run

### Image Generation Errors
- Falls back to error logging
- Sends notification to admin
- Continues with other tasks

### Instagram Posting Errors
- Logs detailed error information
- Sends failure notification
- Retries on next scheduled run

## File Structure

```
backend/
├── services/
│   ├── jobPostingService.js          # New: Job posting logic
│   ├── schedulerService.js           # Updated: IST timezone support
│   └── htmlImageGenerationService.js # Updated: Job posting templates
├── controllers/
│   └── automationController.js       # Updated: Job posting methods
├── routes/
│   └── automation.js                 # Updated: New job endpoints
└── index.js                          # Updated: API documentation
```

## Dependencies

The system uses existing dependencies:
- `node-cron` - For scheduling
- `puppeteer` - For image generation
- `axios` - For API calls
- `moment` - For timezone handling

## Monitoring and Maintenance

### Daily Operations
- System automatically posts at 10 AM and 5 PM IST
- Cleans up old images and job memory
- Sends email notifications for all activities

### Weekly Maintenance
- Post cleanup runs every Sunday at 3 AM IST
- Removes old post records from database

### Troubleshooting
1. Check server logs for error messages
2. Verify job API connectivity
3. Test manual job posting endpoint
4. Check Instagram API credentials
5. Verify email service configuration

## Success Metrics

The system will:
- Post 2 times daily (10 AM and 5 PM IST)
- Show 2 different QA jobs in evening posts
- Avoid duplicate job postings
- Maintain consistent branding
- Provide apply links for each job
- Send notifications for all activities
- Filter specifically for QA category jobs

## Future Enhancements

Potential improvements:
- ✅ Job category filtering (QA jobs implemented)
- Custom posting times
- Multiple job sources
- Advanced analytics
- A/B testing for job post formats
- Integration with more job boards
- Support for other job categories (Developer, DevOps, etc.)

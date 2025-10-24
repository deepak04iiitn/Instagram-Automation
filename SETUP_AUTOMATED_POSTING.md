# Setup Guide: Automated Daily Posting System

## Prerequisites

Before setting up the automated posting system, ensure you have:

1. **Existing Instagram Automation System** - The base system should be working
2. **Job Listing API** - Your job listing application should be accessible
3. **Environment Variables** - All required environment variables configured

## Environment Variables

Add these new environment variables to your `.env` file:

```env
# Job API Configuration
JOB_API_BASE_URL=https://route2hire.com/backend

# Domain for link generation (if not already set)
DOMAIN=https://route2hire.com
```

## Installation Steps

### 1. Update Dependencies

The system uses existing dependencies, but ensure you have:

```bash
npm install node-cron moment axios puppeteer
```

### 2. File Structure

The following files have been created/updated:

```
backend/
├── services/
│   ├── jobPostingService.js          # NEW: Job posting logic
│   ├── schedulerService.js           # UPDATED: IST timezone support
│   └── htmlImageGenerationService.js # UPDATED: Job posting templates
├── controllers/
│   └── automationController.js       # UPDATED: Job posting methods
├── routes/
│   └── automation.js                 # UPDATED: New job endpoints
├── scripts/
│   └── testJobPosting.mjs            # NEW: Test script
└── index.js                          # UPDATED: API documentation
```

### 3. Test the System

Run the test script to verify everything works:

```bash
node backend/scripts/testJobPosting.mjs
```

Expected output:
```
🧪 Testing Job Posting System...

📋 Test 1: Fetching QA jobs from API...
✅ Successfully fetched 5 QA jobs
Sample job: { id: '...', company: '...', title: '...', location: '...', hasValidLink: true, category: 'qa' }

🎯 Test 2: Selecting random jobs...
✅ Selected 2 QA jobs for posting
  Job 1: Company A - QA Engineer
  Job 2: Company B - Test Automation Engineer

🔗 Test 3: Testing link generation...
✅ Generated link: https://route2hire.com/fulljd/company-a-qa-engineer/123

📝 Test 4: Testing caption generation...
✅ Generated caption (first 200 chars): ...

🖼️  Test 5: Testing image generation...
✅ Generated image: /path/to/generated/image.png

🎉 All tests completed successfully!
```

### 4. Start the System

Start your server as usual:

```bash
npm run dev
# or
node backend/index.js
```

You should see these log messages:
```
Starting Instagram Automation Scheduler...
Scheduled daily automation at 10:00 AM IST (Job: daily-automation)
Scheduled job posting at 5:00 PM IST (Job: job-posting)
Scheduled image cleanup at 2:00 AM IST (Job: image-cleanup)
Scheduled post cleanup on Sundays at 3:00 AM IST (Job: post-cleanup)
Scheduled job memory cleanup at 1:00 AM IST (Job: job-memory-cleanup)
Scheduler started successfully
```

## API Endpoints

### New Job Posting Endpoints

#### Test Job Fetching
```bash
curl -X GET http://localhost:3000/api/jobs/test
```

#### Check Job Posting Status
```bash
curl -X GET http://localhost:3000/api/jobs/status
```

#### Manually Post Job Update
```bash
curl -X POST http://localhost:3000/api/jobs/post
```

### Updated Root Endpoint
```bash
curl -X GET http://localhost:3000/
```

Returns updated API information with new features and schedules.

## Scheduling

The system now runs on IST timezone with these schedules:

| Task | Time (IST) | Time (UTC) | Description |
|------|------------|------------|-------------|
| Daily Automation | 10:00 AM | 4:30 AM | Posts random prompt content |
| Job Posting | 5:00 PM | 11:30 AM | Posts job opportunities |
| Image Cleanup | 2:00 AM | 8:30 PM | Cleans old images |
| Post Cleanup | 3:00 AM (Sundays) | 9:30 PM (Saturdays) | Cleans old posts |
| Job Memory Cleanup | 1:00 AM | 7:30 PM | Cleans job deduplication memory |

## Monitoring

### Log Messages

Look for these log messages to confirm the system is working:

#### Morning Post (10:00 AM IST)
```
=== Daily Automation Started at [timestamp] (IST) ===
Starting daily automation process...
Today's prompt: [prompt content]...
=== Daily Automation Completed Successfully ===
```

#### Evening Post (5:00 PM IST)
```
=== Job Posting Started at [timestamp] (IST) ===
Starting job update posting process...
Fetching 20 jobs from API...
Found 15 valid jobs out of 20 total
Selected 2 jobs for posting
Job posting image generated successfully
Image uploaded to Cloudinary
Job update posted to Instagram successfully
=== Job Posting Completed Successfully ===
```

### Email Notifications

You'll receive email notifications for:
- Successful job postings
- Failed job postings
- System errors
- Daily automation status

## Troubleshooting

### Common Issues

#### 1. Job API Not Accessible
**Error**: `Failed to fetch jobs: [error message]`

**Solution**:
- Check if your job listing API is running
- Verify `JOB_API_BASE_URL` in `.env` file
- Test API endpoint manually: `curl https://route2hire.com/backend/naukri?limit=5`

#### 2. No Valid Jobs Found
**Error**: `No valid jobs available for posting`

**Solution**:
- Check if jobs have valid `apply_link` fields
- Verify job data structure matches expected format
- Check job API response format

#### 3. Image Generation Fails
**Error**: `Failed to generate job posting images`

**Solution**:
- Ensure puppeteer is installed: `npm install puppeteer`
- Check if system has enough memory
- Verify image output directory permissions

#### 4. Instagram Posting Fails
**Error**: `Failed to post job update`

**Solution**:
- Check Instagram API credentials
- Verify image URLs are accessible
- Check Instagram API rate limits

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

### Manual Testing

Test individual components:

```bash
# Test job fetching only
node -e "
import JobPostingService from './backend/services/jobPostingService.js';
const service = new JobPostingService();
service.fetchJobs(5).then(jobs => console.log('Jobs:', jobs.length));
"

# Test image generation only
node -e "
import JobPostingService from './backend/services/jobPostingService.js';
const service = new JobPostingService();
// Add test job data and call generateJobPostingImage
"
```

## Production Deployment

### Environment Setup

1. Set production environment variables
2. Ensure job API is accessible from production server
3. Configure proper logging
4. Set up monitoring and alerting

### Monitoring

- Set up log monitoring for error detection
- Configure email alerts for failures
- Monitor Instagram API usage
- Track job posting success rates

### Backup

- Regular database backups
- Image backup to cloud storage
- Configuration backup
- Log file rotation

## Success Verification

After setup, verify the system is working by:

1. **Check logs** for scheduled task execution
2. **Test API endpoints** manually
3. **Verify email notifications** are working
4. **Check Instagram posts** are being created
5. **Monitor job deduplication** is working

## Support

If you encounter issues:

1. Check the logs for error messages
2. Run the test script to identify problems
3. Verify all environment variables are set
4. Test individual components manually
5. Check network connectivity to job API

The system is designed to be robust and self-healing, but proper monitoring and testing will ensure smooth operation.

# Manual Job Posting Scripts

This directory contains scripts for manually posting job updates to Instagram outside of the scheduled 5 PM IST time.

## Available Scripts

### 1. `manualJobPost.mjs` - Detailed Manual Posting

**Purpose**: Complete manual job posting with detailed logging and step-by-step progress.

**Usage**:
```bash
node backend/scripts/manualJobPost.mjs
```

**Features**:
- ✅ Detailed step-by-step logging
- ✅ Shows selected jobs before posting
- ✅ Progress indicators for each step
- ✅ Error handling with troubleshooting tips
- ✅ Success summary with all details
- ✅ Email notifications for success/failure
- ✅ Graceful interruption handling (Ctrl+C)

**Output Example**:
```
🚀 Manual Job Posting Script Started

==================================================
⏰ Time: 15/01/2024, 2:30:45 PM IST
==================================================

📋 Step 1: Fetching QA jobs from API...
✅ Found 15 valid QA jobs

🎯 Step 2: Selecting 2 random jobs...
✅ Selected 2 jobs for posting:
   1. TechCorp - QA Engineer
      📍 Bangalore, India
      📅 3+ years experience
   2. StartupXYZ - Test Automation Engineer
      📍 Mumbai, India
      📅 2+ years experience

🖼️  Step 3: Generating job posting image...
✅ Image generated: /path/to/image.png

☁️  Step 4: Uploading to Cloudinary...
✅ Uploaded to Cloudinary: https://res.cloudinary.com/...

📁 Step 5: Uploading to Google Drive (backup)...
✅ Uploaded to Google Drive: https://drive.google.com/...

📝 Step 6: Generating Instagram caption...
✅ Caption generated (first 200 chars):
   🚀 Exciting QA Job Opportunities Alert! 🚀

💼 Job 1:
🏢 TechCorp
📋 QA Engineer
📅 3+ years experience
📍 Bangalore, India
🔗 Apply: https://route2hire.com/fulljd/...

📱 Step 7: Posting to Instagram...
✅ Posted to Instagram successfully!
   📊 Instagram Post ID: 1234567890123456789

💾 Step 8: Creating post record in database...
✅ Post record created with ID: 507f1f77bcf86cd799439011

📧 Step 9: Sending success notification...
✅ Success notification sent

🎉 Manual Job Posting Completed Successfully!
==================================================
📊 Summary:
   • Jobs posted: 2
   • Instagram Post ID: 1234567890123456789
   • Database Record ID: 507f1f77bcf86cd799439011
   • Image URL: https://res.cloudinary.com/...
   • Posted at: 15/01/2024, 2:30:52 PM IST
==================================================
```

### 2. `quickJobPost.mjs` - Quick Manual Posting

**Purpose**: Simplified manual job posting with minimal output.

**Usage**:
```bash
node backend/scripts/quickJobPost.mjs
```

**Features**:
- ✅ Minimal logging
- ✅ Quick execution
- ✅ Basic error handling
- ✅ Essential information only

**Output Example**:
```
🚀 Quick Job Post...
✅ Success!
📱 Instagram Post ID: 1234567890123456789
💾 Database Record ID: 507f1f77bcf86cd799439011
📊 Jobs posted: 2
```

## Prerequisites

Before running these scripts, ensure:

1. **Environment Variables** are set in `.env`:
   ```env
   JOB_API_BASE_URL=https://route2hire.com/backend
   INSTAGRAM_ACCESS_TOKEN=your_token
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   GOOGLE_DRIVE_CLIENT_ID=your_client_id
   GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
   GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
   EMAIL_USER=your_email
   EMAIL_PASS=your_password
   ADMIN_EMAIL=admin@example.com
   MONGODB_URI=your_mongodb_uri
   ```

2. **Dependencies** are installed:
   ```bash
   npm install
   ```

3. **Job API** is accessible and returning QA jobs

4. **Instagram API** credentials are valid

5. **Cloudinary** account is configured

6. **Google Drive API** is set up (optional, for backup)

7. **Email service** is configured

## When to Use Manual Scripts

### Use `manualJobPost.mjs` when:
- 🧪 **Testing** the job posting system
- 🚨 **Urgent posting** needed outside scheduled time
- 🔍 **Debugging** issues with automated posting
- 📊 **Detailed monitoring** of the posting process
- 🎯 **Specific job selection** verification needed

### Use `quickJobPost.mjs` when:
- ⚡ **Quick posting** without detailed logs
- 🔄 **Automated scripts** calling the job posting
- 📱 **Simple verification** that posting works
- 🚀 **Fast execution** is preferred

## Error Handling

Both scripts include comprehensive error handling:

### Common Errors and Solutions:

1. **"No valid QA jobs available"**
   - Check if job API is returning QA jobs
   - Verify `category: 'qa'` filter is working
   - Ensure jobs have valid `apply_link` fields

2. **"Failed to fetch QA jobs"**
   - Check `JOB_API_BASE_URL` in `.env`
   - Verify job API is accessible
   - Check network connectivity

3. **"Failed to generate job posting image"**
   - Ensure puppeteer is installed
   - Check system memory availability
   - Verify image output directory permissions

4. **"Failed to post job update"**
   - Check Instagram API credentials
   - Verify image URLs are accessible
   - Check Instagram API rate limits

5. **"Failed to upload to Cloudinary"**
   - Verify Cloudinary credentials
   - Check image file size limits
   - Ensure Cloudinary account is active

## Safety Features

- **Graceful interruption**: Press `Ctrl+C` to stop the script safely
- **Error notifications**: Email alerts for failures
- **Database rollback**: Failed posts don't create database records
- **Image cleanup**: Temporary images are managed properly
- **Rate limiting**: Respects API rate limits

## Integration with Scheduled System

These manual scripts:
- ✅ **Don't interfere** with scheduled posting
- ✅ **Use same deduplication** system
- ✅ **Create proper database records**
- ✅ **Send email notifications**
- ✅ **Follow same posting format**

## Monitoring

After running manual scripts:
1. **Check Instagram** for the posted content
2. **Verify email notifications** were sent
3. **Check database** for the new post record
4. **Monitor logs** for any warnings
5. **Test apply links** in the posted content

## Best Practices

1. **Test first**: Always test with `manualJobPost.mjs` before using `quickJobPost.mjs`
2. **Check timing**: Avoid posting too close to scheduled 5 PM IST time
3. **Monitor results**: Verify the post appears correctly on Instagram
4. **Check links**: Ensure apply links work properly
5. **Backup**: Keep logs of manual posts for reference

## Troubleshooting

If scripts fail:
1. Run `node backend/scripts/testJobPosting.mjs` first
2. Check all environment variables
3. Verify API connectivity
4. Check Instagram API status
5. Review error logs for specific issues

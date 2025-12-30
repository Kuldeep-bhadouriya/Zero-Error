# Mission One-Time Completion Implementation

## Overview
Missions are now restricted to one-time completion per user. Users cannot submit the same mission multiple times, and the UI clearly shows which missions have been completed or are pending review.

## Changes Made

### 1. Database Model Updates
**File:** [models/missionSubmission.ts](models/missionSubmission.ts)
- Added compound unique index on `(user, mission, status)`
- Index only applies to submissions with status 'pending' or 'approved'
- Users can still resubmit rejected missions

### 2. API Backend Changes

#### Mission Upload API
**File:** [app/api/ze-club/missions/upload/route.ts](app/api/ze-club/missions/upload/route.ts)
- Added validation check before creating new submissions
- Checks if user already has a pending or approved submission for the mission
- Returns appropriate error messages:
  - "You have already completed this mission" (for approved submissions)
  - "You already have a pending submission for this mission" (for pending submissions)

#### Missions List API  
**File:** [app/api/ze-club/missions/route.ts](app/api/ze-club/missions/route.ts)
- Fetches user's session to identify authenticated user
- Queries all pending and approved submissions for the user
- Adds `isCompleted` and `isPending` flags to each mission
- Updates `isAvailable` flag to exclude completed/pending missions

### 3. Frontend UI Changes

#### CurrentMissions Component
**File:** [components/ze-club/CurrentMissions.tsx](components/ze-club/CurrentMissions.tsx)
- Added visual badges for completed (✓ Completed) and pending (⏳ Pending Review) missions
- Reduced opacity and disabled hover effects for completed/pending missions
- Added status messages at the bottom of mission cards
- Updated TypeScript interface to include `isCompleted`, `isPending`, and `isAvailable` fields

#### MissionUploader Component
**File:** [components/ze-club/MissionUploader.tsx](components/ze-club/MissionUploader.tsx)
- Filters out completed and pending missions from the mission selection dropdown
- Shows informative alert when no missions are available
- Improved error handling to display user-friendly messages
- Automatically removes missions from the dropdown if submission fails due to duplicate
- Updated TypeScript interface to include completion status fields

### 4. Migration Script
**File:** [scripts/add-mission-submission-index.ts](scripts/add-mission-submission-index.ts)
- Creates the unique compound index on existing database
- Checks for and reports any existing duplicate submissions
- Safe to run multiple times (checks if index already exists)

## How It Works

1. **Submission Prevention:**
   - When a user tries to submit a mission, the API checks for existing pending/approved submissions
   - Database-level unique index provides additional protection against race conditions
   
2. **UI Visibility:**
   - Completed missions show a green "✓ Completed" badge and a success message
   - Pending missions show a blue "⏳ Pending Review" badge and a pending message
   - Mission uploader only shows available missions (not completed or pending)
   
3. **Status Flow:**
   - **Pending:** User submitted, waiting for admin review → User cannot resubmit
   - **Approved:** Admin approved submission → User cannot resubmit
   - **Rejected:** Admin rejected submission → User CAN resubmit (not blocked by index)

## Testing Recommendations

1. **Test Single Submission:**
   - Submit a mission and verify it shows as "Pending Review"
   - Try to submit the same mission again and verify error message appears
   
2. **Test Approved Missions:**
   - Have an admin approve a submission
   - Verify the mission shows as "Completed"
   - Verify the mission doesn't appear in the uploader dropdown
   
3. **Test Rejected Missions:**
   - Have an admin reject a submission
   - Verify the mission becomes available again for resubmission
   
4. **Run Migration:**
   ```bash
   npx ts-node scripts/add-mission-submission-index.ts
   ```
   
## Database Migration

To apply the unique index to your existing database, run:

```bash
npx ts-node scripts/add-mission-submission-index.ts
```

This will:
- Create the unique compound index
- Check for any existing duplicate submissions
- Report any issues that need manual review

## Benefits

✅ Prevents duplicate point awards  
✅ Clearer user experience with visual status indicators  
✅ Prevents abuse of mission system  
✅ Allows legitimate resubmissions for rejected missions  
✅ Database-level protection against race conditions  
✅ User-friendly error messages

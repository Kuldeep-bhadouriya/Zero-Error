# ZE Club - Technical Documentation

## Overview
ZE Club is a loyalty and engagement program for Zero Error Esports members. Users earn points by completing missions, which can be redeemed for rewards. The system includes rank progression, leaderboards, and admin verification.

## Architecture

### Database Models
- **User**: Stores user information including points, rank, badge, and progress
- **Mission**: Defines available missions with titles, descriptions, and point values
- **MissionSubmission**: Tracks user submissions with proof URLs and verification status
- **Reward**: Catalog of redeemable items with cost and stock

### API Routes

#### User Routes
- `GET /api/ze-club/user/dashboard` - Fetch user statistics
- `GET /api/ze-club/missions` - List available missions
- `POST /api/ze-club/missions/upload` - Submit mission proof
- `GET /api/ze-club/rewards` - List available rewards
- `POST /api/ze-club/rewards/redeem` - Redeem a reward
- `GET /api/ze-club/leaderboard` - Fetch ranked user list

#### Admin Routes
- `GET /api/admin/submissions` - List pending submissions
- `PATCH /api/admin/submissions/verify` - Approve/reject submissions

### Pages & Components

#### User Pages
- `/ze-club` - Dashboard with stats and progress
- `/ze-club/leaderboard` - Community rankings
- `/ze-club/missions` - Mission upload and submission history
- `/ze-club/rewards` - Reward catalog and redemption
- `/ze-club/support` - FAQ and contact form

#### Admin Pages
- `/admin/ze-club` - Mission verification interface

### Key Features

#### 1. Mission System
- Users select missions and upload proof (images/videos)
- Files are stored in AWS S3
- Admins verify submissions
- Approved submissions award points

#### 2. Ranking System
Current rank thresholds:
- Rookie: 0 points
- Bronze: 500 points
- Silver: 1,000 points
- Gold: 5,000 points
- Platinum: 10,000 points
- Diamond: 20,000 points

#### 3. Reward Redemption
- Users can redeem rewards using earned points
- Stock is tracked and decremented on redemption
- Points are deducted from user balance

## Environment Variables Required

```bash
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# AWS S3 for File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=your_region

# NextAuth Configuration
AUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
```

## File Upload Constraints
- **Max Size**: 50MB
- **Allowed Types**: JPG, PNG, MP4
- **Storage**: AWS S3
- **Naming**: `{userId}-{missionId}-{timestamp}.{ext}`

## Security Considerations
- All routes require authentication via NextAuth
- Admin routes verify admin role in session
- File uploads validate size and type before S3 upload
- User points and ranks are server-side calculated

## Responsive Design
All components are responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

Mobile features:
- Hamburger menu for ZE Club navigation
- Touch-optimized button sizes
- Horizontal scroll for tables
- Stacked form layouts

## Animation
- Page transitions using framer-motion
- Staggered list animations
- Counter animations for statistics
- Hover effects on cards and buttons

## Future Enhancements
- Real-time notifications for approval/rejection
- Team-based missions
- Achievement badges
- Point history/transaction log
- Export leaderboard data
- Mission categories and filtering
- Automated email notifications
- Point expiration system
- Reward reservation system

## Development Scripts

```bash
# Seed missions to database
pnpm db:seed-missions

# Make a user admin
pnpm db:make-admin

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Testing User Journey

1. **Registration/Login**: User signs up or logs in
2. **View Dashboard**: Check initial stats (0 points, Rookie rank)
3. **Browse Missions**: View available missions
4. **Upload Proof**: Select mission and upload file
5. **Admin Review**: Admin approves/rejects submission
6. **Points Update**: User sees updated points and rank
7. **View Leaderboard**: Check position among other users
8. **Redeem Reward**: Browse and redeem rewards with points
9. **Support**: Access FAQ and contact support if needed

## Troubleshooting

### Common Issues
1. **Upload fails**: Check AWS credentials and S3 bucket permissions
2. **Points not updating**: Verify admin approval workflow
3. **Leaderboard not showing**: Check database connection and User model
4. **Rank not updating**: Review rank thresholds in verify route

### Debugging
- Check browser console for client-side errors
- Review server logs for API errors
- Verify MongoDB connection
- Test S3 upload permissions
- Confirm NextAuth session validity

# Rank System Update - Implementation Guide

## Overview
The ZE Club rank system has been updated to match the official ZE Club Points system with new rank names, thresholds, and badge images.

## New Rank System

Based on the official ZE Club Points documentation:

| Rank | Points Required | Badge Image |
|------|----------------|-------------|
| **Rookie** | 0 - 99 | rookie.png |
| **Contender** | 100 - 249 | contender.png |
| **Gladiator** | 250 - 499 | gladiator.png |
| **Vanguard** | 500 - 999 | vanguard.png |
| **Errorless Legend** | 1000+ | errorless-legend.png |

## Required Images

You need to save the 5 rank badge PNG images to:
```
/public/images/ranks/
```

**Image files needed:**
1. `rookie.png` - Rookie rank badge (red shield with stars)
2. `contender.png` - Contender rank badge (red/white shield design)
3. `gladiator.png` - Gladiator rank badge (helmet with crossed weapons)
4. `vanguard.png` - Vanguard rank badge (military V with star)
5. `errorless-legend.png` - Errorless Legend rank badge (crown with laurels)

All images should be PNG format, transparent background recommended, approximately 512x512 pixels for best quality.

## Files Updated

### Core System Files
- **`app/api/admin/submissions/verify/route.ts`** - Updated rank thresholds and calculation logic
- **`models/user.ts`** - Updated default rank icon path and nextRankPoints

### UI Components
- **`components/ze-club/RankBadge.tsx`** - Updated rank colors, gradients, and glow effects
- **`components/ze-club/RankCard.tsx`** - Updated rank order, colors, borders, accents, and benefits
- **`components/ze-club/RankProgressBar.tsx`** - Updated rank color gradients and max rank check
- **`components/ze-club/Leaderboard.tsx`** - Updated rank filter buttons and tier colors
- **`components/ze-club/SupportContent.tsx`** - Updated FAQ to reflect new rank names

### Database Migration
- **`scripts/migrate-to-new-ranks.ts`** - New migration script to update existing users

## Setup Instructions

### Step 1: Add Rank Badge Images
1. Navigate to `/public/images/ranks/` directory
2. Add all 5 rank badge PNG files with the exact filenames listed above
3. Ensure images are properly sized (recommended: 512x512px)

### Step 2: Run Database Migration
If you have existing users in the database, run the migration script to update them to the new rank system:

```bash
pnpm db:migrate-to-new-ranks
```

This will:
- Recalculate all user ranks based on their current points
- Update rank icons to use the new image paths
- Update progress tracking for the new rank thresholds
- Display a summary of all updates

### Step 3: Verify Changes
1. Check the leaderboard to see updated rank badges
2. View user profiles to confirm rank badges display correctly
3. Complete a mission as a test user to verify rank progression works

## How It Works

### Rank Calculation
When a mission is approved by an admin:
1. User receives mission points
2. System calculates new total points
3. Rank is automatically updated based on point thresholds
4. Progress to next rank is recalculated
5. Rank icon is updated to match new rank

### Rank Display
Ranks are displayed with:
- **Rank Badge**: PNG image from `/public/images/ranks/`
- **Rank Name**: Text label (e.g., "Contender")
- **Progress Bar**: Visual indicator of progress to next rank
- **Rank Benefits**: List of perks unlocked at each rank tier

## Color Scheme

Each rank has associated red/orange gradient colors:

- **Rookie**: `#DC2626` → `#991B1B` (Deep Red)
- **Contender**: `#EF4444` → `#DC2626` (Red)
- **Gladiator**: `#F97316` → `#EA580C` (Orange-Red)
- **Vanguard**: `#FB923C` → `#F97316` (Light Orange)
- **Errorless Legend**: `#EAB308` → `#F59E0B` (Yellow-Gold)

## Troubleshooting

### Images Not Displaying
- Verify images are in `/public/images/ranks/` directory
- Check that filenames exactly match (case-sensitive)
- Ensure images are PNG format
- Clear Next.js cache and rebuild: `pnpm build`

### Ranks Not Updating
- Run the migration script: `pnpm db:migrate-to-new-ranks`
- Check MongoDB connection
- Verify user has points in database
- Check browser console for errors

### Progress Bar Issues
- Ensure `nextRankPoints` is correctly set in user document
- Verify `progressToNextRank` calculation is working
- Check that rank thresholds match in all files

## Testing

Test the rank system by:

1. **Creating a test user** via Discord OAuth
2. **Completing missions** at different point levels:
   - 50 points → Should be Rookie
   - 150 points → Should be Contender
   - 300 points → Should be Gladiator
   - 600 points → Should be Vanguard
   - 1200 points → Should be Errorless Legend

3. **Verifying displays** on:
   - Dashboard (`/ze-club`)
   - Profile page (`/profile`)
   - Leaderboard (`/ze-club/leaderboard`)
   - Mission submission history

## Notes

- Rank updates happen automatically when missions are approved
- Users cannot manually change their rank
- Rank progression is one-way (ranks never decrease even if points are spent)
- The highest rank (Errorless Legend) has no upper limit
- All rank calculations are done server-side for security

## Related Files

- Rank thresholds: `app/api/admin/submissions/verify/route.ts` (lines 15-21)
- User model: `models/user.ts`
- Rank display components: `components/ze-club/Rank*.tsx`
- Migration script: `scripts/migrate-to-new-ranks.ts`

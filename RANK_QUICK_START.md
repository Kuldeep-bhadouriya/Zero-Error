# Quick Start: New Rank System

## What Changed

✅ **Updated rank system** to match official ZE Club Points PDF:
- Rookie: 0-99 pts
- Contender: 100-249 pts  
- Gladiator: 250-499 pts
- Vanguard: 500-999 pts
- Errorless Legend: 1000+ pts

## Action Required

### 1. Add Rank Badge Images (IMPORTANT!)

You have 5 rank badge PNG images. Save them to:

```
/public/images/ranks/
```

With these exact filenames:
- `rookie.png`
- `contender.png`
- `gladiator.png`
- `vanguard.png`
- `errorless-legend.png`

### 2. Run Database Migration

After adding the images, run:

```bash
pnpm db:migrate-to-new-ranks
```

This updates all existing users to the new rank system.

### 3. Test

Visit these pages to verify everything works:
- `/ze-club` - Dashboard with rank card
- `/ze-club/leaderboard` - See rank badges
- `/profile` - User profile with rank display

## Files Modified

**Core Logic:**
- `app/api/admin/submissions/verify/route.ts` - Rank calculation
- `models/user.ts` - User schema defaults

**UI Components:**
- `components/ze-club/RankBadge.tsx` - Rank badge display
- `components/ze-club/RankCard.tsx` - Rank progress card
- `components/ze-club/RankProgressBar.tsx` - Progress bar
- `components/ze-club/Leaderboard.tsx` - Leaderboard ranks
- `components/ze-club/SupportContent.tsx` - FAQ

**Scripts:**
- `scripts/migrate-to-new-ranks.ts` - Migration tool

**Docs:**
- `RANK_SYSTEM_UPDATE.md` - Full documentation

## Need Help?

See `RANK_SYSTEM_UPDATE.md` for detailed documentation and troubleshooting.

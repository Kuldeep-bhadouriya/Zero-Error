/**
 * Script to fix all users with missing or invalid data:
 * - Ensures all users have a zeTag starting with ze_
 * - Ensures all users have valid rank and rankIcon
 * - Ensures all users have proper experience and points
 * - Ensures all users have zeCoins
 */

import mongoose from 'mongoose';
import User from '../models/user';
import * as dotenv from 'dotenv';
import { customAlphabet } from 'nanoid';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables');
}

const RANKS = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
] as const;

function getRankForExperience(experience: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (experience >= RANKS[i].points) return RANKS[i];
  }
  return RANKS[0];
}

const zeSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

async function generateUniqueZeTag() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `ze_${zeSuffix()}`;
    const exists = await User.exists({ zeTag: candidate });
    if (!exists) return candidate;
  }
  return `ze_${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)()}`;
}

async function fixUserData() {
  console.log('🔧 Starting user data fix...\n');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Get all users
  const users = await User.find({});
  console.log(`📊 Found ${users.length} users to check\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const user of users) {
    let needsUpdate = false;
    const updates: any = {};

    // Check zeTag
    if (!user.zeTag || user.zeTag.length === 0 || !user.zeTag.startsWith('ze_')) {
      updates.zeTag = await generateUniqueZeTag();
      needsUpdate = true;
      console.log(`  ➜ User ${user.email || user._id}: Setting zeTag to ${updates.zeTag}`);
    }

    // Check experience and points
    const rawPoints = typeof user.points === 'number' ? user.points : 0;
    const rawExperience = typeof user.experience === 'number' ? user.experience : rawPoints;
    
    if (typeof user.experience !== 'number') {
      updates.experience = rawExperience;
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting experience to ${rawExperience}`);
    }

    if (typeof user.points !== 'number' || user.points !== rawExperience) {
      updates.points = rawExperience;
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting points to ${rawExperience}`);
    }

    // Check zeCoins
    if (typeof user.zeCoins !== 'number') {
      updates.zeCoins = rawPoints;
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting zeCoins to ${rawPoints}`);
    }

    // Check rank and rankIcon
    const experience = updates.experience !== undefined ? updates.experience : user.experience || 0;
    const rankData = getRankForExperience(experience);
    
    if (!user.rank || user.rank.length === 0) {
      updates.rank = rankData.name;
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting rank to ${rankData.name}`);
    }

    if (!user.rankIcon || user.rankIcon.length === 0) {
      updates.rankIcon = rankData.icon;
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting rankIcon to ${rankData.icon}`);
    }

    // Check roles
    if (!user.roles || user.roles.length === 0) {
      updates.roles = ['user'];
      needsUpdate = true;
      console.log(`  ➜ User ${user.zeTag || user.email || user._id}: Setting roles to ['user']`);
    }

    // Update if needed
    if (needsUpdate) {
      await User.findByIdAndUpdate(user._id, { $set: updates });
      updatedCount++;
      console.log(`  ✅ Updated user ${user.zeTag || user.email || user._id}\n`);
    } else {
      skippedCount++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`  ✅ Updated: ${updatedCount} users`);
  console.log(`  ⏭️  Skipped (already valid): ${skippedCount} users`);
  console.log(`  📊 Total: ${users.length} users`);
  console.log('\n✨ User data fix completed!\n');
}

// Run the script
fixUserData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

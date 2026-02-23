import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { errorResponse } from '@/lib/api-response';
import dbConnect from '@/lib/mongodb';
import RedemptionRequest from '@/models/redemptionRequest';
import User from '@/models/user';
import Reward from '@/models/reward';
import { z } from 'zod';
import { badRequestFromZod, objectIdSchema, optionalTextSchema } from '@/lib/validation';
import logger from '@/lib/logger'

const statusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled']);
const updateRedemptionSchema = z.object({
  status: statusSchema.optional(),
  adminNotes: optionalTextSchema('Admin notes', 500),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session || !session.user) {
    return errorResponse('Unauthorized', 401);
  }

  // Check if user has admin role
  if (!session.user.roles?.includes('admin')) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  await dbConnect();

  try {
    const { id } = await params;
    const idParse = objectIdSchema.safeParse(id);
    if (!idParse.success) {
      return NextResponse.json({ message: 'Invalid request ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateRedemptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(badRequestFromZod(parsed.error), { status: 400 });
    }

    const { status, adminNotes } = parsed.data;

    // Find and update the redemption request
    const redemptionRequest = await RedemptionRequest.findById(idParse.data);

    if (!redemptionRequest) {
      return NextResponse.json({ message: 'Redemption request not found' }, { status: 404 });
    }

    // Handle status changes
    if (status && status !== redemptionRequest.status) {
      // If cancelling a non-cancelled request, refund points and restock
      if (status === 'cancelled' && redemptionRequest.status !== 'cancelled') {
        // Refund ZE Coins to user
        await User.findByIdAndUpdate(redemptionRequest.userId, {
          $inc: { zeCoins: redemptionRequest.rewardCost }
        });

        // Restock the reward
        await Reward.findByIdAndUpdate(redemptionRequest.rewardId, {
          $inc: { stock: 1 }
        });
      }
      
      // Update the request status
      redemptionRequest.status = status;
      if (status !== 'pending') {
        redemptionRequest.processedAt = new Date();
        redemptionRequest.processedBy = session.user.id;
      }
    }

    if (adminNotes !== undefined) {
      redemptionRequest.adminNotes = adminNotes;
    }

    await redemptionRequest.save();

    return NextResponse.json({ 
      message: 'Redemption request updated successfully',
      redemptionRequest 
    });

  } catch (error) {
    logger.error('Error updating redemption request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

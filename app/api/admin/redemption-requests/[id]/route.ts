import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import RedemptionRequest from '@/models/redemptionRequest';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has admin role
  if (!session.user.roles?.includes('admin')) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  await dbConnect();

  try {
    const { status, adminNotes } = await req.json();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Request ID is required' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: 'Invalid status. Must be one of: pending, processing, completed, cancelled' 
      }, { status: 400 });
    }

    // Find and update the redemption request
    const redemptionRequest = await RedemptionRequest.findById(id);

    if (!redemptionRequest) {
      return NextResponse.json({ message: 'Redemption request not found' }, { status: 404 });
    }

    // Update fields
    if (status) {
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
    console.error('Error updating redemption request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

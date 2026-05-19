import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { errorResponse } from "@/lib/api-response"
import dbConnect from "@/lib/mongodb"
import MissionSubmission from "@/models/missionSubmission"
import RedemptionRequest from "@/models/redemptionRequest"
import User from "@/models/user"
import { createNoStoreHeaders } from "@/lib/http-cache"
import logger from "@/lib/logger"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return errorResponse("Unauthorized", 401)
  }

  try {
    await dbConnect()

    const user = await User.findOne({ email: session.user.email })
      .select("_id")
      .lean<{ _id: Types.ObjectId } | null>()
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: createNoStoreHeaders() }
      )
    }

    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    const [monthlyAgg, approvedCount, pendingCount, redemptionStats, recentOrders] = await Promise.all([
      MissionSubmission.aggregate([
        {
          $match: {
            user: user._id,
            status: "approved",
            submittedAt: { $gte: startOfYear }
          }
        },
        {
          $lookup: {
            from: "missions",
            localField: "mission",
            foreignField: "_id",
            as: "mission"
          }
        },
        { $unwind: "$mission" },
        {
          $group: {
            _id: { $month: "$submittedAt" },
            xp: { $sum: "$mission.points" }
          }
        }
      ]),
      MissionSubmission.countDocuments({ user: user._id, status: "approved" }),
      MissionSubmission.countDocuments({ user: user._id, status: "pending" }),
      RedemptionRequest.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalSpent: { $sum: "$rewardCost" }
          }
        }
      ]),
      RedemptionRequest.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(6)
        .select("rewardName rewardCost status createdAt")
        .lean<{
          _id: Types.ObjectId
          rewardName: string
          rewardCost: number
          status: string
          createdAt: Date
        }[]>()
    ])

    const monthlyXp = Array.from({ length: 12 }, () => 0)
    monthlyAgg.forEach((row: { _id: number; xp: number }) => {
      if (row._id >= 1 && row._id <= 12) {
        monthlyXp[row._id - 1] = row.xp
      }
    })

    const redemptionSummary = redemptionStats[0] ?? { count: 0, totalSpent: 0 }
    const serviceUsage = [
      { label: "Missions", value: approvedCount },
      { label: "Submissions", value: pendingCount },
      { label: "Redemptions", value: redemptionSummary.count },
      { label: "Coins Spent", value: redemptionSummary.totalSpent }
    ]

    const formattedOrders = recentOrders.map((order) => ({
      id: order._id.toString(),
      label: order.rewardName,
      status: order.status,
      amount: order.rewardCost,
      createdAt: order.createdAt,
    }))

    return NextResponse.json(
      {
        monthlyXp,
        serviceUsage,
        recentOrders: formattedOrders,
      },
      { headers: createNoStoreHeaders() }
    )
  } catch (error) {
    logger.error("Error fetching ZE Club activity:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: createNoStoreHeaders() }
    )
  }
}

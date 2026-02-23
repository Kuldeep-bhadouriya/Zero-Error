import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Event from "@/models/event";
import User from "@/models/user";
import Reward from "@/models/reward";
import { revalidatePath } from "next/cache";
import logger from '@/lib/logger'

const f = createUploadthing();

/**
 * UploadThing File Router Configuration
 * Defines upload endpoints with authentication and file validation
 */
export const ourFileRouter = {
  // Profile photo uploader endpoint
  profilePhotoUploader: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Authenticate user via NextAuth
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      // Return user data to be available in onUploadComplete
      return {
        userEmail: session.user.email,
        userId: session.user.id
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("Upload complete for user:", metadata.userEmail);
      logger.info("File URL:", file.url);

      await dbConnect();
      await User.findByIdAndUpdate(
        metadata.userId,
        { $set: { profilePhotoUrl: file.url } }
      );

      // Revalidate paths to refresh the photo everywhere
      revalidatePath('/profile');
      revalidatePath('/ze-club');
      revalidatePath('/', 'layout');

      // Return data to the client
      return {
        uploadedBy: metadata.userEmail,
        fileUrl: file.url
      };
    }),

  // Mission proof uploader endpoint
  missionProofUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    video: { maxFileSize: "2GB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Authenticate user via NextAuth
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      // Return user data to be available in onUploadComplete
      return { 
        userEmail: session.user.email,
        userId: session.user.id 
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("Upload complete for user:", metadata.userEmail);
      logger.info("File URL:", file.url);

      // Return data to the client
      return { 
        uploadedBy: metadata.userEmail,
        fileUrl: file.url 
      };
    }),

  // Hero media uploader endpoint (admin-only)
  heroMediaUploader: f({
    video: { maxFileSize: "2GB", maxFileCount: 1 },
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Authenticate and verify admin role
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      if (!session.user.roles?.includes('admin')) {
        throw new Error("Admin access required");
      }

      // Return admin data to be available in onUploadComplete
      return { 
        userEmail: session.user.email,
        userId: session.user.id,
        isAdmin: true
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("Hero media upload complete by admin:", metadata.userEmail);
      logger.info("File URL:", file.url);

      // Return data to the client
      return { 
        uploadedBy: metadata.userEmail,
        fileUrl: file.url 
      };
    }),

  // Event image uploader endpoint (admin-only)
  eventImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ eventId: z.string().optional() }))
    .middleware(async ({ input }) => {
      // Authenticate and verify admin role
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      if (!session.user.roles?.includes('admin')) {
        throw new Error("Admin access required");
      }
      
      // Return admin data and eventId to be available in onUploadComplete
      return { 
        userEmail: session.user.email,
        userId: session.user.id,
        isAdmin: true,
        eventId: input.eventId
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("Event image upload complete by admin:", metadata.userEmail);
      logger.info("File URL:", file.url);

      if (metadata.eventId) {
        await dbConnect();
        await Event.findByIdAndUpdate(metadata.eventId, {
          $set: { imageUrl: file.url },
        });

        // Revalidate paths
        revalidatePath('/events');
        revalidatePath('/api/events');
        revalidatePath('/');
      }

      // Return data to the client
      return { 
        uploadedBy: metadata.userEmail,
        fileUrl: file.url 
      };
    }),

  // Mission example image uploader endpoint (admin-only)
  missionExampleUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ missionId: z.string().optional() }))
    .middleware(async ({ input }) => {
      // Authenticate and verify admin role
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      if (!session.user.roles?.includes('admin')) {
        throw new Error("Admin access required");
      }
      
      // Return admin data and missionId to be available in onUploadComplete
      return { 
        userEmail: session.user.email,
        userId: session.user.id,
        isAdmin: true,
        missionId: input.missionId
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("Mission example image upload complete by admin:", metadata.userEmail);
      logger.info("File URL:", file.url);

      // Return data to the client
      return { 
        uploadedBy: metadata.userEmail,
        fileUrl: file.url 
      };
    }),

  // Reward image uploader endpoint (admin-only)
  rewardImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .input(z.object({ rewardId: z.string().optional() }))
    .middleware(async ({ input }) => {
      // Authenticate and verify admin role
      const session = await auth();

      if (!session?.user?.email) {
        throw new Error("Unauthorized");
      }

      if (!session.user.roles?.includes('admin')) {
        throw new Error("Admin access required");
      }
      
      // Return admin data and rewardId to be available in onUploadComplete
      return { 
        userEmail: session.user.email,
        userId: session.user.id,
        isAdmin: true,
        rewardId: input.rewardId
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on the server after upload completes
      logger.info("🎯 Reward image upload complete by admin:", metadata.userEmail);
      logger.info("📸 File URL:", file.url);
      logger.info("🆔 Reward ID:", metadata.rewardId);

      if (metadata.rewardId) {
        try {
          await dbConnect();
          logger.info("✅ Database connected");
          
          const updatedReward = await Reward.findByIdAndUpdate(
            metadata.rewardId,
            { $set: { imageUrl: file.url } },
            { new: true }
          );

          if (updatedReward) {
            logger.info("✅ Reward updated successfully:", {
              id: updatedReward._id,
              name: updatedReward.name,
              imageUrl: updatedReward.imageUrl
            });
          } else {
            logger.error("❌ Reward not found with ID:", metadata.rewardId);
          }

          // Revalidate paths
          revalidatePath('/ze-club/rewards');
          revalidatePath('/admin/ze-club');
          logger.info("✅ Paths revalidated");
        } catch (error) {
          logger.error("❌ Error updating reward with image:", error);
        }
      } else {
        logger.warn("⚠️ No rewardId provided, skipping database update");
      }

      // Return data to the client
      return { 
        uploadedBy: metadata.userEmail,
        fileUrl: file.url 
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

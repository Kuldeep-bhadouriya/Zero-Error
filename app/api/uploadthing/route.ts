import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

/**
 * Export routes for Next.js App Router
 * Handles GET and POST requests for UploadThing
 */
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  
  // Optional: Add custom config
  config: {
    // callbackUrl: `${process.env.NEXTAUTH_URL}/api/uploadthing`,
  },
});

"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnnouncementBanner from "@/components/shared/AnnouncementBanner";

import { SessionProvider } from "next-auth/react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const isAdminRoute = pathname?.startsWith("/admin");
  const isZeClubRoute = pathname?.startsWith("/ze-club");
  const shouldHideFooter = isAdminRoute || isZeClubRoute;
  const shouldOffsetContent = isAdminRoute || isZeClubRoute;

  useEffect(() => {
    // Check if we've shown the loader before
    const hasLoadedBefore = sessionStorage.getItem("hasLoadedSite");
    if (hasLoadedBefore) {
      setIsLoading(false);
    } else {
      const timer = setTimeout(() => setIsLoading(false), 3000);
      sessionStorage.setItem("hasLoadedSite", "true");
      return () => clearTimeout(timer);
    }
  }, []);

  // Reset any animation state when route changes
  useEffect(() => {
    // Force a layout recalculation
    document.body.style.opacity = "0.99";
    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 10);
  }, [pathname]);

  return (
    <SessionProvider>
      {!isLoading && <Navbar />}
      {!isLoading && !isAdminRoute && <AnnouncementBanner />}
      {shouldOffsetContent ? (
        <div>{children}</div>
      ) : (
        children
      )}
      {!shouldHideFooter && <Footer />}
    </SessionProvider>
  );
}

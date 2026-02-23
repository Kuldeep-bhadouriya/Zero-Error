"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import AnnouncementBanner from "@/components/shared/AnnouncementBanner";
import QueryProvider from "@/components/providers/query-provider";

import { SessionProvider } from "next-auth/react";

const CSRF_COOKIE_NAME = "ze_csrf_token";
const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

function getCookie(name: string) {
  const parts = document.cookie ? document.cookie.split("; ") : [];
  const prefix = `${name}=`;
  const match = parts.find((part) => part.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function generateCsrfToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function ensureClientCsrfCookie() {
  if (getCookie(CSRF_COOKIE_NAME)) {
    return;
  }

  const token = generateCsrfToken();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
}

function shouldAttachCsrf(input: RequestInfo | URL, init?: RequestInit) {
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return false;
  }

  const url =
    typeof input === "string"
      ? new URL(input, window.location.origin)
      : input instanceof URL
        ? input
        : new URL(input.url, window.location.origin);

  if (url.origin !== window.location.origin || !url.pathname.startsWith("/api/")) {
    return false;
  }

  if (url.pathname.startsWith("/api/auth/") || url.pathname.startsWith("/api/uploadthing")) {
    return false;
  }

  return true;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const hasLoadedBefore = window.sessionStorage.getItem("hasLoadedSite");
    return !hasLoadedBefore;
  });
  const isAdminRoute = pathname?.startsWith("/admin");
  const isZeClubRoute = pathname?.startsWith("/ze-club");
  const isProfileRoute = pathname === "/profile";
  const shouldHideFooter = isAdminRoute || isZeClubRoute || isProfileRoute;
  const shouldOffsetContent = isAdminRoute || isZeClubRoute;

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timer = setTimeout(() => setIsLoading(false), 3000);
    sessionStorage.setItem("hasLoadedSite", "true");
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Reset any animation state when route changes
  useEffect(() => {
    // Force a layout recalculation
    document.body.style.opacity = "0.99";
    setTimeout(() => {
      document.body.style.opacity = "1";
    }, 10);
  }, [pathname]);

  useEffect(() => {
    ensureClientCsrfCookie();

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!shouldAttachCsrf(input, init)) {
        return originalFetch(input, init);
      }

      const token = getCookie(CSRF_COOKIE_NAME);
      if (!token) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
      if (!headers.has("x-csrf-token")) {
        headers.set("x-csrf-token", token);
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <SessionProvider>
      <QueryProvider>
        {!isLoading && <Navbar />}
        {!isLoading && !isAdminRoute && <AnnouncementBanner />}
        {shouldOffsetContent ? (
          <div>{children}</div>
        ) : (
          children
        )}
        {!shouldHideFooter && <Footer />}
      </QueryProvider>
    </SessionProvider>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronRight,
  LogOut,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Navbar as ResizableNavbar,
  NavBody,
  NavItems,
} from "@/components/ui/resizable-navbar";

// Navigation links data
const navLinks = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Events", path: "/events" },
  { name: "ZE Club", path: "/ze-club" },
  { name: "Services", path: "/services" },
  { name: "Teams", path: "/teams" },
  { name: "Contact Us", path: "/contact" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // New mobile menu animation variants
  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      y: -20,
      scale: 0.95,
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
  };

  const renderAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="w-24 h-10 rounded-full bg-gray-700 animate-pulse" />
      );
    }

    if (session) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage 
                  src={session.user?.profilePhotoUrl || session.user?.image || undefined} 
                  alt={session.user?.name ?? "User"} 
                />
                <AvatarFallback>
                  {session.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-black/80 border-red-500/30 text-white">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-red-500/30" />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2 },
        }}
      >
        <Link
          href="/join-us"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-red-700 to-red-500 text-white text-sm font-semibold uppercase tracking-[0.06em] transition-all hover:shadow-lg hover:shadow-red-500/30"
        >
          Join Us
        </Link>
      </motion.div>
    );
  };

  const renderMobileAuthButton = () => {
    if (status === "loading") {
      return (
        <div className="w-full h-12 rounded-md bg-gray-700 animate-pulse" />
      );
    }

    if (session) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <button
            onClick={() => signOut()}
            className="block w-full text-center px-6 py-3 rounded-md bg-gradient-to-r from-red-700 to-red-500 text-white text-lg font-medium shadow-lg shadow-red-900/30"
          >
            Logout
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Link
          href="/join-us"
          className={`block w-full text-center px-6 py-3 rounded-md bg-gradient-to-r from-red-700 to-red-500 text-white text-lg font-semibold uppercase tracking-[0.06em] shadow-lg shadow-red-900/30`}
          onClick={() => setIsMenuOpen(false)}
        >
          Join Us
        </Link>
      </motion.div>
    );
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[100] hidden px-4 pt-3 lg:block">
        <ResizableNavbar className="top-0">
          <NavBody className="max-w-[88%] border border-red-500/20 bg-black/80 px-6 py-3 shadow-[0_8px_32px_rgba(255,0,0,0.25)] backdrop-blur-md">
            <Link href="/" className="relative z-20">
              <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
                <Image
                  src="/images/favicon.png"
                  alt="Zero Error Esports"
                  width={36}
                  height={18}
                  className="rounded-full"
                  priority
                />
              </motion.div>
            </Link>

            <NavItems
              items={navLinks.map((link) => ({
                name: link.name,
                link: link.path,
              }))}
              className="text-gray-200"
            />

            <div className="relative z-20 flex items-center">
              {renderAuthButton()}
            </div>
          </NavBody>
        </ResizableNavbar>
      </div>

      {/* Mobile Navbar - Visible on tablet/mobile (below lg), hidden on desktop */}
      <div className="fixed top-0 left-0 right-0 z-[100] lg:hidden">
        {/* Top bar with logo and menu button - relative z-20 ensures it stays above the menu overlay */}
        <motion.div
          className="relative z-20 flex items-center justify-between px-5 py-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="z-20">
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/images/favicon.png"
                alt="Zero Error Esports"
                width={40}
                height={20}
                className="rounded-full"
                priority
              />
            </motion.div>
          </Link>

          <motion.button
            className="z-20 bg-black/80 p-2 rounded-full border border-red-500/20"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={24} className="text-red-500" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={24} className="text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Full-screen mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              className="fixed inset-0 bg-gradient-to-b from-black via-black/95 to-red-950/90 backdrop-blur-md z-10 flex flex-col"
              initial="closed"
              animate="open"
              exit="closed"
              variants={mobileMenuVariants}
            >
              <div className="flex flex-col justify-center h-full px-8 pt-20 pb-8">
                {/* Links */}
                <nav className="flex flex-col space-y-6 mb-10">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.1 + index * 0.08,
                        ease: "easeOut",
                      }}
                    >
                      <Link
                        href={link.path}
                        className={`flex items-center justify-between text-xl font-semibold uppercase tracking-[0.06em] ${
                          pathname === link.path ? "text-red-500" : "text-white"
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>{link.name}</span>
                        <ChevronRight
                          className={`h-5 w-5 ${
                            pathname === link.path
                              ? "text-red-500"
                              : "text-red-500/50"
                          }`}
                        />
                      </Link>
                      <motion.div
                        className="h-px bg-gradient-to-r from-red-800/30 via-red-500/20 to-transparent mt-4"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{
                          scaleX: 1,
                          opacity: 1,
                          transition: {
                            delay: 0.2 + index * 0.08,
                            duration: 0.5,
                          },
                        }}
                      />
                    </motion.div>
                  ))}
                </nav>

                {/* Auth buttons */}
                <div className="mt-auto space-y-4">
                  {renderMobileAuthButton()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

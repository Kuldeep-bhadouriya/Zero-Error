"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronRight, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Handle scroll effect with smoother detection
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  const headerVariants = {
    expanded: {
      maxWidth: "88%",
      padding: "0.55rem 2.25rem",
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(75,0,0,0.8) 50%, rgba(0,0,0,0.8) 100%)",
      boxShadow: "0 8px 32px rgba(255, 0, 0, 0.25)",
      borderColor: "rgba(255, 0, 0, 0.25)",
    },
    collapsed: {
      maxWidth: "78%",
      padding: "0.55rem 1.2rem",
      background:
        "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, rgba(75,0,0,0.9) 50%, rgba(0,0,0,0.95) 100%)",
      boxShadow: "0 4px 20px rgba(255, 0, 0, 0.35)",
      borderColor: "rgba(255, 0, 0, 0.4)",
    },
  };

  const navItemVariants = {
    expanded: (i: number) => ({
      opacity: 1,
      y: 0,
    }),
    collapsed: {
      opacity: 0.95,
      y: 0,
    },
  };

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

  const AuthButton = () => {
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
              <Avatar>
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
          className={`px-5 py-2 rounded-full bg-gradient-to-r from-red-700 to-red-500 text-white font-medium transition-all hover:shadow-lg hover:shadow-red-500/30 ${
            scrolled ? "text-xs" : "text-sm"
          }`}
        >
          Join Us
        </Link>
      </motion.div>
    );
  };

  const MobileAuthButton = () => {
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
          className="block w-full text-center px-6 py-3 rounded-md bg-gradient-to-r from-red-700 to-red-500 text-white text-lg font-medium shadow-lg shadow-red-900/30"
          onClick={() => setIsMenuOpen(false)}
        >
          Join Us
        </Link>
      </motion.div>
    );
  };

  return (
    <>
      {/* Desktop Navbar - Hidden on mobile */}
      <div className="fixed top-0 left-0 right-0 flex justify-center z-[100] pt-3 px-4 hidden md:flex">
        <motion.header
          className="rounded-full backdrop-blur-md border w-auto"
          variants={headerVariants}
          animate={scrolled ? "collapsed" : "expanded"}
          initial="expanded"
        >
          <div className="flex items-center justify-between gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, rotate: -10 }}
                animate={{
                  opacity: 1,
                  rotate: 0,
                  scale: scrolled ? 1 : 1.1,
                  transition: { duration: 0.5 },
                }}
                whileHover={{
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.2 },
                }}
              >
                <Image
                  src="/images/favicon.png"
                  alt="Zero Error Esports"
                  width={45}
                  height={23}
                  className="rounded-full"
                  priority
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <motion.nav
              className="flex items-center"
              animate={{
                gap: scrolled ? "1.2rem" : "2rem",
                transition: { duration: 0.6, ease: "easeInOut" },
              }}
            >
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  custom={index}
                  variants={navItemVariants}
                  initial="collapsed"
                  animate={scrolled ? "collapsed" : "expanded"}
                  className="group relative"
                >
                  <Link
                    href={link.path}
                    className={`relative px-1 py-1 font-medium transition-all ${
                      scrolled ? "text-sm" : "text-base"
                    } ${
                      pathname === link.path ? "text-red-500" : "text-gray-200"
                    } hover:text-red-400`}
                  >
                    {link.name}
                    <motion.span
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-600 to-red-400 rounded-full transform origin-left"
                      initial={{ scaleX: pathname === link.path ? 1 : 0 }}
                      animate={{
                        scaleX: pathname === link.path ? 1 : 0,
                        transition: { duration: 0.3 },
                      }}
                      whileHover={{
                        scaleX: 1,
                        transition: { duration: 0.2 },
                      }}
                    />
                  </Link>
                </motion.div>
              ))}
            </motion.nav>

            {/* Auth Buttons */}
            <motion.div
              className="flex items-center"
              animate={{
                gap: scrolled ? "0.65rem" : "1rem",
                transition: { duration: 0.6, ease: "easeInOut" },
              }}
            >
              <AuthButton />
            </motion.div>
          </div>
        </motion.header>
      </div>

      {/* Mobile Navbar - Hidden on desktop */}
      <div className="fixed top-0 left-0 right-0 z-[100] md:hidden">
        {/* Top bar with logo and menu button */}
        <motion.div
          className="flex items-center justify-between px-5 py-4"
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
                        className={`flex items-center justify-between text-2xl font-semibold ${
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
                  <MobileAuthButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

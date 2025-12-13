"use client";

import type React from "react";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, User, MessageSquare, Send } from "lucide-react";

interface ContactUsProps {
  className?: string;
  onSubmit?: (formData: FormData) => Promise<void>;
}

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactUs({
  className = "",
  onSubmit,
}: ContactUsProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Send email via API
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Error response:', data);
          throw new Error(data.error || 'Failed to send message');
        }

        console.log('Email sent successfully:', data);
      }

      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });

      // Reset status after 3 seconds
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus("error");
      setTimeout(() => {
        setSubmitStatus("idle");
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1.0] },
    },
  };

  return (
    <motion.div
      className={`bg-black text-white py-16 relative overflow-hidden ${className} pt-32`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0.5)_2px,transparent_2px),linear-gradient(90deg,rgba(20,20,20,0.5)_2px,transparent_2px)] bg-[size:40px_40px] opacity-30"></div>

        {/* Floating orb */}
        <motion.div
          className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-red-600/10 filter blur-[100px]"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        {/* Scan lines */}
        <div className="absolute inset-0 scan-lines opacity-20"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-orbitron mb-4">
            <span className="text-red-600 glow-text">CONTACT</span> US
          </h2>
          <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
            Ready to join the elite? Have questions about our tournaments? Get
            in touch with the Zero Error Esports team.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <motion.div variants={itemVariants} className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6 font-orbitron">
                <span className="text-red-600">GET IN</span> TOUCH
              </h3>
              <p className="text-zinc-400 mb-8">
                Whether you're looking to join our team, sponsor an event, or
                just want to connect with fellow gamers, we'd love to hear from
                you.
              </p>
            </div>

            {/* Social Media Links */}
            <div className="space-y-6">
              <motion.a
                href="https://discord.gg/zJfncArJMT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 group"
                whileHover={{ x: 5, borderColor: "rgba(114,137,218,0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-indigo-600/20 p-3 rounded-full group-hover:bg-indigo-600/30 transition-colors">
                  <svg
                    className="h-5 w-5 text-indigo-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                    Discord
                  </h4>
                  <p className="text-zinc-400">Join our gaming community</p>
                </div>
              </motion.a>

              <motion.a
                href="https://x.com/ZeroErrorES"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 group"
                whileHover={{ x: 5, borderColor: "rgba(29,161,242,0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-blue-600/20 p-3 rounded-full group-hover:bg-blue-600/30 transition-colors">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                    Twitter
                  </h4>
                  <p className="text-zinc-400">Follow for updates & news</p>
                </div>
              </motion.a>

              <motion.a
                href="https://www.instagram.com/zero_error_esports?igsh=NHMyYXNtZWZ4cXg="
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 group"
                whileHover={{ x: 5, borderColor: "rgba(225,48,108,0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-pink-600/20 p-3 rounded-full group-hover:bg-pink-600/30 transition-colors">
                  <svg
                    className="h-5 w-5 text-pink-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.928-.875 2.079-1.365 3.323-1.365s2.395.49 3.323 1.365c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.928.796-2.026 1.297-3.323 1.297zm7.83-9.405c-.49 0-.928-.438-.928-.928s.438-.928.928-.928.928.438.928.928-.438.928-.928.928zm-3.323 9.405c-1.297 0-2.448-.49-3.323-1.297-.875-.807-1.365-1.958-1.365-3.255s.49-2.448 1.365-3.323c.875-.875 2.026-1.365 3.323-1.365s2.448.49 3.323 1.365c.875.875 1.365 2.026 1.365 3.323s-.49 2.448-1.365 3.255c-.875.807-2.026 1.297-3.323 1.297z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-pink-400 transition-colors">
                    Instagram
                  </h4>
                  <p className="text-zinc-400">Behind the scenes content</p>
                </div>
              </motion.a>

              <motion.a
                href="https://chat.whatsapp.com/JizYMt07dikCGwgqwlMGH2?mode=ac_t"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 group"
                whileHover={{ x: 5, borderColor: "rgba(37,211,102,0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-green-600/20 p-3 rounded-full group-hover:bg-green-600/30 transition-colors">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-green-400 transition-colors">
                    WhatsApp
                  </h4>
                  <p className="text-zinc-400">Direct messaging & support</p>
                </div>
              </motion.a>

              <motion.a
                href="https://www.youtube.com/@ZeroErrorEsports/videos"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 group"
                whileHover={{ x: 5, borderColor: "rgba(255,0,0,0.5)" }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-red-600/20 p-3 rounded-full group-hover:bg-red-600/30 transition-colors">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-white group-hover:text-red-400 transition-colors">
                    YouTube
                  </h4>
                  <p className="text-zinc-400">
                    Tournament highlights & guides
                  </p>
                </div>
              </motion.a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div variants={itemVariants}>
            <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold mb-6 font-orbitron">
                <span className="text-red-600">SEND</span> MESSAGE
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Subject
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 h-5 w-5" />
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                      placeholder="What's this about?"
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-zinc-300 mb-2"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-3 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all resize-none"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-lg font-bold flex items-center justify-center shadow-[0_0_15px_rgba(150,0,0,0.3)] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={
                    !isSubmitting
                      ? {
                          scale: 1.02,
                          boxShadow: "0 0 25px rgba(220,0,0,0.4)",
                        }
                      : {}
                  }
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-600/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center">
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </span>
                </motion.button>

                {/* Status Messages */}
                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 text-green-400"
                  >
                    <p className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Message sent successfully! We'll get back to you soon.
                    </p>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-red-400"
                  >
                    <p className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Something went wrong. Please try again.
                    </p>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

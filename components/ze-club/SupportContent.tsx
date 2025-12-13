'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { GlassCard } from '@/components/ui/GlassCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export default function SupportContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
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
      
      toast({
        title: 'Support Request Submitted',
        description: 'We will get back to you within 24-48 hours.',
      });
      
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const faqData = [
    {
      question: 'What is ZE Club?',
      answer: 'ZE Club is Zero Error Esports\' loyalty program where members can earn points by completing missions, participating in events, and engaging with our community. Points can be redeemed for exclusive rewards and merchandise.',
    },
    {
      question: 'How do I earn ZE Points?',
      answer: 'You can earn ZE Points by completing missions such as sharing our events on social media, participating in tournaments, creating content, and engaging with our community. Each mission has specific requirements and point values.',
    },
    {
      question: 'How long does mission verification take?',
      answer: 'Mission submissions are typically verified within 24-48 hours. You will be notified once your submission has been reviewed. Make sure to submit clear proof of completion to expedite the process.',
    },
    {
      question: 'What kind of rewards can I redeem?',
      answer: 'Rewards include exclusive merchandise, tournament entry fee waivers, gaming accessories, and special perks at Zero Error events. The catalog is regularly updated with new items.',
    },
    {
      question: 'How do ranks work?',
      answer: 'Your rank is determined by your total ZE Points. As you accumulate more points, you progress through ranks like Contender, Gladiator, Vanguard, and Errorless Legend. Higher ranks may unlock exclusive benefits.',
    },
    {
      question: 'Can I transfer my points to someone else?',
      answer: 'No, ZE Points are non-transferable and tied to your individual account. However, you can participate in team missions to earn points collectively.',
    },
    {
      question: 'What happens if my mission is rejected?',
      answer: 'If your mission submission is rejected, you will receive feedback from our admin team explaining the reason. You can resubmit once you address the issues mentioned.',
    },
    {
      question: 'How do I contact support?',
      answer: 'You can use the contact form below to reach our support team, or email us directly at support@zeroerror.in. We typically respond within 24-48 hours.',
    },
  ];

  return (
    <motion.div
      className="relative z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 text-red-500"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Support & Help
      </motion.h1>

      {/* FAQ Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-8 md:mb-12"
      >
        <GlassCard variant="intense" className="p-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-sm md:text-base text-gray-400">
              Find answers to common questions about ZE Club
            </p>
          </div>
          <div>
            <Accordion type="single" collapsible className="w-full">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm md:text-base text-white hover:text-red-500">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm md:text-base text-gray-300">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </GlassCard>
      </motion.div>

      {/* Contact Form Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard variant="intense" gradient="red" className="p-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Contact Support</h2>
            <p className="text-sm md:text-base text-gray-400">
              Can't find what you're looking for? Send us a message!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white text-sm md:text-base">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-sm md:text-base">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    required
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white text-sm md:text-base">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What do you need help with?"
                  required
                  className="bg-black/60 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-white text-sm md:text-base">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  required
                  className="bg-black/60 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm md:text-base"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

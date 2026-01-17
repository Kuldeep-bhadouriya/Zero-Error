'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface RedemptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reward: {
    _id: string;
    name: string;
    cost: number;
  } | null;
  userCoins: number;
  onSuccess: () => void;
}

export function RedemptionDialog({ open, onOpenChange, reward, userCoins, onSuccess }: RedemptionDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    additionalNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reward) return;

    // Check coins again before submission
    if (userCoins < reward.cost) {
      toast({
        title: 'Insufficient ZE Coins 💰',
        description: `You need ${reward.cost - userCoins} more ZE Coins to redeem this reward.`,
        variant: 'destructive',
      });
      onOpenChange(false);
      return;
    }

    // Validate required fields
    if (!formData.contactName || !formData.contactEmail || !formData.contactPhone || !formData.address) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ze-club/redemption-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId: reward._id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // More detailed error handling
        let errorMessage = data.message || 'Failed to submit redemption request';
        
        // Add more context for insufficient coins error
        if (data.message === 'Insufficient ZE Coins' && data.required && data.current !== undefined) {
          errorMessage = `Insufficient ZE Coins. You need ${data.required} coins but only have ${data.current} coins. Please refresh the page.`;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: 'Success! 🎉',
        description: 'Your redemption request has been submitted. Redirecting to your profile to track status...',
      });

      // Reset form
      setFormData({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        additionalNotes: '',
      });

      onOpenChange(false);
      onSuccess();

      // Redirect to profile page with redemptions section
      setTimeout(() => {
        router.push('/profile#redemptions');
      }, 1000);

    } catch (error) {
      console.error('Redemption error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit redemption request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-gray-900 to-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            🎁 Redeem Reward
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {reward && (
              <>
                You're redeeming <span className="font-semibold text-purple-400">{reward.name}</span> for{' '}
                <span className="font-semibold text-yellow-400">{reward.cost} ZE Coins</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contactName" className="text-white">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactName"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-white">
              Email Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPhone" className="text-white">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-white">
              Delivery Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your full delivery address including city, state, and postal code"
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes" className="text-white">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              placeholder="Any special instructions or preferences?"
              className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 min-h-[60px]"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

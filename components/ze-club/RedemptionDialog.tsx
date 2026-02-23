'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Phone, MapPin, User, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import logger from '@/lib/browser-logger'
import { useZeClubStore } from '@/lib/stores/zeClubStore';

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

interface RewardListItem {
  _id: string;
  stock: number;
}

interface DashboardCache {
  zeCoins?: number;
  totalPoints?: number;
}

const REWARDS_QUERY_KEY = ['ze-club', 'rewards'] as const;
const DASHBOARD_QUERY_KEY = ['ze-club', 'dashboard'] as const;

export function RedemptionDialog({ open, onOpenChange, reward, userCoins, onSuccess }: RedemptionDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const setZeCoins = useZeClubStore((state) => state.setZeCoins);
  const hydrateFromDashboard = useZeClubStore((state) => state.hydrateFromDashboard);
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
        title: 'Insufficient ZE Coins',
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

    const redemptionCost = reward.cost;
    const previousDashboard = queryClient.getQueryData<DashboardCache>(DASHBOARD_QUERY_KEY);
    const previousRewards = queryClient.getQueryData<RewardListItem[]>(REWARDS_QUERY_KEY);

    queryClient.setQueryData<DashboardCache>(DASHBOARD_QUERY_KEY, (current) => {
      const currentCoins = current?.zeCoins ?? current?.totalPoints ?? userCoins;
      const nextCoins = Math.max(0, currentCoins - redemptionCost);

      return {
        ...(current ?? {}),
        zeCoins: nextCoins,
        totalPoints: current?.totalPoints,
      };
    });

    queryClient.setQueryData<RewardListItem[]>(REWARDS_QUERY_KEY, (current) => {
      if (!current) {
        return current;
      }

      return current.map((item) => {
        if (item._id !== reward._id) {
          return item;
        }

        return {
          ...item,
          stock: Math.max(0, item.stock - 1),
        };
      });
    });

    setZeCoins(Math.max(0, userCoins - redemptionCost));

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
        let errorMessage = data.message || 'Failed to submit redemption request';
        if (data.message === 'Insufficient ZE Coins' && data.required && data.current !== undefined) {
          errorMessage = `Insufficient ZE Coins. You need ${data.required} coins but only have ${data.current}.`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: 'Redemption Submitted!',
        description: 'Redirecting to your profile to track status...',
        className: "bg-green-900 border-green-800 text-white"
      });

      // Reset form
      setFormData({
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        address: '',
        additionalNotes: '',
      });

      onSuccess();
      onOpenChange(false);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY }),
      ]);

      // Redirect to profile page with redemptions section
      setTimeout(() => {
        router.push('/profile#redemptions');
      }, 1500);

    } catch (error) {
      if (previousDashboard) {
        queryClient.setQueryData(DASHBOARD_QUERY_KEY, previousDashboard);
        hydrateFromDashboard(previousDashboard);
      } else {
        setZeCoins(userCoins);
      }

      if (previousRewards) {
        queryClient.setQueryData(REWARDS_QUERY_KEY, previousRewards);
      }

      logger.error('Redemption error:', error);
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
      <DialogContent className="sm:max-w-[600px] border-white/10 bg-[#09090b]/90 backdrop-blur-xl p-0 overflow-hidden shadow-2xl shadow-purple-900/10">
        <div className="px-6 py-6 border-b border-white/5 bg-gradient-to-r from-purple-500/5 to-transparent">
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            Confirm Redemption
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-1">
             Complete the details below to receive your reward.
          </DialogDescription>
        </div>

        <div className="p-6">
          {reward && (
            <div className="mb-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-4">
               <div className="p-3 bg-purple-500/10 rounded-lg">
                 <CheckCircle2 className="w-5 h-5 text-purple-400" />
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-purple-200">Processing Redemption For:</h4>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-lg font-bold text-white">{reward.name}</span>
                    <span className="text-sm text-gray-400">for</span>
                    <span className="text-lg font-bold text-yellow-500">{reward.cost} Coins</span>
                  </div>
               </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-gray-300 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <Input
                  id="contactName"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="bg-white/5 border-white/10 text-white focus:bg-white/10 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-gray-300 flex items-center gap-2">
                   <Mail className="w-3.5 h-3.5" /> Email
                </Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="bg-white/5 border-white/10 text-white focus:bg-white/10 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone" className="text-gray-300 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> Phone Number
              </Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="bg-white/5 border-white/10 text-white focus:bg-white/10 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-300 flex items-center gap-2">
                 <MapPin className="w-3.5 h-3.5" /> Shipping Address
              </Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full street address, City, ZIP code"
                className="bg-white/5 border-white/10 text-white focus:bg-white/10 transition-colors min-h-[80px] resize-none"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes" className="text-gray-300 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Notes (Optional)
              </Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                placeholder="Gate code, special instructions..."
                className="bg-white/5 border-white/10 text-white focus:bg-white/10 transition-colors min-h-[60px] resize-none"
              />
            </div>

            <DialogFooter className="mt-8 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="hover:bg-white/10 hover:text-white text-gray-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-semibold shadow-lg shadow-red-900/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm & Redeem'
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


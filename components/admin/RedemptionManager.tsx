'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Coins,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  MessageSquare,
  Edit,
  Gift
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RedemptionRequest {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardId: string;
  rewardName: string;
  rewardCost: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  additionalNotes?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export default function RedemptionManager() {
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RedemptionRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const url = filterStatus === 'all' 
        ? '/api/admin/redemption-requests'
        : `/api/admin/redemption-requests?status=${filterStatus}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch redemption requests');
      }

      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load redemption requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function openUpdateDialog(request: RedemptionRequest) {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNotes(request.adminNotes || '');
    setDialogOpen(true);
  }

  async function handleUpdate() {
    if (!selectedRequest) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/redemption-requests/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update redemption request');
      }

      toast({
        title: 'Success',
        description: 'Redemption request updated successfully',
      });

      setDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to update redemption request',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      processing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Loader2 },
      completed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  const filteredRequests = filterStatus === 'all' 
    ? requests 
    : requests.filter(r => r.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🎁 Redemption Requests</h2>
          <p className="text-gray-400">Manage user reward redemptions and fulfillment</p>
        </div>
        
        {/* Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-600 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-600">
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['pending', 'processing', 'completed', 'cancelled'].map((status) => {
          const count = requests.filter(r => r.status === status).length;
          return (
            <GlassCard key={status} variant="subtle" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 capitalize">{status}</p>
                  <p className="text-2xl font-bold text-white mt-1">{count}</p>
                </div>
                {getStatusBadge(status)}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-red-500 animate-spin" />
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {filteredRequests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard variant="intense" className="p-12 text-center">
                <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400">No redemption requests found</p>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard variant="intense" hover className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left Section - Reward Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
                              <Gift className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{request.rewardName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Coins className="h-4 w-4 text-yellow-400" />
                                <span className="text-yellow-400 font-semibold">{request.rewardCost} Coins</span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {/* User Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{request.userName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{request.userEmail}</span>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Contact Details</p>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-gray-300">
                              <User className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">{request.contactName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{request.contactEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{request.contactPhone}</span>
                            </div>
                            <div className="flex items-start gap-2 text-gray-300">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span className="text-sm">{request.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Additional Notes */}
                        {request.additionalNotes && (
                          <div className="border-t border-gray-700 pt-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Additional Notes</p>
                            <p className="text-sm text-gray-300">{request.additionalNotes}</p>
                          </div>
                        )}

                        {/* Admin Notes */}
                        {request.adminNotes && (
                          <div className="border-t border-gray-700 pt-3">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Admin Notes</p>
                            <p className="text-sm text-gray-300">{request.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="lg:w-48 flex flex-col gap-3">
                        <div className="text-sm text-gray-400">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">Requested</span>
                          </div>
                          <p className="text-white text-xs">{formatDate(request.createdAt)}</p>
                        </div>

                        {request.processedAt && (
                          <div className="text-sm text-gray-400">
                            <div className="flex items-center gap-1 mb-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs">Processed</span>
                            </div>
                            <p className="text-white text-xs">{formatDate(request.processedAt)}</p>
                          </div>
                        )}

                        <Button
                          onClick={() => openUpdateDialog(request)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Update Status
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-gray-900 to-black border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Update Redemption Request</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update the status and add notes for this redemption request
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white mb-2 block">Request Details</Label>
                <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                  <p className="text-sm text-gray-400">Reward: <span className="text-white font-semibold">{selectedRequest.rewardName}</span></p>
                  <p className="text-sm text-gray-400">User: <span className="text-white">{selectedRequest.userName}</span></p>
                  <p className="text-sm text-gray-400">Cost: <span className="text-yellow-400">{selectedRequest.rewardCost} Coins</span></p>
                </div>
              </div>

              <div>
                <Label htmlFor="status" className="text-white mb-2 block">Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adminNotes" className="text-white mb-2 block">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this redemption..."
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 min-h-[100px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={updating}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

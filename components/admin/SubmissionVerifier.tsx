
'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Eye, Search, Filter, TrendingUp, Users, Clock, Image as ImageIcon, Undo2, History, AlertTriangle } from 'lucide-react'

interface Submission {
  _id: string
  user: {
    zeTag: string
    email: string
  }
  mission: {
    name: string
    points: number
  }
  proof: string
  status: string
  createdAt?: string
  submittedAt?: string
  approvedBy?: {
    zeTag: string
    email: string
  }
  approvedAt?: string
  revertedBy?: {
    zeTag: string
    email: string
  }
  revertedAt?: string
  revertReason?: string
  remarks?: string
}

export default function SubmissionVerifier() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [revertDialogOpen, setRevertDialogOpen] = useState(false)
  const [revertSubmission, setRevertSubmission] = useState<Submission | null>(null)
  const [revertReason, setRevertReason] = useState('')
  const [isReverting, setIsReverting] = useState(false)
  const isMobile = useIsMobile()

  async function fetchSubmissions(status: string = 'all') {
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data)
        setFilteredSubmissions(data)
      } else {
        toast.error('Failed to fetch submissions')
      }
    } catch (error) {
      toast.error('An error occurred while fetching submissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Fetch submissions based on active tab
    const statusMap: Record<string, string> = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      all: 'all'
    }
    setLoading(true)
    fetchSubmissions(statusMap[activeTab] || 'all')
  }, [activeTab])

  useEffect(() => {
    let filtered = submissions

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (sub) =>
          sub.user.zeTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sub.mission.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter)
    }

    setFilteredSubmissions(filtered)
  }, [searchQuery, statusFilter, submissions])

  async function handleVerification(submissionId: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/admin/submissions/verify', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status }),
      })

      if (res.ok) {
        toast.success(`Submission ${status}`, {
          description: `The submission has been ${status} successfully.`,
        })
        // Refresh current tab data
        const statusMap: Record<string, string> = {
          pending: 'pending',
          approved: 'approved',
          rejected: 'rejected',
          all: 'all'
        }
        fetchSubmissions(statusMap[activeTab] || 'all')
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || `Failed to ${status} submission`)
      }
    } catch (error) {
      toast.error(`An error occurred while ${status}ing the submission`)
    }
  }

  const handleRevertClick = (submission: Submission) => {
    setRevertSubmission(submission)
    setRevertReason('')
    setRevertDialogOpen(true)
  }

  const handleRevertConfirm = async () => {
    if (!revertSubmission) return
    
    setIsReverting(true)
    try {
      const res = await fetch('/api/admin/submissions/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionId: revertSubmission._id,
          revertReason: revertReason.trim() || 'Approval reverted by admin'
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Submission reverted successfully', {
          description: `${data.details.pointsDeducted} points deducted. ${data.details.rankChanged ? `Rank changed from ${data.details.oldRank} to ${data.details.newRank}` : 'Rank unchanged'}.`,
        })
        setRevertDialogOpen(false)
        setRevertSubmission(null)
        setRevertReason('')
        // Refresh current tab data
        const statusMap: Record<string, string> = {
          pending: 'pending',
          approved: 'approved',
          rejected: 'rejected',
          all: 'all'
        }
        fetchSubmissions(statusMap[activeTab] || 'all')
      } else {
        if (data.error) {
          toast.error('Cannot revert submission', {
            description: data.error,
          })
        } else {
          toast.error('Failed to revert submission')
        }
      }
    } catch (error) {
      toast.error('An error occurred while reverting the submission')
    } finally {
      setIsReverting(false)
    }
  }

  const handlePreview = (url: string) => {
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-64"
      >
        <div className="text-lg text-gray-400 flex items-center gap-3">
          <Clock className="h-6 w-6 animate-spin text-red-500" />
          Loading submissions...
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Total</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-blue-900 opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Pending</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-yellow-900 opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Approved</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-green-900 opacity-40" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 lg:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Rejected</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-red-900 opacity-40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Pending and History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-700 grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="pending" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Pending Review</span>
            <span className="sm:hidden">Pending</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
            <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Approved</span>
            <span className="sm:hidden">✓</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Rejected</span>
            <span className="sm:hidden">✗</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
            <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {/* Filters */}
          <Card className="bg-zinc-900/50 border-zinc-700">
            <CardContent className="p-3 sm:p-4 lg:pt-6 lg:px-6">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    placeholder="Search by user, email, or mission..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 sm:pl-10 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Table */}
          <Card className="bg-zinc-900/50 border-zinc-700">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
              <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base lg:text-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                {activeTab === 'pending' && 'Pending Review'}
                {activeTab === 'approved' && 'Approved Submissions'}
                {activeTab === 'rejected' && 'Rejected Submissions'}
                {activeTab === 'all' && 'All Submissions'}
                {' '}({filteredSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile Card View */}
              <div className="md:hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Clock className="h-8 w-8 animate-spin text-red-500" />
                  </div>
                ) : filteredSubmissions.length > 0 ? (
                  <div className="divide-y divide-zinc-700">
                    {filteredSubmissions.map((submission, index) => (
                      <motion.div
                        key={submission._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="p-4 space-y-3 hover:bg-zinc-800/30"
                      >
                        {/* User Info */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="font-medium text-sm text-white">@{submission.user.zeTag}</div>
                            <div className="text-xs text-gray-400 truncate">{submission.user.email}</div>
                          </div>
                          <Badge
                            variant={submission.status === 'pending' ? 'secondary' : submission.status === 'approved' ? 'default' : 'destructive'}
                            className={`text-xs ${submission.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' : submission.status === 'approved' ? 'bg-green-600/20 text-green-400' : ''}`}
                          >
                            {submission.status}
                          </Badge>
                        </div>
                        
                        {/* Mission Info */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-300">{submission.mission.name}</div>
                          <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs">+{submission.mission.points}</Badge>
                        </div>
                        
                        {/* Details for approved/rejected */}
                        {activeTab !== 'pending' && submission.approvedBy && (
                          <div className="text-xs text-gray-400 space-y-1">
                            <div>By: @{submission.approvedBy.zeTag}</div>
                            {submission.approvedAt && <div>{new Date(submission.approvedAt).toLocaleDateString()}</div>}
                            {submission.revertedBy && <div className="text-red-400">Reverted by: @{submission.revertedBy.zeTag}</div>}
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(submission.proof)}
                            className="flex-1 gap-1 text-gray-300 hover:text-white hover:bg-zinc-800 text-xs h-9"
                          >
                            <Eye className="h-3 w-3" />
                            View Proof
                          </Button>
                          {submission.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVerification(submission._id, 'approved')}
                                className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-xs h-9"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerification(submission._id, 'rejected')}
                                className="flex-1 gap-1 text-xs h-9"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          {submission.status === 'approved' && !submission.revertedBy && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevertClick(submission)}
                              className="flex-1 gap-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 text-xs h-9"
                            >
                              <Undo2 className="h-3 w-3" />
                              Revert
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-300">No submissions found.</p>
                  </div>
                )}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto w-full">
                <div className="min-w-[800px]">
                  <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-700">
                      <TableHead className="w-[180px] text-gray-300 text-xs sm:text-sm">User</TableHead>
                      <TableHead className="w-[150px] text-gray-300 text-xs sm:text-sm">Mission</TableHead>
                      <TableHead className="w-[80px] text-gray-300 text-xs sm:text-sm">Points</TableHead>
                      <TableHead className="w-[80px] text-gray-300 text-xs sm:text-sm">Proof</TableHead>
                      <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Status</TableHead>
                      {activeTab !== 'pending' && (
                        <TableHead className="w-[150px] text-gray-300 text-xs sm:text-sm">Details</TableHead>
                      )}
                      <TableHead className="w-[180px] text-gray-300 text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="h-12 w-12 animate-spin text-red-500" />
                            <p className="text-gray-300">Loading submissions...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredSubmissions.length > 0 ? (
                      filteredSubmissions.map((submission, index) => (
                        <motion.tr
                          key={submission._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-zinc-700 transition-colors hover:bg-zinc-800/30"
                        >
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              <div className="font-medium text-xs sm:text-sm text-white truncate max-w-[160px]">@{submission.user.zeTag}</div>
                              <div className="text-xs text-gray-400 truncate max-w-[160px]">
                                {submission.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm font-medium text-gray-300 py-3">
                            <div className="truncate max-w-[140px]">{submission.mission.name}</div>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs">
                              +{submission.mission.points}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(submission.proof)}
                              className="gap-1 text-gray-300 hover:text-white hover:bg-zinc-800 text-xs h-8 px-2"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant={
                                submission.status === 'pending'
                                  ? 'secondary'
                                  : submission.status === 'approved'
                                  ? 'default'
                                  : 'destructive'
                              }
                              className={
                                submission.status === 'pending'
                                  ? 'bg-yellow-600/20 text-yellow-400 text-xs'
                                  : submission.status === 'approved'
                                  ? 'bg-green-600/20 text-green-400 text-xs'
                                  : 'text-xs'
                              }
                            >
                              {submission.status}
                            </Badge>
                          </TableCell>
                          {activeTab !== 'pending' && (
                            <TableCell className="py-3">
                              <div className="space-y-1 text-xs text-gray-400">
                                {submission.approvedBy && (
                                  <div>By: @{submission.approvedBy.zeTag}</div>
                                )}
                                {submission.approvedAt && (
                                  <div>{new Date(submission.approvedAt).toLocaleDateString()}</div>
                                )}
                                {submission.revertedBy && (
                                  <div className="text-red-400">Reverted by: @{submission.revertedBy.zeTag}</div>
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="py-3">
                            {submission.status === 'pending' && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerification(submission._id, 'approved')}
                                  className="gap-1 border-green-500/50 text-green-400 hover:bg-green-500/20 text-xs h-8 px-2"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="hidden sm:inline">Approve</span>
                                  <span className="sm:hidden">✓</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleVerification(submission._id, 'rejected')}
                                  className="gap-1 border-red-500/50 text-red-400 hover:bg-red-500/20 text-xs h-8 px-2"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span className="hidden sm:inline">Reject</span>
                                  <span className="sm:hidden">✗</span>
                                </Button>
                              </div>
                            )}
                            {submission.status === 'approved' && !submission.revertedBy && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevertClick(submission)}
                                className="gap-1 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 text-xs h-8 px-2"
                              >
                                <Undo2 className="h-3 w-3" />
                                <span className="hidden sm:inline">Revert</span>
                              </Button>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm py-8">
                          <div className="flex flex-col items-center gap-2">
                            <TrendingUp className="h-12 w-12 text-gray-400" />
                            <p className="text-gray-300">No submissions found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ImageIcon className="h-5 w-5" />
              Proof Preview
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Review the submitted proof before verification
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewUrl && (
              <div className="rounded-lg overflow-hidden bg-zinc-800">
                {previewUrl.endsWith('.mp4') ? (
                  <video controls className="w-full max-h-[70vh]">
                    <source src={previewUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Proof"
                    className="w-full max-h-[70vh] object-contain"
                  />
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)} className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                Close
              </Button>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <a href={previewUrl || '#'} target="_blank" rel="noopener noreferrer">
                  Open in New Tab
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Revert Approval
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action will revert the approval and deduct{' '}
              <span className="text-red-400 font-semibold">{revertSubmission?.mission.points} points</span> from{' '}
              <span className="text-white font-semibold">@{revertSubmission?.user.zeTag}</span>.
              The user's rank may be downgraded if their experience falls below the threshold.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Reason for reverting (optional)</label>
              <Textarea
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Explain why you're reverting this approval..."
                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
              />
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 text-sm text-orange-300">
              <strong>Warning:</strong> This action cannot be undone. The submission will be marked as rejected.
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              disabled={isReverting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevertConfirm}
              disabled={isReverting}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isReverting ? 'Reverting...' : 'Revert Approval'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
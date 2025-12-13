
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
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Eye, Search, Filter, TrendingUp, Users, Clock, Image as ImageIcon } from 'lucide-react'

interface Submission {
  _id: string
  user: {
    name: string
    email: string
  }
  mission: {
    name: string
    points: number
  }
  proof: string
  status: string
  createdAt?: string
}

export default function SubmissionVerifier() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  async function fetchSubmissions() {
    try {
      const res = await fetch('/api/admin/submissions')
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
    fetchSubmissions()
  }, [])

  useEffect(() => {
    let filtered = submissions

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (sub) =>
          sub.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        fetchSubmissions() // Refresh the list
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || `Failed to ${status} submission`)
      }
    } catch (error) {
      toast.error(`An error occurred while ${status}ing the submission`)
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
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700 text-white text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white text-sm">All Status</SelectItem>
                  <SelectItem value="pending" className="text-white text-sm">Pending</SelectItem>
                  <SelectItem value="approved" className="text-white text-sm">Approved</SelectItem>
                  <SelectItem value="rejected" className="text-white text-sm">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="flex items-center gap-2 text-white text-sm sm:text-base lg:text-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            Submission Review ({filteredSubmissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <div className="min-w-[800px]">
              <Table>
              <TableHeader>
                <TableRow className="border-zinc-700">
                  <TableHead className="w-[180px] text-gray-300 text-xs sm:text-sm">User</TableHead>
                  <TableHead className="w-[150px] text-gray-300 text-xs sm:text-sm">Mission</TableHead>
                  <TableHead className="w-[80px] text-gray-300 text-xs sm:text-sm">Points</TableHead>
                  <TableHead className="w-[80px] text-gray-300 text-xs sm:text-sm">Proof</TableHead>
                  <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="w-[180px] text-gray-300 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length > 0 ? (
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
                          <div className="font-medium text-xs sm:text-sm text-white truncate max-w-[160px]">{submission.user.name}</div>
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
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm py-8">
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
    </motion.div>
  )
}

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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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
import { Edit, Trash2, Loader2, Search, Gift, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Reward {
  _id: string
  name: string
  description: string
  cost: number
  stock: number
  requiredRank?: string
  exclusiveToTop3?: boolean
  discountable?: boolean
  createdAt: string
  updatedAt: string
}

interface RewardListProps {
  onEdit: (reward: Reward) => void
  refreshTrigger?: number
}

export default function RewardList({ onEdit, refreshTrigger }: RewardListProps) {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState<string>('all')

  useEffect(() => {
    fetchRewards()
  }, [search, rankFilter, refreshTrigger])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (search) params.append('search', search)
      if (rankFilter !== 'all') params.append('requiredRank', rankFilter)

      const res = await fetch(`/api/admin/rewards/list?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setRewards(data.rewards || [])
      } else {
        throw new Error(data.error || 'Failed to fetch rewards')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load rewards',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const res = await fetch('/api/admin/rewards/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: deleteId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete reward')
      }

      toast({
        title: 'Success',
        description: 'Reward deleted successfully',
      })

      setDeleteId(null)
      fetchRewards()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete reward',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStockBadgeColor = (stock: number) => {
    if (stock === 0) return 'destructive'
    if (stock <= 3) return 'default'
    return 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rewards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={rankFilter} onValueChange={setRankFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by rank" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ranks</SelectItem>
            <SelectItem value="Rookie">Rookie</SelectItem>
            <SelectItem value="Contender">Contender</SelectItem>
            <SelectItem value="Gladiator">Gladiator</SelectItem>
            <SelectItem value="Vanguard">Vanguard</SelectItem>
            <SelectItem value="Errorless Legend">Errorless Legend</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rewards.length} reward{rewards.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Rewards Table */}
      {rewards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No rewards found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {search || rankFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first reward to get started'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reward</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Required Rank</TableHead>
                <TableHead>Special</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{reward.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {reward.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{reward.cost} coins</span>
                      {reward.discountable && (
                        <span className="text-xs text-muted-foreground">
                          ({Math.floor(reward.cost * 0.9)} with discount)
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStockBadgeColor(reward.stock)}>
                      {reward.stock === 0 ? (
                        <>
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Out of Stock
                        </>
                      ) : reward.stock <= 3 ? (
                        <>
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {reward.stock} left
                        </>
                      ) : (
                        `${reward.stock} available`
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {reward.requiredRank || 'Rookie'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {reward.exclusiveToTop3 && (
                        <Badge variant="default" className="w-fit">
                          🏆 Top 3 Only
                        </Badge>
                      )}
                      {reward.discountable && (
                        <Badge variant="secondary" className="w-fit">
                          💰 Discountable
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(reward)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(reward._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reward? This action cannot be
              undone. Users who have already redeemed this reward will not be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

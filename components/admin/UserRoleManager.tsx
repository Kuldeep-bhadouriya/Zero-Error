'use client'

import { useState } from 'react'
import { Search, Shield, ShieldOff, Loader2, User, Trophy, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
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

interface UserData {
  _id: string
  zeTag?: string
  email: string
  image?: string
  profilePhotoUrl?: string
  roles: string[]
  points: number
  rank: string
  discordId?: string
}

export default function UserRoleManager() {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [selectedAction, setSelectedAction] = useState<'add' | 'remove'>('add')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  async function handleSearch() {
    if (!searchQuery.trim()) {
      setUsers([])
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.details || 'Failed to search users')
      }
      const data = await res.json()
      console.log('Search results:', data.users)
      if (data.users && data.users.length > 0) {
        console.log('First user data:', data.users[0])
        console.log('Image URLs:', {
          profilePhotoUrl: data.users[0].profilePhotoUrl,
          image: data.users[0].image
        })
      }
      setUsers(data.users || [])
    } catch (error: any) {
      console.error('Search error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to search users. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSearching(false)
    }
  }

  function openConfirmDialog(user: UserData, action: 'add' | 'remove') {
    setSelectedUser(user)
    setSelectedAction(action)
    setDialogOpen(true)
  }

  async function handleToggleAdmin() {
    if (!selectedUser) return

    setActionLoading(selectedUser._id)
    try {
      const res = await fetch('/api/admin/users/toggle-admin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: selectedAction,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user role')
      }

      // Update the user in the list
      setUsers(users.map(u => 
        u._id === selectedUser._id 
          ? { ...u, roles: data.user.roles }
          : u
      ))

      toast({
        title: 'Success',
        description: `Successfully ${selectedAction === 'add' ? 'granted' : 'revoked'} admin access for @${selectedUser.zeTag || selectedUser.email}`,
      })

      setDialogOpen(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user role. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            User Role Management
          </CardTitle>
          <CardDescription className="text-gray-400">
            Search for users by username (ZE Tag) or email to manage admin roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {users.length === 0 && searchQuery && !isSearching && (
            <p className="text-center text-gray-500 py-8">
              No users found matching "{searchQuery}". Try searching by username or email.
            </p>
          )}

          {users.length > 0 && (
            <div className="space-y-3">
              {users.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-zinc-600 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {(() => {
                        const imageUrl = user.profilePhotoUrl || user.image
                        const hasValidImage = imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '' && !imageErrors.has(user._id)
                        
                        return hasValidImage ? (
                          <img
                            src={imageUrl}
                            alt={user.zeTag || user.email}
                            className="h-12 w-12 rounded-full border-2 border-zinc-700 object-cover"
                            onError={(e) => {
                              console.error('Image failed to load for user:', user.zeTag || user.email, {
                                profilePhotoUrl: user.profilePhotoUrl,
                                image: user.image,
                                attemptedUrl: imageUrl
                              })
                              setImageErrors(prev => new Set(prev).add(user._id))
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-zinc-700 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-400" />
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-white font-semibold truncate">@{user.zeTag || 'No username'}</h3>
                          {user.roles.includes('admin') && (
                            <Badge className="bg-red-600 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-400 mt-1 flex-wrap">
                          <span className="text-blue-400">{user.email}</span>
                          <span className="flex items-center gap-1">
                            <Trophy className="h-3 w-3" />
                            {user.points} pts
                          </span>
                          <Badge variant="outline" className="text-xs border-zinc-600">
                            {user.rank}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {user.roles.includes('admin') ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openConfirmDialog(user, 'remove')}
                          disabled={actionLoading === user._id}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Remove Admin
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => openConfirmDialog(user, 'add')}
                          disabled={actionLoading === user._id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {actionLoading === user._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {selectedAction === 'add' ? 'Grant Admin Access' : 'Revoke Admin Access'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {selectedAction === 'add' ? (
                <>
                  Are you sure you want to grant admin access to <span className="text-white font-semibold">@{selectedUser?.zeTag || selectedUser?.email}</span>?
                  They will be able to manage missions, verify submissions, and access the admin panel.
                </>
              ) : (
                <>
                  Are you sure you want to revoke admin access from <span className="text-white font-semibold">@{selectedUser?.zeTag || selectedUser?.email}</span>?
                  They will no longer be able to access the admin panel or perform admin actions.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleAdmin}
              className={selectedAction === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {selectedAction === 'add' ? 'Grant Admin' : 'Revoke Admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

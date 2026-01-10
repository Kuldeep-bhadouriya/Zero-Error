'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import RewardForm from './RewardForm'
import RewardList from './RewardList'
import { Gift, List, Plus } from 'lucide-react'

export default function RewardManager() {
  const [activeTab, setActiveTab] = useState('list')
  const [editingReward, setEditingReward] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEdit = (reward: any) => {
    setEditingReward(reward)
    setActiveTab('create')
  }

  const handleSuccess = () => {
    setEditingReward(null)
    setActiveTab('list')
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleCancel = () => {
    setEditingReward(null)
    setActiveTab('list')
  }

  const handleNewReward = () => {
    setEditingReward(null)
    setActiveTab('create')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rewards Manager</h2>
          <p className="text-muted-foreground">
            Manage rewards that users can redeem with ZE Coins
          </p>
        </div>
        <Gift className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Rewards List
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {editingReward ? 'Edit Reward' : 'Create Reward'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          <RewardList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="create" className="space-y-4 mt-6">
          <div className="rounded-lg border p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">
                {editingReward ? 'Edit Reward' : 'Create New Reward'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {editingReward
                  ? 'Update the reward details below'
                  : 'Fill in the details to create a new reward'}
              </p>
            </div>
            <RewardForm
              reward={editingReward}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, Gift } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface RewardFormData {
  name: string
  description: string
  cost: number
  stock: number
  requiredRank: string
  exclusiveToTop3: boolean
  discountable: boolean
}

interface RewardFormProps {
  reward?: any
  onSuccess: () => void
  onCancel: () => void
}

const RANK_OPTIONS = [
  { value: 'Rookie', label: 'Rookie' },
  { value: 'Contender', label: 'Contender' },
  { value: 'Gladiator', label: 'Gladiator' },
  { value: 'Vanguard', label: 'Vanguard' },
  { value: 'Errorless Legend', label: 'Errorless Legend' },
]

export default function RewardForm({ reward, onSuccess, onCancel }: RewardFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RewardFormData>({
    defaultValues: reward
      ? {
          name: reward.name,
          description: reward.description,
          cost: reward.cost,
          stock: reward.stock,
          requiredRank: reward.requiredRank || 'Rookie',
          exclusiveToTop3: reward.exclusiveToTop3 || false,
          discountable: reward.discountable !== undefined ? reward.discountable : true,
        }
      : {
          requiredRank: 'Rookie',
          exclusiveToTop3: false,
          discountable: true,
          stock: 10,
          cost: 100,
        },
  })

  const exclusiveToTop3 = watch('exclusiveToTop3')
  const discountable = watch('discountable')

  const onSubmit = async (data: RewardFormData) => {
    setLoading(true)
    try {
      const endpoint = reward
        ? '/api/admin/rewards/update'
        : '/api/admin/rewards/create'

      const payload = reward
        ? { rewardId: reward._id, ...data }
        : data

      const res = await fetch(endpoint, {
        method: reward ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save reward')
      }

      toast({
        title: 'Success',
        description: reward
          ? 'Reward updated successfully'
          : 'Reward created successfully',
      })

      onSuccess()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reward Name */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">
            Reward Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Discord Nitro 1 Month"
            {...register('name', { required: 'Reward name is required' })}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">
            Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Describe the reward and how it will be delivered..."
            rows={4}
            {...register('description', { required: 'Description is required' })}
            disabled={loading}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Cost (ZE Coins) */}
        <div className="space-y-2">
          <Label htmlFor="cost">
            Cost (ZE Coins) <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cost"
            type="number"
            min="0"
            placeholder="100"
            {...register('cost', {
              required: 'Cost is required',
              min: { value: 0, message: 'Cost must be at least 0' },
              valueAsNumber: true,
            })}
            disabled={loading}
          />
          {errors.cost && (
            <p className="text-sm text-red-500">{errors.cost.message}</p>
          )}
        </div>

        {/* Stock */}
        <div className="space-y-2">
          <Label htmlFor="stock">
            Stock <span className="text-red-500">*</span>
          </Label>
          <Input
            id="stock"
            type="number"
            min="0"
            placeholder="10"
            {...register('stock', {
              required: 'Stock is required',
              min: { value: 0, message: 'Stock must be at least 0' },
              valueAsNumber: true,
            })}
            disabled={loading}
          />
          {errors.stock && (
            <p className="text-sm text-red-500">{errors.stock.message}</p>
          )}
        </div>

        {/* Required Rank */}
        <div className="space-y-2">
          <Label htmlFor="requiredRank">Required Rank</Label>
          <Select
            value={watch('requiredRank')}
            onValueChange={(value) => setValue('requiredRank', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rank" />
            </SelectTrigger>
            <SelectContent>
              {RANK_OPTIONS.map((rank) => (
                <SelectItem key={rank.value} value={rank.value}>
                  {rank.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Exclusive to Top 3 */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="exclusiveToTop3" className="cursor-pointer">
              Exclusive to Top 3
            </Label>
            <p className="text-sm text-muted-foreground">
              Only for Top 3 Errorless Legends
            </p>
          </div>
          <Switch
            id="exclusiveToTop3"
            checked={exclusiveToTop3}
            onCheckedChange={(checked) => setValue('exclusiveToTop3', checked)}
            disabled={loading}
          />
        </div>

        {/* Discountable */}
        <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="discountable" className="cursor-pointer">
              Discountable
            </Label>
            <p className="text-sm text-muted-foreground">
              Vanguard+ gets 10% discount
            </p>
          </div>
          <Switch
            id="discountable"
            checked={discountable}
            onCheckedChange={(checked) => setValue('discountable', checked)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Preview Box */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Preview</h3>
        </div>
        <div className="space-y-1 text-sm">
          <p>
            <span className="font-medium">Name:</span>{' '}
            {watch('name') || 'Not set'}
          </p>
          <p>
            <span className="font-medium">Cost:</span>{' '}
            {watch('cost') || 0} ZE Coins
            {discountable && ' (10% off for Vanguard+)'}
          </p>
          <p>
            <span className="font-medium">Stock:</span>{' '}
            {watch('stock') || 0} available
          </p>
          <p>
            <span className="font-medium">Required Rank:</span>{' '}
            {watch('requiredRank') || 'Rookie'}
          </p>
          {exclusiveToTop3 && (
            <p className="text-amber-600 dark:text-amber-400">
              ⭐ Exclusive to Top 3 Errorless Legends
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {reward ? 'Update Reward' : 'Create Reward'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

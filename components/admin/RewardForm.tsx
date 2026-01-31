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
import { Loader2, Gift, Package, Sparkles, Coins } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import RewardImageUploader from './RewardImageUploader'

interface RewardFormData {
  name: string
  description: string
  cost: number
  stock: number
  requiredRank: string
  exclusiveToTop3: boolean
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
  const [imageUrl, setImageUrl] = useState(reward?.imageUrl || '')
  const [savedRewardId, setSavedRewardId] = useState(reward?._id || '')
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
        }
      : {
          requiredRank: 'Rookie',
          exclusiveToTop3: false,
          stock: 10,
          cost: 100,
        },
  })

  const exclusiveToTop3 = watch('exclusiveToTop3')

  const onSubmit = async (data: RewardFormData) => {
    setLoading(true)
    try {
      const endpoint = savedRewardId
        ? '/api/admin/rewards/update'
        : '/api/admin/rewards/create'

      const payload = savedRewardId
        ? { rewardId: savedRewardId, ...data }
        : { ...data, imageUrl }

      const res = await fetch(endpoint, {
        method: savedRewardId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save reward')
      }

      // If this was a new reward, save the ID so user can upload image
      if (!savedRewardId && result.reward?._id) {
        setSavedRewardId(result.reward._id)
        toast({
          title: 'Success',
          description: 'Reward created! You can now upload an image.',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Reward updated successfully',
        })
        onSuccess()
      }
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
            {...register('name', { 
              required: 'Reward name is required',
              onBlur: (e) => {
                if (errors.name) {
                  toast({
                    title: 'Validation Error',
                    description: errors.name.message,
                    variant: 'destructive',
                  })
                }
              }
            })}
            disabled={loading}
          />
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
            {...register('description', { 
              required: 'Description is required',
              onBlur: (e) => {
                if (errors.description) {
                  toast({
                    title: 'Validation Error',
                    description: errors.description.message,
                    variant: 'destructive',
                  })
                }
              }
            })}
            disabled={loading}
          />
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
              onBlur: (e) => {
                if (errors.cost) {
                  toast({
                    title: 'Validation Error',
                    description: errors.cost.message,
                    variant: 'destructive',
                  })
                }
              }
            })}
            disabled={loading}
          />
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
              onBlur: (e) => {
                if (errors.stock) {
                  toast({
                    title: 'Validation Error',
                    description: errors.stock.message,
                    variant: 'destructive',
                  })
                }
              }
            })}
            disabled={loading}
          />
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

        {/* Reward Image */}
        <div className="space-y-2 md:col-span-2">
          <Label>Reward Image</Label>
          {!savedRewardId && (
            <p className="text-sm text-yellow-500 mb-2">
              Save the reward first to enable image upload
            </p>
          )}
          <RewardImageUploader
            rewardId={savedRewardId}
            currentImage={imageUrl}
            onImageUpload={setImageUrl}
          />
        </div>
      </div>

      {/* Preview Box - Accurate RewardCard Preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Preview</h3>
        </div>
        <div className="max-w-sm">
          <div className="flex flex-col h-full overflow-hidden rounded-xl border bg-[#09090b] shadow-sm border-white/5">
            {/* Card Header / Image Area */}
            <div className={`relative h-40 w-full overflow-hidden flex items-center justify-center ${
              exclusiveToTop3 
                ? 'bg-gradient-to-b from-amber-950/30 to-[#09090b]' 
                : 'bg-gradient-to-b from-white/5 to-[#09090b]'
            }`}>
              {/* Subtle Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03]" 
                   style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} 
              />
              
              {/* Image or Icon */}
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={watch('name') || 'Reward'} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className={`relative z-10 p-5 rounded-2xl shadow-2xl ${
                  exclusiveToTop3
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/10 text-amber-200 ring-1 ring-amber-500/20'
                    : 'bg-gradient-to-br from-gray-800 to-black text-gray-300 ring-1 ring-white/10'
                }`}>
                  {exclusiveToTop3 ? (
                    <Gift className="w-10 h-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]" strokeWidth={1.5} />
                  ) : (
                    <Package className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
                  )}
                </div>
              )}

              {/* Top Badges */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
                {exclusiveToTop3 && (
                  <div className="bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full px-2.5 py-1 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Rare
                  </div>
                )}
              </div>
            </div>

            {/* Card Body */}
            <div className="flex flex-col flex-1 p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold tracking-tight text-white mb-2">
                  {watch('name') || 'Reward Name'}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 h-10">
                  {watch('description') || 'Reward description will appear here...'}
                </p>
              </div>
              
              {/* Stats Grid */}
              <div className="mt-auto space-y-4">
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                      Price
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg text-yellow-400 tabular-nums">
                        {watch('cost') || 0}
                      </span>
                      <Coins className="w-4 h-4 text-yellow-500/60" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                      Stock
                    </span>
                    <span className="font-bold text-lg text-gray-300 tabular-nums">
                      {watch('stock') || 0}
                    </span>
                  </div>
                </div>

                {/* Required Rank Badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Required Rank:</span>
                  <span className="text-gray-300 font-medium">{watch('requiredRank') || 'Rookie'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!savedRewardId || reward ? (
          <>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savedRewardId ? 'Update Reward' : 'Create Reward'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Details
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={onSuccess}
              className="flex-1"
            >
              Done
            </Button>
          </>
        )}
      </div>
    </form>
  )
}

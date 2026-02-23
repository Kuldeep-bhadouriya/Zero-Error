'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Coins, Package, Lock, Gift, Sparkles, AlertCircle, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IReward } from '@/models/reward';
import logger from '@/lib/browser-logger'

// Extending interface for frontend specific props
interface Reward extends Omit<IReward, 'isModified' | 'increment' | 'get' | '$isNew' | 'errors' | 'schema' | 'db' | 'modelName' | 'collection'> {
  _id: string;
  isLocked?: boolean;
  lockedReason?: string;
  originalCost?: number;
  finalCost?: number;
}

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
  onRedeem: (reward: Reward) => void;
  index: number;
}

export function RewardCard({ reward, userCoins, onRedeem, index }: RewardCardProps) {
  const cost = reward.finalCost ?? reward.cost;
  const canAfford = userCoins >= cost;
  const isDiscounted = (reward.originalCost ?? reward.cost) > cost;
  const isLowStock = reward.stock <= 5;
  const isLocked = reward.isLocked;
  // Refined Exclusive logic: Top 3 or strictly 'Prize' in name
  const isExclusive = reward.exclusiveToTop3 || reward.name.includes('Prize');

  // Determine visual theme based on state
  const isAvailable = !isLocked && reward.stock > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="h-full"
    >
      <div 
        className={cn(
          "group relative flex flex-col h-full overflow-hidden rounded-xl border transition-all duration-300",
          "bg-[#09090b] shadow-sm",
          isExclusive 
            ? "border-amber-500/20 hover:border-amber-500/40" 
            : "border-white/5 hover:border-white/10 hover:shadow-md hover:shadow-purple-500/5",
          isLocked && "grayscale-[0.8] opacity-70"
        )}
      >
        {/* -- Card Header / Image Area -- */}
        <div className={cn(
          "relative h-40 w-full overflow-hidden flex items-center justify-center",
          isExclusive 
             ? "bg-gradient-to-b from-amber-950/30 to-[#09090b]" 
             : "bg-gradient-to-b from-white/5 to-[#09090b]"
        )}>
          
          {/* Subtle Grid Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)` , backgroundSize: '16px 16px' }} 
          />
          
          {/* Custom Image or Icon Illustration */}
          {reward.imageUrl ? (
            <>
              {logger.info('RewardCard rendering image:', reward.name, reward.imageUrl)}
              <img 
                src={reward.imageUrl} 
                alt={reward.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  logger.error('Image failed to load:', reward.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => logger.info('Image loaded successfully:', reward.imageUrl)}
              />
            </>
          ) : (
            /* Main Icon Illustration (Fallback) */
            <div className={cn(
               "relative z-10 p-5 rounded-2xl shadow-2xl skew-y-0 transition-transform duration-500 group-hover:scale-110",
               isExclusive
                  ? "bg-gradient-to-br from-amber-500/20 to-orange-600/10 text-amber-200 ring-1 ring-amber-500/20"
                  : "bg-gradient-to-br from-gray-800 to-black text-gray-300 ring-1 ring-white/10"
            )}>
               {isExclusive ? (
                 <Gift className="w-10 h-10 drop-shadow-[0_0_15px_rgba(251,191,36,0.2)]" strokeWidth={1.5} />
               ) : (
                 <Package className="w-10 h-10 text-gray-400 group-hover:text-purple-300 transition-colors" strokeWidth={1.5} />
               )}
            </div>
          )}

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20">
             {/* Left side badges */}
             <div className="flex gap-2">
                {isLocked && (
                  <Badge variant="secondary" className="bg-black/80 backdrop-blur text-gray-400 border border-white/10 gap-1.5 px-2.5 h-7">
                    <Lock className="w-3 h-3" /> Locked
                  </Badge>
                )}
                {!isLocked && isExclusive && (
                  <Badge className="bg-amber-500/10 text-amber-300 border-amber-500/20 gap-1.5 px-2.5 h-7 shadow-sm">
                    <Sparkles className="w-3 h-3" /> Rare
                  </Badge>
                )}
             </div>

             {/* Right side badges (Sales) */}
             {isDiscounted && !isLocked && (
               <Badge className="bg-green-500/20 text-green-400 border-green-500/20 h-7">
                 SAVE {Math.round(((reward.originalCost || reward.cost) - cost) / (reward.originalCost || reward.cost) * 100)}%
               </Badge>
             )}
          </div>
        </div>

        {/* -- Card Body -- */}
        <div className="flex flex-col flex-1 p-5">
           <div className="mb-4">
              <h3 className={cn(
                "text-lg font-semibold tracking-tight text-white mb-2 group-hover:text-purple-50 transition-colors",
                isLocked && "text-gray-500"
              )}>
                {reward.name}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 h-10">
                {reward.description}
              </p>
           </div>
           
           {/* Detailed Metadata (Stock or Reason) */}
           <div className="mt-auto space-y-4">
              {isLocked ? (
                <div className="bg-red-950/10 border border-red-900/20 rounded-lg p-2.5 flex gap-2.5 items-start">
                   <AlertCircle className="w-4 h-4 text-red-500/80 shrink-0 mt-0.5" />
                   <span className="text-xs text-red-200/60 leading-tight">
                     {reward.lockedReason || "Requirement not met."}
                   </span>
                </div>
              ) : (
                /* Stats Grid for Pricing & Stock */
                <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/5">
                   <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                        Price
                      </span>
                      <div className="flex items-center gap-1.5">
                         {isDiscounted ? (
                           <>
                             <span className="text-xs text-gray-500 line-through decoration-slate-600 decoration-1">
                               {reward.originalCost}
                             </span>
                             <span className="font-bold text-lg text-yellow-400 tabular-nums shadow-yellow-500/5 drop-shadow-sm">
                               {cost}
                             </span>
                           </>
                         ) : (
                           <span className="font-bold text-lg text-yellow-400 tabular-nums">
                              {cost}
                           </span>
                         )}
                         <Coins className="w-3.5 h-3.5 text-yellow-600" />
                      </div>
                   </div>

                   <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                        Availability
                      </span>
                      <div className="flex items-center justify-end gap-1.5">
                         {reward.stock <= 0 ? (
                           <span className="text-xs font-medium text-red-500">Sold Out</span>
                         ) : isLowStock ? (
                           <>
                             <Clock className="w-3 h-3 text-orange-400 animate-pulse" />
                             <span className="text-sm font-medium text-orange-400">{reward.stock} Left</span>
                           </>
                         ) : (
                           <span className="text-sm font-medium text-gray-300">{reward.stock} Units</span>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => onRedeem(reward)}
                disabled={!isAvailable || !canAfford}
                className={cn(
                  "w-full h-11 font-medium transition-all duration-300",
                  !isAvailable
                     ? "bg-white/5 text-gray-500 border border-white/5 hover:bg-white/5 cursor-not-allowed"
                     : canAfford
                         ? isExclusive
                             ? "bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-orange-900/20 border-0"
                             : "bg-white text-black hover:bg-zinc-200 border-0"
                         : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                )}
              >
                  {!isAvailable ? (
                     reward.stock <= 0 ? "Out of Stock" : "Locked"
                  ) : !canAfford ? (
                    <span className="flex items-center gap-2">
                      <span className="opacity-70">Need</span>
                      <span className="font-bold text-yellow-500/90">{cost - userCoins}</span>
                      <Coins className="w-3.5 h-3.5 text-yellow-500/90" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                       Redeem Reward
                       <Zap className={cn("w-3.5 h-3.5", isExclusive ? "text-yellow-200" : "text-purple-600")} fill="currentColor" />
                    </span>
                  )}
              </Button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}

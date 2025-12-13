'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Clock, 
  Users, 
  Image, 
  Video, 
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MissionPreviewProps {
  mission: any
}

export default function MissionPreview({ mission }: MissionPreviewProps) {
  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Hard':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  function getProofIcon() {
    switch (mission.requiredProofType) {
      case 'image':
        return <Image className="h-4 w-4" />
      case 'video':
        return <Video className="h-4 w-4" />
      case 'both':
        return (
          <>
            <Image className="h-4 w-4" />
            <Video className="h-4 w-4" />
          </>
        )
    }
  }

  const isExpired = mission.isExpired
  const isMaxedOut = mission.isMaxedOut
  const isAvailable = !isExpired && !isMaxedOut && mission.active

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all',
      isAvailable ? 'hover:shadow-lg hover:border-red-500' : 'opacity-60'
    )}>
      {/* Featured Badge */}
      {mission.featured && (
        <div className="absolute top-2 right-2 z-10">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{mission.name}</CardTitle>
            <CardDescription>{mission.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-bold text-primary">{mission.points}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {mission.category}
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <div className={cn('h-2 w-2 rounded-full', getDifficultyColor(mission.difficulty))} />
            {mission.difficulty}
          </Badge>

          <Badge variant="outline" className="flex items-center gap-1">
            {getProofIcon()}
            {mission.requiredProofType}
          </Badge>

          {mission.isTimeLimited && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {mission.daysRemaining !== null 
                ? `${mission.daysRemaining}d left`
                : 'Time Limited'
              }
            </Badge>
          )}

          {mission.maxCompletions && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {mission.currentCompletions}/{mission.maxCompletions}
            </Badge>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Instructions:</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {mission.instructions}
          </p>
        </div>

        {/* Example Image */}
        {mission.exampleImageUrl && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Example:</h4>
            <img
              src={mission.exampleImageUrl}
              alt="Example proof"
              className="w-full max-w-md h-48 object-cover rounded-lg border"
            />
          </div>
        )}

        {/* Status Messages */}
        {isExpired && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500">This mission has expired</span>
          </div>
        )}

        {isMaxedOut && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-orange-500">
              Maximum completions reached
            </span>
          </div>
        )}

        {!mission.active && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-500/10 border border-gray-500/20">
            <AlertCircle className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">This mission is currently inactive</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full"
          disabled={!isAvailable}
        >
          {isAvailable ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete Mission
            </>
          ) : (
            'Unavailable'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

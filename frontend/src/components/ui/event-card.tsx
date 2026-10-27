import type { ComponentProps } from 'react'
import { Calendar, MapPin, Star, Users } from 'lucide-react'

import { cn } from '../../lib/utils'
import { Card, CardContent } from './card'

export interface EventOrganizer {
  name: string
  initials?: string
  avatarUrl?: string | null
  rating: string
  reviewsCount: number
}

export interface EventCardProps
  extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  title: string
  imageUrl?: string | null
  date: string
  distance: string
  price: string
  isFree?: boolean
  status?: 'finished' | 'promoted' | null
  organizer?: EventOrganizer | null
  participants: {
    current: number
    max: number
  }
  variant?: 'default' | 'purple'
}

const participantsStyles = {
  default: 'bg-amber-100 text-amber-800',
  purple: 'bg-violet-100 text-primary',
} as const

export function EventCard({
  title,
  imageUrl,
  date,
  distance,
  price,
  isFree = false,
  status = null,
  organizer = null,
  participants,
  variant = 'default',
  className,
  ...props
}: EventCardProps) {
  return (
    <Card
      className={cn('h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm', className)}
      {...props}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-linear-to-br from-purple-200 to-primary/70">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}

        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 bg-linear-to-t to-transparent',
            organizer ? 'from-black/60' : 'from-black/35',
          )}
        />

        {status === 'finished' && (
          <div className="absolute inset-x-0 top-0 z-10 bg-foreground py-1.5 text-center text-xs font-medium text-primary-foreground">
            Finished
          </div>
        )}

        {status === 'promoted' && (
          <span className="absolute top-3 right-3 z-10 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            Promoted
          </span>
        )}

        {organizer && (
          <div className="absolute bottom-3 left-3 right-20 z-10 flex min-w-0 items-center gap-2">
            <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card/90 text-xs font-semibold text-primary">
              {organizer.avatarUrl ? (
                <img
                  src={organizer.avatarUrl}
                  alt={organizer.name}
                  className="size-full object-cover"
                />
              ) : (
                organizer.initials
              )}
            </span>

            <div className="min-w-0 text-primary-foreground">
              <p className="truncate text-xs leading-tight">{organizer.name}</p>
              <p className="flex items-center gap-1 text-[11px] leading-tight text-primary-foreground/90">
                <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                <span className="truncate">
                  {organizer.rating} ({organizer.reviewsCount})
                </span>
              </p>
            </div>
          </div>
        )}

        <span
          aria-label={`${participants.current} of ${participants.max} participants`}
          className={cn(
            'absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium',
            participantsStyles[variant],
          )}
        >
          {participants.current} / {participants.max}
          <Users className="size-3.5 fill-current" />
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 px-3 py-3">
        <h3 className="line-clamp-2 text-base leading-snug font-normal">
          {title}
        </h3>

        <div className="mt-auto flex items-start justify-between gap-3">
          <ul className="min-w-0 space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{distance}</span>
            </li>
            <li className="flex items-center gap-2">
              <Calendar className="size-3.5 shrink-0" />
              <span className="truncate">{date}</span>
            </li>
          </ul>

          <span
            className={cn(
              'shrink-0 text-sm font-semibold',
              isFree
                ? 'text-primary'
                : status === 'finished'
                  ? 'text-muted-foreground'
                  : 'text-foreground',
            )}
          >
            {price}
          </span>
        </div>
      </CardContent>
    </Card>
  )
} 
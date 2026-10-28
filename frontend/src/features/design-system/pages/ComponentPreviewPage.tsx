import type { CSSProperties, ReactNode } from 'react'
import {
  BatteryFull,
  CalendarCheck,
  Compass,
  ScrollText,
  Signal,
  User as UserIcon,
  Wifi,
} from 'lucide-react'

import { Footer } from '@/components/layout/Footer'
import { Header, type NavItem, type UserProfile } from '@/components/layout/Header'
import {
  BottomNav,
  MobileTopBar,
  type BottomNavItem,
} from '@/components/layout/MobileNav'
import { Pagination } from '@/components/shared/Pagination'
import { EventCard, type EventCardProps } from '@/features/events/components/EventCard'
import { EventGrid } from '@/features/events/components/EventGrid'

const LIGHT_THEME = {
  colorScheme: 'light',
  '--background': '#ffffff',
  '--foreground': '#0a0a0a',
  '--card': '#ffffff',
  '--card-foreground': '#0a0a0a',
  '--popover': '#ffffff',
  '--popover-foreground': '#0a0a0a',
  '--muted': '#f5f5f5',
  '--muted-foreground': '#737373',
  '--border': '#e5e5e5',
  '--input': '#e5e5e5',
  '--destructive': '#dc2626',
} as CSSProperties

const BRAND_NAME = 'YupiBoard'
const LOGO = <img src="/images/logo.svg" alt="" />
const COPYRIGHT = '© 2026 YupiBoard. Bring people to the table.'

const MOCK_USER: UserProfile = { name: 'Elena', initials: 'EN' }

const MOCK_ORGANIZER = {
  name: 'Dice & Coffee',
  initials: 'DC',
  rating: '4.9',
  reviewsCount: 38,
}

const NAV: NavItem[] = [
  { label: 'Events', href: '/events' },
  { label: 'My events', href: '/my-events' },
  { label: 'My bookings', href: '/my-bookings' },
  { label: 'Favorite', href: '/favorite' },
]

const navWithActive = (activeHref: string): NavItem[] =>
  NAV.map((item) => ({ ...item, isActive: item.href === activeHref }))

const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { label: 'Events', icon: <Compass /> },
  { label: 'My events', icon: <CalendarCheck />, isActive: true },
  { label: 'My bookings', icon: <ScrollText /> },
  { label: 'Profile', icon: <UserIcon /> },
]

const base = {
  title: 'Trade, build & make new friends',
  imageUrl: 'https://picsum.photos/seed/boardgame/800/500',
  date: 'Sat, Oct 24 · 17:00',
} satisfies Partial<EventCardProps>

const finished: EventCardProps = {
  ...base,
  distance: '4.2 km away',
  price: '$300',
  status: 'finished',
  participants: { current: 5, max: 6 },
}
const purple: EventCardProps = {
  ...base,
  distance: '5.0 km away',
  price: 'Free',
  isFree: true,
  variant: 'purple',
  participants: { current: 3, max: 6 },
}
const promoted: EventCardProps = {
  ...base,
  distance: '4.2 km away',
  price: '$300',
  status: 'promoted',
  participants: { current: 5, max: 6 },
}

const EVENT_CARD_VARIANTS: { id: string; props: EventCardProps }[] = [
  { id: 'finished', props: finished },
  { id: 'purple-free', props: purple },
  { id: 'promoted', props: promoted },
  { id: 'finished-organizer', props: { ...finished, organizer: MOCK_ORGANIZER } },
  { id: 'purple-free-organizer', props: { ...purple, organizer: MOCK_ORGANIZER } },
  { id: 'promoted-organizer', props: { ...promoted, organizer: MOCK_ORGANIZER } },
]

const LIST_CARDS = [promoted, promoted, promoted, purple, purple, purple].map(
  (props, index) => ({
    id: index,
    props: { ...props, organizer: MOCK_ORGANIZER },
  }),
)

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex h-190 w-93.75 max-w-full flex-col overflow-hidden rounded-[2.5rem] border-10 border-neutral-900 bg-neutral-50 shadow-xl">
      <div className="flex items-center justify-between px-6 pt-3 text-xs font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-1">
          <Signal className="size-3.5" />
          <Wifi className="size-3.5" />
          <BatteryFull className="size-4" />
        </span>
      </div>
      {children}
    </div>
  )
}

export function ComponentPreviewPage() {
  return (
    <div
      style={LIGHT_THEME}
      className="fixed inset-0 z-100 overflow-y-auto bg-background text-foreground"
    >
      <div className="min-h-screen w-full bg-neutral-50">
        <Header
          logo={LOGO}
          brandName={BRAND_NAME}
          navItems={navWithActive('/my-bookings')}
          user={MOCK_USER}
        />

        <div className="w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <h1 className="text-3xl font-bold tracking-tight">My Game Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep track of the games you've joined, your upcoming schedule, and
            request statuses.
          </p>

          <p className="mt-8 text-sm font-semibold">68 events</p>

          <EventGrid className="mt-6">
            {LIST_CARDS.map(({ id, props }) => (
              <EventCard key={id} {...props} />
            ))}
          </EventGrid>

          <Pagination
            className="mt-8"
            pages={[1, 2, 3, 'ellipsis-end', 12]}
            currentPage={1}
            summary="Showing 1–6 of 68 events"
            isPreviousDisabled
          />
        </div>
      </div>

      <main className="p-4 sm:p-6 md:p-10">
        <div className="w-full space-y-8">
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">
              YupiBoard / Frontend development
            </p>

            <h1 className="text-3xl font-bold">Component Playground</h1>

            <p className="text-muted-foreground">
              The page above is the full-width layout (resize the window to see
              the number of cards per row change). Below are the individual
              components and the mobile version.
            </p>
          </header>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">EventCard</h2>
            <p className="text-sm text-muted-foreground">
              Six variants from the mockup: Finished, Free (purple) and
              Promoted, each without and with an organizer.
            </p>

            <div className="rounded-xl bg-neutral-400 p-4">
              <EventGrid>
                {EVENT_CARD_VARIANTS.map(({ id, props }) => (
                  <EventCard key={id} {...props} />
                ))}
              </EventGrid>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Header</h2>
            <p className="text-sm text-muted-foreground">
              Signed-in user with notifications, and guest (user = null).
            </p>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border">
                <Header
                  logo={LOGO}
                  brandName={BRAND_NAME}
                  navItems={navWithActive('/events')}
                  user={MOCK_USER}
                  notificationsBadge="3"
                  className="static"
                />
              </div>
              <div className="overflow-hidden rounded-lg border">
                <Header
                  logo={LOGO}
                  brandName={BRAND_NAME}
                  user={null}
                  className="static"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Pagination</h2>
            <p className="text-sm text-muted-foreground">
              First page, middle page, last page and a short list.
            </p>

            <div className="space-y-6 rounded-lg bg-neutral-50 p-4">
              <Pagination
                pages={[1, 2, 3, 'ellipsis-end', 12]}
                currentPage={1}
                summary="Showing 1–6 of 68 events"
                isPreviousDisabled
              />
              <Pagination
                pages={[1, 'ellipsis-start', 4, 5, 6, 'ellipsis-end', 12]}
                currentPage={5}
                summary="Showing 25–30 of 68 events"
              />
              <Pagination
                pages={[1, 'ellipsis-start', 10, 11, 12]}
                currentPage={12}
                summary="Showing 67–68 of 68 events"
                isNextDisabled
              />
              <Pagination
                pages={[1, 2, 3]}
                currentPage={2}
                summary="Showing 7–12 of 18 events"
              />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Footer</h2>

            <div className="overflow-hidden rounded-lg border">
              <Footer brandName="YuppiBoard" copyright={COPYRIGHT} />
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">My components</h2>

            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                Your component will be rendered here.
              </p>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border p-4 sm:p-6">
            <h2 className="text-xl font-semibold">Mobile version</h2>
            <p className="text-sm text-muted-foreground">
              375 px phone: one card per row and a bottom navigation. The list
              scrolls inside the frame.
            </p>

            <PhoneFrame>
              <MobileTopBar
                logo={LOGO}
                brandName={BRAND_NAME}
                hasUnreadNotifications
              />

              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="mb-4 flex items-baseline justify-between gap-2">
                  <h2 className="text-xl font-bold tracking-tight">
                    My Hosted Events
                  </h2>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    18 events
                  </span>
                </div>

                <EventGrid>
                  {[purple, finished, promoted, purple].map((props, index) => (
                    <EventCard
                      key={index}
                      {...props}
                      organizer={MOCK_ORGANIZER}
                    />
                  ))}
                </EventGrid>
              </div>

              <BottomNav items={BOTTOM_NAV_ITEMS} />
            </PhoneFrame>
          </section>
        </div>
      </main>
    </div>
  )
}
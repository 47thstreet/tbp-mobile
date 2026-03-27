# TBP Mobile

**React Native mobile app for TB Group event attendees and promoters.**

TBP Mobile is the companion app for the TB Group nightlife ecosystem. Attendees can discover events, purchase tickets via Stripe, store digital tickets with QR codes, add events to their calendar, find nearby events on a map, follow DJs, and browse venues. Promoters get a mobile dashboard with real-time sales stats. Integrates with the Kartis ticketing platform API.

Built with Expo, React Native, React Navigation, and Stripe.

---

## Features

### Event Discovery

- Home screen with upcoming events feed
- Event detail pages with full info, DJ lineup, and ticket types
- Date filter chips for browsing by date range
- Nearby events map with location-based discovery
- Venue browsing with venue detail pages

### Ticketing

- Stripe-powered checkout flow
- Ticket confirmation screen
- My Tickets with QR code display
- Full-screen ticket view for scanning at door
- Apple Wallet and Google Wallet pass integration
- Add-to-calendar button

### DJ Profiles

- DJ directory listing
- DJ detail pages with bio and tracks
- Audio player for DJ tracks
- Follow/unfollow DJs

### Social Feed

- Social feed with posts from the community
- Like/interact with posts

### Promoter Dashboard

- Mobile promoter dashboard
- Real-time sales and commission stats
- Promoter link sharing

### User Account

- Onboarding flow for new users
- Profile screen with account info
- Push notification preferences
- Notification opt-in/out management

### Sharing & Engagement

- Share event button (native share sheet)
- Deep linking support
- Booking request form

### Platform

- Dark theme UI (nightlife-optimized)
- iOS and Android support
- Camera permission for QR scanning
- Location permission for nearby events
- Calendar permission for event saving

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Expo](https://expo.dev) SDK 55 |
| UI | [React Native](https://reactnative.dev) 0.83 |
| Navigation | [React Navigation](https://reactnavigation.org) v7 (bottom tabs + native stack) |
| Payments | [Stripe React Native](https://github.com/stripe/stripe-react-native) |
| Maps | [react-native-maps](https://github.com/react-native-maps/react-native-maps) |
| QR Codes | [react-native-qrcode-svg](https://github.com/awesomejerry/react-native-qrcode-svg) |
| Media | expo-av (audio player) |
| Storage | expo-secure-store |
| Backend | Kartis API (REST) |

---

## Screens

| Screen | Description |
|--------|-------------|
| `OnboardingScreen` | Welcome and onboarding flow |
| `HomeScreen` | Event feed with date filters |
| `EventDetailScreen` | Full event details with ticket selection |
| `CheckoutScreen` | Stripe payment flow |
| `TicketConfirmationScreen` | Purchase confirmation |
| `MyTicketsScreen` | List of purchased tickets |
| `FullScreenTicketScreen` | Full-screen QR code for scanning |
| `NearbyEventsScreen` | Map view of nearby events |
| `DJsScreen` | DJ directory |
| `DJDetailScreen` | DJ profile with tracks and follow |
| `VenuesScreen` | Venue directory |
| `VenueDetailScreen` | Venue details |
| `SocialFeedScreen` | Community social feed |
| `PromoterDashboardScreen` | Promoter stats and links |
| `ProfileScreen` | User profile and settings |
| `NotificationPrefsScreen` | Push notification preferences |

---

## API Integration

The app consumes the Kartis platform API. Key endpoints:

| Category | Endpoints |
|----------|-----------|
| **Events** | `GET /api/cms/public-events`, `GET /api/cms/events/:id` |
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me` |
| **Tickets** | `GET /api/tickets/mine`, `GET /api/tickets/:id` |
| **QR** | `POST /api/qr/validate` |
| **DJs** | `GET /api/djs/list`, `GET /api/djs/:id`, follow/unfollow, tracks |
| **Promoter** | `GET /api/promoter/stats`, `GET /api/promoter/link` |
| **Checkout** | `POST /api/checkout/create-session`, confirm payment |
| **Feed** | `GET /api/feed`, like posts |
| **Push** | `POST /api/push/register`, unregister |
| **Prefs** | `GET/PUT /api/user/notification-prefs` |
| **Wallet** | `GET /api/wallet/apple-pass/:id`, `GET /api/wallet/google-pass/:id` |
| **Venues** | `GET /api/venues`, `GET /api/venues/:id` |
| **Booking** | `POST /api/booking/request` |

---

## Components

| Component | Description |
|-----------|-------------|
| `EventCard` | Event listing card with image and details |
| `DateFilterChips` | Horizontal date range filter |
| `GlassCard` | Frosted glass card effect |
| `LoadingScreen` | Full-screen loading indicator |
| `AddToCalendarButton` | Save event to device calendar |
| `ShareEventButton` | Native share sheet for events |

---

## Navigation

```
RootNavigator
  MainTabs (bottom tab navigation)
    Home -> EventDetail -> Checkout -> TicketConfirmation
    DJs -> DJDetail
    Venues -> VenueDetail
    Nearby Events (map)
    Profile -> NotificationPrefs
  MyTickets -> FullScreenTicket
  SocialFeed
  PromoterDashboard
  Onboarding
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Install

```bash
git clone https://github.com/47thstreet/tbp-mobile.git
cd tbp-mobile
npm install
```

### Development

```bash
# Start Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Configuration

The API base URL is configured in `src/constants/api.ts`. By default it points to `localhost:3032` (Kartis dev server).

For production, update `API_BASE_URL` to point to your Kartis deployment.

---

## Project Structure

```
App.tsx                          # App entry point
src/
  components/
    AddToCalendarButton.tsx      # Calendar integration
    DateFilterChips.tsx          # Date range filter
    EventCard.tsx                # Event card component
    GlassCard.tsx                # Frosted glass card
    LoadingScreen.tsx            # Loading indicator
    ShareEventButton.tsx         # Native share
  constants/
    api.ts                       # API endpoints and base URL
    theme.ts                     # Design tokens and colors
  context/
    AuthContext.tsx               # Authentication state
  hooks/
    usePushNotifications.ts      # Push notification hook
  navigation/
    MainTabs.tsx                 # Bottom tab navigator
    RootNavigator.tsx            # Root stack navigator
  screens/
    CheckoutScreen.tsx           # Stripe checkout
    DJDetailScreen.tsx           # DJ profile
    DJsScreen.tsx                # DJ directory
    EventDetailScreen.tsx        # Event details
    FullScreenTicketScreen.tsx   # QR code display
    HomeScreen.tsx               # Event feed
    MyTicketsScreen.tsx          # Ticket list
    NearbyEventsScreen.tsx       # Map view
    NotificationPrefsScreen.tsx  # Notification settings
    OnboardingScreen.tsx         # Onboarding
    ProfileScreen.tsx            # User profile
    PromoterDashboardScreen.tsx  # Promoter stats
    SocialFeedScreen.tsx         # Social feed
    TicketConfirmationScreen.tsx # Purchase confirmation
    VenueDetailScreen.tsx        # Venue details
    VenuesScreen.tsx             # Venue directory
  services/
    api.ts                       # API client
    checkout.ts                  # Stripe checkout service
    notifications.ts             # Notification service
    pushNotifications.ts         # Push notification registration
    wallet.ts                    # Apple/Google Wallet
  types/
    index.ts                     # TypeScript interfaces
assets/
  icon.png                       # App icon
  splash-icon.png                # Splash screen
app.json                         # Expo configuration
```

---

## App Configuration

| Field | Value |
|-------|-------|
| Bundle ID (iOS) | `com.tbgroup.tbpmobile` |
| Package (Android) | `com.tbgroup.tbpmobile` |
| Orientation | Portrait |
| Theme | Dark |
| Min SDK | Expo SDK 55 |

### Permissions

| Permission | Purpose |
|------------|---------|
| Camera | QR code scanning at venue doors |
| Calendar | Add events to device calendar |
| Location | Find nearby events on map |
| Notifications | Event reminders and updates |

---

## License

Private. All rights reserved.

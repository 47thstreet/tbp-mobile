export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  venue: string;
  venueAddress?: string;
  image?: string;
  coverImage?: string;
  ticketTypes: TicketType[];
  djs?: DJ[];
  promoter?: string;
  tags?: string[];
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
  latitude?: number;
  longitude?: number;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  available: number;
  maxPerOrder?: number;
}

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketType: string;
  qrCode: string;
  status: 'valid' | 'used' | 'expired' | 'cancelled';
  purchasedAt: string;
  coverImage?: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  duration: number;
  coverArt?: string;
}

export interface DJ {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  genres: string[];
  tracks?: Track[];
  followed?: boolean;
  followerCount?: number;
  socialLinks?: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
  };
  upcomingEvents?: Event[];
}

export interface BookingRequest {
  djId: string;
  eventDate: string;
  eventName: string;
  venue: string;
  message?: string;
  contactEmail: string;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  photo?: string;
  coverImage?: string;
  capacity?: number;
  amenities?: string[];
  upcomingEvents?: Event[];
  socialLinks?: {
    instagram?: string;
    website?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'promoter' | 'organizer' | 'dj';
  avatar?: string;
  promoCode?: string;
}

export interface PromoterStats {
  totalSales: number;
  totalRevenue: number;
  commission: number;
  eventBreakdown: {
    eventId: string;
    eventTitle: string;
    sales: number;
    revenue: number;
  }[];
  promoCode: string;
  promoLink: string;
}

export interface FeedPost {
  id: string;
  type: 'photo' | 'story' | 'activity';
  author: {
    id: string;
    name: string;
    avatar?: string;
    persona?: 'noctvrnal' | 'mia-noir';
    verified?: boolean;
  };
  content: string;
  images?: string[];
  eventId?: string;
  eventTitle?: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
}

export interface FeedResponse {
  posts: FeedPost[];
  nextCursor?: string;
  hasMore: boolean;
}

export type PushNotificationType =
  | 'event_reminder_24h'
  | 'event_reminder_2h'
  | 'ticket_purchased'
  | 'friend_attending'
  | 'new_event_followed_dj';

export interface PushNotificationData {
  type: PushNotificationType;
  eventId?: string;
  ticketId?: string;
  djId?: string;
  title?: string;
  body?: string;
}

export interface NotificationPreferences {
  eventReminders: boolean;
  friendActivity: boolean;
  newEventsFollowedDjs: boolean;
  promotions: boolean;
}

export interface CheckoutSession {
  sessionId: string;
  clientSecret: string;
  publishableKey: string;
  amount: number;
  currency: string;
}

export interface CheckoutResult {
  success: boolean;
  ticketId?: string;
  error?: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  TicketDetail: { ticketId: string };
  DJDetail: { djId: string };
  VenueDetail: { venueId: string };
  Checkout: { eventId: string; ticketTypeId: string; ticketTypeName: string; price: number };
  TicketConfirmation: { ticketId: string; eventTitle: string; ticketTypeName: string };
  NearbyEvents: undefined;
  NotificationPrefs: undefined;
  FullScreenTicket: { ticket: Ticket };
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Nearby: undefined;
  Feed: undefined;
  MyTickets: undefined;
  DJs: undefined;
  Venues: undefined;
  Promoter: undefined;
  Profile: undefined;
};

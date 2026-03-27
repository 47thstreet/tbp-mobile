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

export interface DJ {
  id: string;
  name: string;
  bio?: string;
  photo?: string;
  genres: string[];
  socialLinks?: {
    instagram?: string;
    soundcloud?: string;
    spotify?: string;
  };
  upcomingEvents?: Event[];
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
  Checkout: { eventId: string; ticketTypeId: string; ticketTypeName: string; price: number };
  TicketConfirmation: { ticketId: string; eventTitle: string; ticketTypeName: string };
  FullScreenTicket: { ticket: Ticket };
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Feed: undefined;
  MyTickets: undefined;
  DJs: undefined;
  Promoter: undefined;
  Profile: undefined;
};

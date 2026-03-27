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

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  TicketDetail: { ticketId: string };
  DJDetail: { djId: string };
  TicketCheckout: { eventId: string; ticketTypeId: string };
  FullScreenTicket: { ticket: Ticket };
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  MyTickets: undefined;
  DJs: undefined;
  Promoter: undefined;
  Profile: undefined;
};

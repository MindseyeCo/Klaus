
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  handle?: string; // Unique identifier (e.g. @klaus)
  searchName?: string; // Lowercase for searching
  photoURL: string | null;
  status?: string; // Custom text status
  statusState?: 'online' | 'busy' | 'offline'; // Color indicator
  isOnline?: boolean;
  about?: string;
  themeSongUrl?: string;
  joinedCommunities?: string[];
  
  // Friends System
  friends?: string[]; // List of UIDs
  friendRequests?: {
      incoming: string[];
      outgoing: string[];
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'image' | 'audio';
  mediaUrl?: string;
  createdAt: number; // Unix timestamp
  readBy: string[];
  reactions?: Record<string, string>; // uid -> emoji
}

export interface ChatRoom {
  id: string;
  participants: string[];
  participantDetails: User[]; 
  lastMessage?: Message;
  unreadCount?: number;
  isGroup?: boolean;
  groupName?: string;
  typing?: string[]; // array of uids typing
  createdAt?: number;
  createdBy?: string;
  lastUpdated?: any;
  
  // Community Fields
  communityId?: string;
  channelName?: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  photoURL?: string;
  color?: string; // Custom accent color
  createdBy: string;
  ownerId: string;
  members: string[]; // List of UIDs
  isPublic?: boolean; // Discoverable
}

export interface Channel {
  id: string;
  name: string;
  communityId: string;
  type: 'text' | 'voice';
}

export interface NexusSearchFilters {
  yearStart?: string;
  yearEnd?: string;
  duration?: 'short' | 'medium' | 'long'; // <5m, 5-20m, >20m
  format?: 'archive' | 'space' | 'documentary' | 'book' | 'text';
}

export interface NexusPost {
  id: string;
  title: string;
  description: string;
  fullText?: string; // For articles/books
  videoUrl: string;
  thumbnailUrl: string;
  source: string; // "Internet Archive", "OpenLibrary", "NASA", "Klaus Drive"
  mediaType: 'video' | 'image' | 'text' | 'book' | 'audio';
  year?: string;
  views: number;
  likes: number;
  author: string;
  externalLink?: string;
  createdAt?: any; // Timestamp for sorting
}

export interface NexusCollection {
    title: string;
    description: string;
    posts: NexusPost[];
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

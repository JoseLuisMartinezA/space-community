export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export interface Metric {
  label: string;
  value: string;
  unit?: string;
  status: 'nominal' | 'warning' | 'critical' | 'success';
  trend?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export enum AnalysisType {
  IMAGE = 'image',
  VIDEO = 'video'
}

// User Interface
export interface User {
  id?: string;
  name: string;
  handle: string;
  email: string;
  role: string;
  bio: string;
  avatar: string;
}

// SpaceX API Interfaces
export interface SpaceXLaunch {
  id: string;
  name: string;
  date_utc: string;
  date_unix: number;
  details: string | null;
  success: boolean | null;
  links: {
    patch: {
      small: string | null;
      large: string | null;
    };
    flickr: {
      original: string[];
    };
    webcast: string | null;
    article: string | null;
    wikipedia: string | null;
  };
  rocket: string; // ID
  launchpad: string; // ID
  flight_number: number;
}

export interface SpaceXLaunchpad {
  id: string;
  name: string;
  full_name: string;
  locality: string;
  region: string;
}

export interface SpaceXRocket {
  id: string;
  name: string;
}

export interface NextLaunchData extends SpaceXLaunch {
  launchpadData?: SpaceXLaunchpad;
  rocketData?: SpaceXRocket;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  authorName: string;
  authorHandle: string;
  avatar: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
  tags?: { label: string; color: string }[];
  bgImage?: string;
  isVerified?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  bg_image?: string;
  tags?: any;
  created_at: string;
  profiles?: User; // Joined data
  likes_count?: number;
}

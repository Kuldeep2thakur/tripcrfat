import { DocumentReference, Timestamp } from "firebase/firestore";

export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate:string;
  description: string;
  coverPhotoId?: string;
  coverPhotoURL?: string; // Added for custom thumbnails
  visibility: 'private' | 'public' | 'shared';
  sharedWith?: string[];
  ownerId?: string;
  tripRef?: DocumentReference
  location?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
};

export type User = {
  id: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: Timestamp;
};

export type Entry = {
    id: string;
    tripId: string;
    title: string;
    content: string;
    visitedAt: Timestamp | Date | string;
    createdAt?: Timestamp | Date | string;
    authorId?: string;
    media?: string[];
    location?: {
        name: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
}

import type { User, Trip } from './types';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Asha Traveler',
    avatarId: 'avatar-1',
  },
  {
    id: 'user-2',
    name: 'Ben Explorer',
    avatarId: 'avatar-2',
  },
    {
    id: 'user-3',
    name: 'Chloe Voyager',
    avatarId: 'avatar-3',
  },
];

export const trips: Trip[] = [
  {
    id: 'trip-1',
    title: 'Tokyo Spring 2025',
    startDate: 'Mar 15, 2025',
    endDate: 'Mar 22, 2025',
    description: 'An amazing week exploring the vibrant city of Tokyo during cherry blossom season. From Shibuya Crossing to ancient temples.',
    coverPhotoId: 'trip-cover-1',
    visibility: 'public',
  },
  {
    id: 'trip-2',
    title: 'Romantic Getaway in Paris',
    startDate: 'Jun 05, 2025',
    endDate: 'Jun 10, 2025',
    description: 'A romantic trip to the city of lights. Visited the Louvre, Eiffel Tower, and enjoyed countless pastries.',
    coverPhotoId: 'trip-cover-2',
    visibility: 'private',
    sharedWith: [users[1], users[2]],
  },
  {
    id: 'trip-3',
    title: 'Journey Through Ancient Rome',
    startDate: 'Sep 12, 2024',
    endDate: 'Sep 19, 2024',
    description: 'Stepping back in time to explore the Colosseum, Roman Forum, and Vatican City. The history is breathtaking.',
    coverPhotoId: 'trip-cover-3',
    visibility: 'shared',
    sharedWith: [users[1]],
  },
  {
    id: 'trip-4',
    title: 'Bali Beach Paradise',
    startDate: 'Jul 20, 2024',
    endDate: 'Aug 01, 2024',
    description: 'Two weeks of sun, sand, and serenity in Bali. Surfing, yoga, and exploring lush rice terraces.',
    coverPhotoId: 'trip-cover-4',
    visibility: 'public',
  },
    {
    id: 'trip-5',
    title: 'American Southwest Road Trip',
    startDate: 'May 01, 2024',
    endDate: 'May 15, 2024',
    description: 'An epic road trip through Arizona and Utah, visiting the Grand Canyon, Zion, and Bryce Canyon.',
    coverPhotoId: 'trip-cover-5',
    visibility: 'private',
  },
  {
    id: 'trip-6',
    title: 'Sydney & The Blue Mountains',
    startDate: 'Dec 22, 2023',
    endDate: 'Jan 02, 2024',
    description: 'Celebrating New Year in Sydney with spectacular fireworks, followed by hiking in the beautiful Blue Mountains.',
    coverPhotoId: 'trip-cover-6',
    visibility: 'public',
  },
];

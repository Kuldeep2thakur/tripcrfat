'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-next-destination.ts';
import '@/ai/flows/summarize-trip-entry.ts';
import '@/ai/flows/expand-to-diary-entry.ts';
import '@/ai/flows/plan-trip.ts';

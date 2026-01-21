import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({
  model: "-2.5-flash",
  generationConfig: { responseMimeType: "application/json" }
}) : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromDestination, toDestination, duration, budget, travelers, interests, travelStyle } = body;

    console.log('Request body:', { fromDestination, toDestination, duration, budget, travelers, interests, travelStyle });

    if (!toDestination || !duration) {
      return NextResponse.json(
        { error: 'Destination and duration are required' },
        { status: 400 }
      );
    }

    // Check availability of Gemini API
    if (!apiKey || !model) {
      console.warn('GEMINI_API_KEY is missing. Using fallback.');
      // Return fallback immediately if no key
      return NextResponse.json({
        fallback: true,
        message: "Gemini API Key missing. Using fallback plan.",
        fromDestination: fromDestination || '',
        toDestination,
        duration,
        budget: budget || 'Moderate',
        itinerary: generateFallbackItinerary(fromDestination, toDestination, duration, interests),
        recommendations: generateFallbackRecommendations(toDestination, fromDestination),
        tips: generateFallbackTips(toDestination, fromDestination)
      });
    }

    // Build the prompt
    const routeInfo = fromDestination
      ? `from ${fromDestination} to ${toDestination}`
      : `to ${toDestination}`;

    const prompt = `Act as an expert local travel guide and logistics planner. Create a highly detailed, realistic, and personalized ${duration}-day trip itinerary ${routeInfo}.

**Trip Parameters:**
- **Destination:** ${toDestination}
${fromDestination ? `- **Origin:** ${fromDestination}` : ''}
- **Duration:** ${duration} days
- **Budget Level:** ${budget || 'Standard'}
${travelers ? `- **Group Size:** ${travelers} people` : ''}
${interests ? `- **Key Interests:** ${interests}` : ''}
${travelStyle ? `- **Travel Style:** ${travelStyle}` : ''}

**Requirements for Accuracy:**
1.  **REAL PLACES ONLY:** Use actual names of existing hotels, restaurants (with cuisine type), transport hubs, and attractions. Do not use generic terms like "Local Restaurant" or "City Park".
2.  **LOGISTICAL FLOW:** Ensure activities are geographically grouped to minimize travel time.
3.  **TIMING:** Provide realistic time allocations for each activity.
4.  **SPECIFICITY:** For "Accommodation", suggest 3 specific real hotels/hostels matching the budget. For "Dining", suggest specific real restaurants.

**Output Format (Strict JSON):**
You must return a JSON object with this exact schema:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Short descriptive title for the day (e.g., 'Arrival & Downtown Exploration')",
      "activities": [
        { "time": "Morning (09:00 - 12:00)", "activity": "Specific activity description with real place names" },
        { "time": "Afternoon (13:00 - 17:00)", "activity": "Specific activity description" },
        { "time": "Evening (18:00 - 22:00)", "activity": "Specific activity description" }
      ]
    }
  ],
  "recommendations": {
    "accommodation": ["Real Hotel Name 1 - Brief why", "Real Hotel Name 2 - Brief why", "Real Hotel Name 3 - Brief why"],
    "dining": ["Restaurant Name 1 (Cuisine) - Brief dish rec", "Restaurant Name 2 (Cuisine)", "Restaurant Name 3"],
    "activities": ["Specific Attraction 1", "Specific Experience 2", "Specific Spot 3"],
    "transportation": ["Best mode (e.g., Metro line X, Uber, Walking)", "Tips for tickets", "Airport transfer info"]
  },
  "tips": ["Practical tip 1", "Practical tip 2", "Safety tip", "Cultural tip", "Budget tip"]
}`;

    console.log('Calling Gemini API...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('Gemini response received, length:', text.length);

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const planData = JSON.parse(text);
      console.log('Successfully parsed Gemini response');

      // Add the original form data to the response
      const completePlan = {
        fromDestination: fromDestination || '',
        toDestination,
        duration,
        budget: budget || 'Moderate',
        ...planData
      };

      return NextResponse.json(completePlan);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);

      // Return a fallback response if parsing fails
      return NextResponse.json({
        error: 'Failed to parse AI response',
        fallback: true,
        fromDestination: fromDestination || '',
        toDestination,
        duration,
        budget: budget || 'Moderate',
        itinerary: generateFallbackItinerary(fromDestination, toDestination, duration, interests),
        recommendations: generateFallbackRecommendations(toDestination, fromDestination),
        tips: generateFallbackTips(toDestination, fromDestination)
      });
    }
  } catch (error: any) {
    console.error('Error generating trip plan with Gemini:', error);

    // Check for quota exceeded or other specific Gemini errors
    const isQuotaError = error.message?.includes('429') || error.message?.includes('quota');

    return NextResponse.json({
      fallback: true,
      error: error.message || 'Failed to generate trip plan',
      isQuotaError,
      fromDestination: '', // Default values for proper typing if needed, extracted inside try block ideally
      toDestination: '',
      duration: '',
      budget: 'Moderate',
      itinerary: generateFallbackItinerary('', '', '3', ''), // Rudimentary fallback if crash happens early
      recommendations: generateFallbackRecommendations('', ''),
      tips: generateFallbackTips('', '')
    });
  }
}

// Enhanced fallback functions with better content
function generateFallbackItinerary(from: string, to: string, duration: string, interests: string) {
  const days = parseInt(duration) || 3;
  const itinerary = [];
  const hasFrom = from && from.trim();

  const activityTemplates = {
    culture: ['Visit museums and art galleries', 'Explore historical sites and monuments', 'Attend cultural performances'],
    food: ['Take a food tour', 'Visit local markets', 'Try traditional restaurants'],
    adventure: ['Outdoor activities and hiking', 'Adventure sports', 'Nature exploration'],
    relaxation: ['Spa and wellness activities', 'Beach time', 'Leisure walks'],
    default: ['Explore main attractions', 'Visit popular landmarks', 'Local experiences']
  };

  const interestKey = interests?.toLowerCase().includes('culture') ? 'culture' :
    interests?.toLowerCase().includes('food') ? 'food' :
      interests?.toLowerCase().includes('adventure') ? 'adventure' :
        interests?.toLowerCase().includes('relax') ? 'relaxation' : 'default';

  for (let i = 1; i <= Math.min(days, 7); i++) {
    let dayTitle = `Day ${i}`;
    let activities = [];

    if (i === 1 && hasFrom) {
      dayTitle = `Day ${i}: ${from} → ${to}`;
      activities = [
        { time: 'Morning', activity: `Depart from ${from} and travel to ${to}` },
        { time: 'Afternoon', activity: `Arrive in ${to}, check-in to accommodation, and freshen up` },
        { time: 'Evening', activity: `Take an evening stroll around the neighborhood and enjoy a welcome dinner` },
      ];
    } else if (i === Math.min(days, 7) && hasFrom && days > 2) {
      dayTitle = `Day ${i}: Return Journey`;
      activities = [
        { time: 'Morning', activity: `Final breakfast and last-minute souvenir shopping in ${to}` },
        { time: 'Afternoon', activity: `Check-out and depart for ${from}` },
        { time: 'Evening', activity: `Arrive back in ${from}` },
      ];
    } else {
      dayTitle = `Day ${i}: Exploring ${to}`;
      const templates = activityTemplates[interestKey];
      activities = [
        { time: 'Morning', activity: `${templates[0]} in ${to}` },
        { time: 'Afternoon', activity: `${templates[1]} and enjoy lunch at a local spot` },
        { time: 'Evening', activity: `${templates[2]} and dinner at a recommended restaurant` },
      ];
    }

    itinerary.push({ day: i, title: dayTitle, activities });
  }

  return itinerary;
}

function generateFallbackRecommendations(to: string, from: string) {
  return {
    accommodation: [
      `Budget-friendly hotels in ${to}`,
      `Boutique stays with local charm`,
      `Airbnb options for authentic experience`,
    ],
    dining: [
      `Must-try local restaurants in ${to}`,
      `Street food recommendations`,
      `Fine dining experiences`,
    ],
    activities: [
      `Popular activities in ${to}`,
      `Hidden gems and local favorites`,
      `Day trips and excursions`,
    ],
    transportation: [
      from ? `Best routes from ${from} to ${to}` : `Local transportation options`,
      `Airport transfers and car rentals`,
      `Public transport passes and tips`,
    ],
  };
}

function generateFallbackTips(to: string, from: string) {
  const tips = [
    `Best time to visit ${to} is during spring or fall`,
    `Book accommodations at least 2-3 weeks in advance`,
    `Learn a few basic phrases in the local language`,
    `Always carry a portable charger and universal adapter`,
    `Download offline maps before you go`,
  ];

  if (from) {
    tips.unshift(`Check visa requirements for traveling from ${from} to ${to}`);
    tips.push(`Compare flight prices and book early for the ${from}-${to} route`);
  }

  return tips;
}

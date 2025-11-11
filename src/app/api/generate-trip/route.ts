import { NextRequest, NextResponse } from 'next/server';

// Using Hugging Face Inference API (completely free!)
// Using Meta's Llama model - actively maintained and free
const HF_API_URL = 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct';

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

    // Build the prompt
    const routeInfo = fromDestination 
      ? `from ${fromDestination} to ${toDestination}` 
      : `to ${toDestination}`;

    const prompt = `You are an expert travel planner. Create a detailed ${duration}-day trip plan ${routeInfo}.

Trip Details:
- Destination: ${toDestination}
${fromDestination ? `- Starting from: ${fromDestination}` : ''}
- Duration: ${duration} days
${budget ? `- Budget: ${budget}` : ''}
${travelers ? `- Number of travelers: ${travelers}` : ''}
${interests ? `- Interests: ${interests}` : ''}
${travelStyle ? `- Travel style: ${travelStyle}` : ''}

Please provide a comprehensive trip plan in the following JSON format:
{
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1 title",
      "activities": [
        { "time": "Morning", "activity": "Activity description" },
        { "time": "Afternoon", "activity": "Activity description" },
        { "time": "Evening", "activity": "Activity description" }
      ]
    }
  ],
  "recommendations": {
    "accommodation": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "dining": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "activities": ["recommendation 1", "recommendation 2", "recommendation 3"],
    "transportation": ["recommendation 1", "recommendation 2", "recommendation 3"]
  },
  "tips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"]
}

Important guidelines:
${fromDestination ? `- Day 1 should include travel from ${fromDestination} to ${toDestination}` : ''}
${fromDestination ? `- Last day should include return travel from ${toDestination} to ${fromDestination}` : ''}
- Make recommendations specific to ${toDestination}
- Consider the budget level if provided
- Tailor activities to the stated interests
- Provide practical, actionable advice
- Include specific place names and attractions
- Make the itinerary realistic and achievable

Return ONLY valid JSON, no markdown formatting or code blocks.`;

    console.log('Calling Hugging Face API...');
    
    // Call Hugging Face API (no API key needed for public models!)
    const response = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF API Error:', response.status, errorText);
      
      // If API fails, use fallback immediately
      console.log('Using fallback generation due to API error');
      return NextResponse.json({
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

    const result = await response.json();
    console.log('HF API Response:', JSON.stringify(result).substring(0, 200));
    
    let text = '';
    
    if (Array.isArray(result) && result[0]?.generated_text) {
      text = result[0].generated_text;
    } else if (result.generated_text) {
      text = result.generated_text;
    } else if (result.error) {
      console.error('HF API returned error:', result.error);
      // Use fallback if API returns error
      return NextResponse.json({
        fallback: true,
        fromDestination: fromDestination || '',
        toDestination,
        duration,
        budget: budget || 'Moderate',
        itinerary: generateFallbackItinerary(fromDestination, toDestination, duration, interests),
        recommendations: generateFallbackRecommendations(toDestination, fromDestination),
        tips: generateFallbackTips(toDestination, fromDestination)
      });
    } else {
      console.error('Unexpected response format:', result);
      // Use fallback for unexpected format
      return NextResponse.json({
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
    
    console.log('AI response received, length:', text.length);

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const planData = JSON.parse(text);
      console.log('Successfully parsed AI response');
      
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
    console.error('Error generating trip plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate trip plan' },
      { status: 500 }
    );
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

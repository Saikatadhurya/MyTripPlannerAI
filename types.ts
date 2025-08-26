export type Budget = 'Budget' | 'Midrange' | 'Luxury';
export type Vibe = 'Culture & Heritage' | 'Adventure' | 'Relaxation' | 'Nightlife';
export type FoodPreference = 'Veg' | 'Non-Veg' | 'Vegan';

export interface DayPlan {
  day: number;
  title: string;
  activities: string[];
  food: string[];
}

export interface Itinerary {
  destination: string;
  days: number;
  budget: Budget;
  vibe: Vibe;
  foodPreference: FoodPreference;
  startDate: string;
  budgetSummary: {
    stay: string;
    food: string;
    total: string;
  };
  historicBackground: string;
  famousCulture: string[];
  naturalPlaces: string[];
  museums: string[];
  specialOrnaments: string[];
  placesToStay: string[];
  recommendedRestaurants: string[];
  specialEvents: string[];
  plan: DayPlan[];
}

export interface PopularDestination {
  name: string;
  description: string;
  bestTime: string;
  icon: string;
}
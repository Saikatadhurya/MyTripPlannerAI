
export type Budget = 'Budget' | 'Midrange' | 'Luxury';
export type Vibe = 'Adventure & Thrill' | 'Relaxation & Wellness' | 'Cultural & Heritage' | 'Nature & Wildlife' | 'Food & Culinary' | 'Nightlife & Entertainment' | 'Luxury & Leisure' | 'Romantic & Family Getaways';
export type FoodPreference = 'Veg' | 'Non-Veg' | 'Vegan';
export type TripType = 'Standard' | 'Bike' | 'Car';

export interface QuestionnaireData {
    destination: string;
    startPoint: string;
    tripType: TripType;
    days: number;
    budget: Budget;
    vibe: Vibe[];
    persons: number;
    foodPreference: FoodPreference;
    startDate: string;
    includeMedical: boolean;
    language: string;
}

export interface DayPlan {
  day: number;
  title: string;
  activities: string[];
  food: string[];
  placesToStay: string[];
  approxCost: string;
  medicalFacilities?: string[];
  transport?: {
    suggestions: string[];
    cost: string;
  };
}

export interface BlogReference {
  title: string;
  url: string;
  description: string;
  source: string;
}

export interface Itinerary {
  destination: string;
  startPoint: string;
  tripType: TripType;
  days: number;
  persons: number;
  budget: Budget;
  vibe: Vibe[];
  foodPreference: FoodPreference;
  startDate: string;
  language: string;
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
  recommendedRestaurants: string[];
  specialEvents: string[];
  plan: DayPlan[];
  referenceBlogs: BlogReference[];
}

export interface PopularDestination {
  name: string;
  description: string;
  bestTime: string;
  icon: string;
}
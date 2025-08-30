export type Budget = 'Budget' | 'Midrange' | 'Luxury';
export type Vibe = 'Adventure & Thrill' | 'Relaxation & Wellness' | 'Cultural & Heritage' | 'Nature & Wildlife' | 'Food & Culinary' | 'Nightlife & Entertainment' | 'Luxury & Leisure' | 'Romantic & Family Getaways';
export type FoodPreference = 'Veg' | 'Non-Veg' | 'Vegan';
export type TripType = 'Standard' | 'Bike' | 'Car';

export interface QuestionnaireData {
    destination: string;
    startPoint: string;
    tripType: TripType;
    isRoundTrip?: boolean;
    days: number;
    budget: Budget;
    vibe: Vibe[];
    persons: number;
    foodPreference: FoodPreference;
    startDate: string;
    includeMedical: boolean;
    language: string;
    currency: string;
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

export interface DestinationDetails {
  name: string;
  historicBackground: string[];
  famousCulture: string[];
  naturalPlaces: string[];
  museums: string[];
  specialOrnaments: string[];
  recommendedRestaurants: string[];
  specialEvents: string;
}

export interface CurrencyConversion {
    fromCurrency: string;
    toCurrency: string;
    rateText: string;
}

export interface Itinerary {
  destination: string; // Main or farthest destination
  startPoint: string;
  tripType: TripType;
  isRoundTrip?: boolean;
  days: number;
  persons: number;
  budget: Budget;
  vibe: Vibe[];
  foodPreference: FoodPreference;
  startDate: string;
  language: string;
  currency: string;
  currencyConversion?: CurrencyConversion;
  budgetSummary: {
    stay: string;
    food: string;
    fuel?: string;
    miscellaneous?: string;
    total: string;
  };
  coveredDestinations: DestinationDetails[];
  plan: DayPlan[];
  referenceBlogs: BlogReference[];
}

export interface PopularDestination {
  name: string;
  description: string;
  bestTime: string;
  icon: string;
}

export interface LocationSuggestion {
  type: 'Country' | 'State' | 'City' | 'Village';
  name: string;
  parentHierarchy: string;
}


export interface PackingListRequestData {
    destination: string;
    startDate: string;
    days: number;
    language: string;
}

export interface PackingList {
    clothingAndFootwear: string[];
    toiletriesAndPersonalCare: string[];
    medicinesAndHealth: string[];
    electronicsAndGear: string[];
    documentsAndMoney: string[];
    optionalComfortItems: string[];
    adventureClothing: string[];
    bagSuggestion: string;
    locallyAvailableItems: string[];
    destination: string;
    days: number;
    approximateTemperature: string;
    startDate: string;
}

export interface FoodFinderRequestData {
    destination: string;
    startDate: string;
    foodPreference: FoodPreference;
    includeBeverages: boolean;
    language: string;
}

export interface FoodItem {
    name: string;
    description: string;
}

export interface FoodRecommendations {
    destination: string;
    breakfast: FoodItem[];
    lunch: FoodItem[];
    snacksAndStreetFood: FoodItem[];
    dinner: FoodItem[];
    dessertAndSweets: FoodItem[];
    drinksAndBeverages: FoodItem[];
    iconicDishes: FoodItem[];
    hiddenRecipes: FoodItem[];
    trendingOrViralFoods: FoodItem[];
    chefsSpecials: FoodItem[];
    festivalFoods: FoodItem[];
    seasonalSpecials: FoodItem[];
    streetFestivalsAndFoodMelas: FoodItem[];
}

export interface AppFinderRequestData {
    destination: string;
    language: string;
}

export interface MobileApp {
    name: string;
    description: string;
    platform: 'iOS' | 'Android' | 'Both';
    icon: string; // Emoji
}

export interface AppRecommendations {
    destination: string;
    transportAndTravel: MobileApp[];
    stayAndLiving: MobileApp[];
    foodAndDining: MobileApp[];
    entertainmentAndLeisure: MobileApp[];
    shoppingAndEssentials: MobileApp[];
    explorationAndTours: MobileApp[];
    utilitiesAndSafety: MobileApp[];
    festivalsAndSeasonal: MobileApp[];
}
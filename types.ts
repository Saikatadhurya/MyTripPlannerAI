export type Budget = 'Standard' | 'Midrange' | 'Luxury';
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
    endDate?: string;
    includeMedical: boolean;
    language: string;
    currency: string;
    includeAlcoholicDrinks: boolean;
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
  planNote?: string;
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
    coveredDestinations?: DestinationDetails[];
}

export interface PackingList {
    maleClothing: string[];
    femaleClothing: string[];
    clothingAndFootwear?: string[]; // Deprecated: kept for backward compatibility
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
    includeAlcoholicDrinks: boolean;
    language: string;
    coveredDestinations?: DestinationDetails[];
}

export interface FoodItem {
    name: string;
    description: string;
}

export interface FoodItemGroup {
    location: string;
    items: FoodItem[];
}

export interface FoodRecommendations {
    destination: string;
    breakfast: FoodItemGroup[];
    lunch: FoodItemGroup[];
    snacksAndStreetFood: FoodItemGroup[];
    dinner: FoodItemGroup[];
    dessertAndSweets: FoodItemGroup[];
    drinksAndBeverages: FoodItemGroup[];
    iconicDishes: FoodItemGroup[];
    hiddenRecipes: FoodItemGroup[];
    trendingOrViralFoods: FoodItemGroup[];
    chefsSpecials: FoodItemGroup[];
    seasonalSpecials: FoodItemGroup[];
    festivalAndStreetFoods: FoodItemGroup[];
}

export interface AppFinderRequestData {
    destination: string;
    language: string;
    coveredDestinations?: DestinationDetails[];
}

export interface MobileApp {
    name: string;
    category: string;
    description: string;
    platform: 'iOS' | 'Android' | 'Both';
    icon: string; // Emoji
    location?: string;
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

// Types for Local Music Finder
export interface MusicFinderRequestData {
    destination: string;
    language: string;
    coveredDestinations?: DestinationDetails[];
}

export interface MusicItem {
    title: string;
    artistOrDescription: string;
    appLinks: {
        appName: 'Spotify' | 'Apple Music' | 'YouTube' | 'JioSaavn' | 'Gaana' | 'Wynk' | 'Anghami' | 'Boomplay' | 'Deezer' | 'SoundCloud';
    }[];
}

export interface MusicGenreCategory {
    genre: string;
    description: string;
    music: MusicItem[];
}

export interface MusicRecommendations {
    destination: string;
    musicCategories: MusicGenreCategory[];
}

// Types for Local Lingo Guide
export interface LingoFinderRequestData {
    destination: string;
    language: string;
}

export interface Phrase {
    english: string;
    local: string;
    pronunciation: string;
}

export interface PhraseCategory {
    categoryName: string;
    phrases: Phrase[];
}

export interface LingoRecommendations {
    destination: string;
    localLanguage: string;
    categories: PhraseCategory[];
}


export interface UnifiedPlan {
  itinerary: Itinerary | null;
  packingList: PackingList | null;
  appRecommendations: AppRecommendations | null;
  foodRecommendations: FoodRecommendations | null;
  musicRecommendations: MusicRecommendations | null;
  lingoRecommendations: LingoRecommendations | null;
}

export type UnifiedPlanLoadingState = 'pending' | 'loading' | 'done' | 'error' | 'cancelled';

export interface UnifiedPlanLoadingStatus {
  itinerary: UnifiedPlanLoadingState;
  packing: UnifiedPlanLoadingState;
  apps: UnifiedPlanLoadingState;
  food: UnifiedPlanLoadingState;
  music: UnifiedPlanLoadingState;
  lingo: UnifiedPlanLoadingState;
}

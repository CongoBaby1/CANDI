// localStorage-based storage for My Gardens feature

const STORAGE_KEYS = {
  GARDENS: 'my_gardens_gardens',
  PLANTS: 'my_gardens_plants',
  ACTIVITIES: 'my_gardens_activities',
};

export interface Garden {
  id: string;
  name: string;
  type: string;
  location: string;
  lighting: string;
  notes: string;
  createdAt: string;
}

export interface Plant {
  id: string;
  gardenId: string;
  name: string;
  strainOrType: string;
  startDate: string;
  source: 'Seed' | 'Clone' | 'Unknown';
  stage: string;
  medium: string;
  potSize: string;
  lightSchedule: string;
  currentPH: string;
  currentPPM: string;
  height: string;
  healthStatus: string;
  notes: string;
  imageUrl: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  plantId: string;
  type: string;
  date: string;
  notes: string;
  ph: string;
  ppm: string;
  amount: string;
  imageUrl: string;
  aiExaminationResult?: AIExaminationResult | null;
}

export interface AIExaminationResult {
  overallStatus: string;
  plantSummary: string;
  whatLooksGood: string[];
  possibleIssues: string[];
  likelyCauses: string[];
  recommendedNextSteps: string[];
  whatToMonitor: string[];
  suggestedReminder: string;
  confidenceLevel: 'Low' | 'Medium' | 'High';
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(`[MyGardensStorage] Failed to parse ${key}`, e);
  }
  return fallback;
}

function setItem(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[MyGardensStorage] Failed to save ${key}`, e);
  }
}

// Gardens
export function getGardens(): Garden[] {
  return getItem<Garden[]>(STORAGE_KEYS.GARDENS, []);
}

export function saveGardens(gardens: Garden[]) {
  setItem(STORAGE_KEYS.GARDENS, gardens);
}

export function addGarden(garden: Garden): Garden[] {
  const gardens = getGardens();
  gardens.push(garden);
  saveGardens(gardens);
  return gardens;
}

export function updateGarden(id: string, updates: Partial<Garden>): Garden[] {
  const gardens = getGardens();
  const index = gardens.findIndex(g => g.id === id);
  if (index !== -1) {
    gardens[index] = { ...gardens[index], ...updates };
    saveGardens(gardens);
  }
  return gardens;
}

export function deleteGarden(id: string): Garden[] {
  // Get all plants in this garden before deletion
  const plantsInGarden = getPlants().filter(p => p.gardenId === id);
  const plantIdsInGarden = plantsInGarden.map(p => p.id);
  
  // Remove plants from this garden
  const remainingPlants = getPlants().filter(p => p.gardenId !== id);
  savePlants(remainingPlants);
  
  // Remove activities for plants in this garden
  const remainingActivities = getActivities().filter(a => !plantIdsInGarden.includes(a.plantId));
  saveActivities(remainingActivities);
  
  // Remove the garden
  const gardens = getGardens().filter(g => g.id !== id);
  saveGardens(gardens);
  return gardens;
}

// Plants
export function getPlants(): Plant[] {
  return getItem<Plant[]>(STORAGE_KEYS.PLANTS, []);
}

export function savePlants(plants: Plant[]) {
  setItem(STORAGE_KEYS.PLANTS, plants);
}

export function getPlantsByGarden(gardenId: string): Plant[] {
  return getPlants().filter(p => p.gardenId === gardenId);
}

export function addPlant(plant: Plant): Plant[] {
  const plants = getPlants();
  plants.push(plant);
  savePlants(plants);
  return plants;
}

export function updatePlant(id: string, updates: Partial<Plant>): Plant[] {
  const plants = getPlants();
  const index = plants.findIndex(p => p.id === id);
  if (index !== -1) {
    plants[index] = { ...plants[index], ...updates };
    savePlants(plants);
  }
  return plants;
}

export function deletePlant(id: string): Plant[] {
  const plants = getPlants().filter(p => p.id !== id);
  savePlants(plants);
  const activities = getActivities().filter(a => a.plantId !== id);
  saveActivities(activities);
  return plants;
}

// Activities
export function getActivities(): Activity[] {
  return getItem<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
}

export function saveActivities(activities: Activity[]) {
  setItem(STORAGE_KEYS.ACTIVITIES, activities);
}

export function getActivitiesByPlant(plantId: string): Activity[] {
  return getActivities()
    .filter(a => a.plantId === plantId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getRecentActivitiesByPlant(plantId: string, limit: number = 10): Activity[] {
  return getActivitiesByPlant(plantId).slice(0, limit);
}

export function addActivity(activity: Activity): Activity[] {
  const activities = getActivities();
  activities.push(activity);
  saveActivities(activities);
  return activities;
}

// Helpers
export function generateId(): string {
  return `mg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function calculateAgeInDays(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function getLastActivityDate(plantId: string): string | null {
  const activities = getActivitiesByPlant(plantId);
  if (activities.length === 0) return null;
  return activities[0].date;
}

const GARDEN_TYPE_OPTIONS = [
  'Indoor Tent',
  'Outdoor Garden',
  'Greenhouse',
  'Hydro Setup',
  'Veg Room',
  'Flower Room',
  'Other',
];

const PLANT_STAGE_OPTIONS = [
  'Seedling',
  'Vegetative',
  'Pre-flower',
  'Flowering',
  'Flush',
  'Harvested',
  'Archived',
];

const HEALTH_STATUS_OPTIONS = [
  'Healthy',
  'Needs Attention',
  'Problem',
  'Harvested',
];

const ACTIVITY_TYPE_OPTIONS = [
  'Watered',
  'Fed Nutrients',
  'pH Checked',
  'PPM Checked',
  'Transplanted',
  'Pruned',
  'Topped',
  'Photo Added',
  'Problem Noticed',
  'AI Examination',
  'Harvested',
  'General Note',
];

const SOURCE_OPTIONS = ['Seed', 'Clone', 'Unknown'];

export {
  GARDEN_TYPE_OPTIONS,
  PLANT_STAGE_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  SOURCE_OPTIONS,
};
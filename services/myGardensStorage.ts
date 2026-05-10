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

import { get, set } from 'idb-keyval';

let gardensCache: Garden[] = [];
let plantsCache: Plant[] = [];
let activitiesCache: Activity[] = [];
let isInitialized = false;

export async function initStorage() {
  if (isInitialized) return;
  try {
    gardensCache = (await get<Garden[]>(STORAGE_KEYS.GARDENS)) || [];
    plantsCache = (await get<Plant[]>(STORAGE_KEYS.PLANTS)) || [];
    activitiesCache = (await get<Activity[]>(STORAGE_KEYS.ACTIVITIES)) || [];
    isInitialized = true;
  } catch (e) {
    console.error("Failed to initialize storage from IDB", e);
  }
}

// Gardens
export function getGardens(): Garden[] {
  return gardensCache;
}

export function saveGardens(gardens: Garden[]) {
  gardensCache = gardens;
  set(STORAGE_KEYS.GARDENS, gardens).catch(e => console.error("Failed to save gardens to IDB", e));
}

export function addGarden(garden: Garden): Garden[] {
  const gardens = [...gardensCache];
  gardens.push(garden);
  saveGardens(gardens);
  return gardens;
}

export function updateGarden(id: string, updates: Partial<Garden>): Garden[] {
  const gardens = [...gardensCache];
  const index = gardens.findIndex(g => g.id === id);
  if (index !== -1) {
    gardens[index] = { ...gardens[index], ...updates };
    saveGardens(gardens);
  }
  return gardens;
}

export function deleteGarden(id: string): Garden[] {
  const plantsInGarden = plantsCache.filter(p => p.gardenId === id);
  const plantIdsInGarden = plantsInGarden.map(p => p.id);
  
  const remainingPlants = plantsCache.filter(p => p.gardenId !== id);
  savePlants(remainingPlants);
  
  const remainingActivities = activitiesCache.filter(a => !plantIdsInGarden.includes(a.plantId));
  saveActivities(remainingActivities);
  
  const gardens = gardensCache.filter(g => g.id !== id);
  saveGardens(gardens);
  return gardens;
}

// Plants
export function getPlants(): Plant[] {
  return plantsCache;
}

export function savePlants(plants: Plant[]) {
  plantsCache = plants;
  set(STORAGE_KEYS.PLANTS, plants).catch(e => console.error("Failed to save plants to IDB", e));
}

export function getPlantsByGarden(gardenId: string): Plant[] {
  return plantsCache.filter(p => p.gardenId === gardenId);
}

export function addPlant(plant: Plant): Plant[] {
  const plants = [...plantsCache];
  plants.push(plant);
  savePlants(plants);
  return plants;
}

export function updatePlant(id: string, updates: Partial<Plant>): Plant[] {
  const plants = [...plantsCache];
  const index = plants.findIndex(p => p.id === id);
  if (index !== -1) {
    plants[index] = { ...plants[index], ...updates };
    savePlants(plants);
  }
  return plants;
}

export function deletePlant(id: string): Plant[] {
  const plants = plantsCache.filter(p => p.id !== id);
  savePlants(plants);
  
  const activities = activitiesCache.filter(a => a.plantId !== id);
  saveActivities(activities);
  return plants;
}

// Activities
export function getActivities(): Activity[] {
  return activitiesCache;
}

export function saveActivities(activities: Activity[]) {
  activitiesCache = activities;
  set(STORAGE_KEYS.ACTIVITIES, activities).catch(e => console.error("Failed to save activities to IDB", e));
}

export function getActivitiesByPlant(plantId: string): Activity[] {
  return activitiesCache
    .filter(a => a.plantId === plantId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getRecentActivitiesByPlant(plantId: string, limit: number = 10): Activity[] {
  return getActivitiesByPlant(plantId).slice(0, limit);
}

export function addActivity(activity: Activity): Activity[] {
  const activities = [...activitiesCache];
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
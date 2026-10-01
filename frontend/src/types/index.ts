export type Crop = 'COFFEE' | 'MAIZE' | 'BEANS' | 'TEA' | 'OTHER';
export type Challenge = 'LOW_YIELD' | 'PESTS_DISEASE' | 'SOIL_QUALITY' | 'WATER_AVAILABILITY' | 'BUYER_ACCESS' | 'FINANCE_ACCESS' | 'INPUT_COSTS';
export type ServiceType = 'AGRONOMIST_VISIT' | 'SOIL_TEST' | 'BIOCHAR_ASSESSMENT' | 'COFFEE_QUALITY_ASSESSMENT' | 'BUYER_OFFTAKE_SUPPORT';
export type RequestStatus = 'PENDING' | 'IN_REVIEW' | 'ASSIGNED' | 'COMPLETED' | 'CANCELLED';
export type HealthStatus = 'STRONG_POSITION' | 'MODERATE_OPPORTUNITY' | 'HIGH_OPPORTUNITY';

export interface Farmer {
  id: string; farmerId: string; fullName: string; mobileNumber: string; email: string | null;
  country: string; county: string; region: string | null; preferredLanguage: string; createdAt: string;
}
export interface InsightItem { title: string; description: string; category: 'metric' | 'gap' | 'challenge' | 'info' }
export interface Recommendation { title: string; description: string; reason: string; serviceType: ServiceType; triggers: string[] }
export interface ScoreDimension { key: string; label: string; max: number; points: number; explanation: string }
export interface ScoreBreakdown {
  scoreMeaning: string; dimensions: ScoreDimension[];
  metrics: { productionPerTreeKg: number | null; treesPerAcre: number | null; productionPerAcreKg: number | null };
  availableInformation: string[]; missingInformation: string[]; disclaimer: string;
}
export interface ActionPlanStep { step: number; title: string; description?: string; reason: string; serviceType: ServiceType | null; kind: 'service' | 'review' }
export interface FarmInsight {
  id: string; farmId: string; opportunityScore: number; healthStatus: HealthStatus; statusLabel: string; summary: string;
  insights: InsightItem[]; recommendations: Recommendation[]; scoreBreakdown: ScoreBreakdown | null;
  generatedAt: string; disclaimer: string; actionPlan?: ActionPlanStep[];
}
export interface Farm {
  id: string; farmerId: string; farmName: string; location: string; latitude: number; longitude: number; sizeAcres: number;
  primaryCrop: Crop; coffeeVariety: string[]; coffeeTrees: number | null; estimatedAnnualProductionKg: number | null;
  lastHarvestDate: string | null; lastSoilTestDate: string | null; challenges: Challenge[]; createdAt: string; publicId?: string;
  farmer?: Farmer; insight?: FarmInsight | null;
}
export interface ServiceRequest {
  id: string; requestId: string; farmerId: string; farmId: string; type: ServiceType; status: RequestStatus;
  description: string | null; createdAt: string;
  assignedAgronomistId?: string | null; assignedAt?: string | null;
  agronomist?: { id: string; fullName: string; county: string | null } | null;
  /** Only present on the detail endpoints. */
  assessment?: Assessment | null; events?: RequestEvent[];
  farmer?: { id: string; farmerId: string; fullName: string; county: string; mobileNumber: string };
  farm?: { id: string; farmName: string; location: string; latitude: number; longitude: number; primaryCrop: Crop; sizeAcres: number };
}
export interface FarmerDetail extends Farmer {
  farms: (Farm & { insight: FarmInsight | null })[];
  serviceRequests: (ServiceRequest & { farm: { farmName: string } })[];
}
export interface FarmerRow extends Farmer {
  farm: { id: string; farmName: string; primaryCrop: Crop; sizeAcres: number } | null;
  opportunityScore: number | null; healthStatus: HealthStatus | null; requestCount: number;
}
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number }
export interface DashboardSummary {
  farmersOnboarded: number; farms: number; totalAcres: number; estimatedAnnualCoffeeProductionKg: number;
  serviceRequests: number; outstandingRequests: number; averageOpportunityScore: number | null;
  requestsByStatus: Partial<Record<RequestStatus, number>>;
}
export interface LocationSummary {
  counties: { county: string; farmers: number; acres: number }[];
  markers: { farmId: string; farmerId: string; farmName: string; farmerName: string; county: string; latitude: number; longitude: number; primaryCrop: Crop; sizeAcres: number }[];
}
export interface AiAnswer { answer: string; disclaimer: string; generatedAt: string }

export type RequestEventType = 'REQUEST_CREATED' | 'REQUEST_REVIEWED' | 'AGRONOMIST_ASSIGNED' | 'ASSESSMENT_SUBMITTED' | 'REQUEST_COMPLETED' | 'REQUEST_CANCELLED';
export interface RequestEvent { id: string; type: RequestEventType; fromStatus: RequestStatus | null; toStatus: RequestStatus | null; actorRole: string; actorName: string | null; message: string; createdAt: string }
export interface Assessment {
  id: string; summary: string; observations: string | null; recommendedActions: string | null;
  followUpRequired: boolean; followUpDate: string | null; createdAt: string; agronomist?: { id: string; fullName: string };
}
export interface Agronomist {
  id: string; fullName: string; email: string; phone: string | null; county: string | null; specialties: ServiceType[];
  status: 'ACTIVE' | 'INACTIVE'; openRequests?: number; completedRequests?: number;
}
export interface AgronomistDashboard {
  agronomist: Agronomist;
  kpis: { assignedRequests: number; pendingVisits: number; completedVisits: number; followUpsDue: number };
  followUps: (Assessment & { serviceRequest: { id: string; requestId: string; type: ServiceType; farm: { farmName: string }; farmer: { fullName: string } } })[];
  followUpWindowDays: number;
}
export type AgronomistRequest = ServiceRequest & { insight: FarmInsight | null };

export interface ChangeExplanation { direction: 'up' | 'down' | 'same' | 'first'; scoreDelta: number; statusChanged: boolean; summary: string; reasons: string[] }
export interface InsightSnapshot { id: string; createdAt: string; opportunityScore: number; healthStatus: HealthStatus; statusLabel: string; recommendationCount: number; change: ChangeExplanation }
export interface InsightHistory { farmId: string; snapshots: InsightSnapshot[]; latestChange: ChangeExplanation | null; note: string; disclaimer: string }

export interface Passport {
  publicId: string; farmName: string; county: string; country: string; primaryCrop: Crop; coffeeVarieties: string[];
  sizeAcres: number; registeredSince: string; completedVisits: number; notice: string;
}

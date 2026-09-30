import { Bug, Coffee, Coins, Droplets, FlaskConical, Handshake, Leaf, Mountain, Sprout, Stethoscope, Wallet, Wheat, CircleEllipsis, ClipboardCheck, Recycle, type LucideIcon } from 'lucide-react';
import type { Challenge, Crop, RequestStatus, ServiceType } from '@/types';

export const CROPS: { value: Crop; label: string; icon: LucideIcon }[] = [
  { value: 'COFFEE', label: 'Coffee', icon: Coffee }, { value: 'MAIZE', label: 'Maize', icon: Wheat },
  { value: 'BEANS', label: 'Beans', icon: Sprout }, { value: 'TEA', label: 'Tea', icon: Leaf }, { value: 'OTHER', label: 'Other', icon: CircleEllipsis },
];
export const cropLabel = (c: Crop) => CROPS.find((x) => x.value === c)?.label ?? c;

export const CHALLENGES: { value: Challenge; label: string; icon: LucideIcon }[] = [
  { value: 'LOW_YIELD', label: 'Low yield', icon: Sprout }, { value: 'PESTS_DISEASE', label: 'Pests / disease', icon: Bug },
  { value: 'SOIL_QUALITY', label: 'Soil quality', icon: Mountain }, { value: 'WATER_AVAILABILITY', label: 'Water availability', icon: Droplets },
  { value: 'BUYER_ACCESS', label: 'Access to buyers', icon: Handshake }, { value: 'FINANCE_ACCESS', label: 'Access to finance', icon: Wallet },
  { value: 'INPUT_COSTS', label: 'Input costs', icon: Coins },
];
export const challengeLabel = (c: Challenge) => CHALLENGES.find((x) => x.value === c)?.label ?? c;

export const SERVICES: Record<ServiceType, { label: string; requestLabel: string; blurb: string; icon: LucideIcon }> = {
  AGRONOMIST_VISIT: { label: 'Agronomist visit', requestLabel: 'Request Agronomist Visit', blurb: 'A qualified agronomist reviews your farm and helps you decide what to do next.', icon: Stethoscope },
  SOIL_TEST: { label: 'Soil test', requestLabel: 'Request Soil Test', blurb: 'A soil test may help identify nutrient or soil-condition limitations.', icon: FlaskConical },
  BIOCHAR_ASSESSMENT: { label: 'Biochar assessment', requestLabel: 'Request Biochar Assessment', blurb: 'An assessment of whether biochar could be worth considering for your soil.', icon: Recycle },
  COFFEE_QUALITY_ASSESSMENT: { label: 'Coffee quality assessment', requestLabel: 'Request Quality Assessment', blurb: 'A review of your coffee quality to understand how it may be viewed by buyers.', icon: ClipboardCheck },
  BUYER_OFFTAKE_SUPPORT: { label: 'Buyer / offtake support', requestLabel: 'Request Buyer Support', blurb: 'Help connecting with buyers for your harvest.', icon: Handshake },
};
export const ALL_SERVICES = Object.keys(SERVICES) as ServiceType[];

export const STATUS_LABEL: Record<RequestStatus, string> = { PENDING: 'Pending', IN_REVIEW: 'In review', ASSIGNED: 'Assigned', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };
export const STATUSES = Object.keys(STATUS_LABEL) as RequestStatus[];

export const COUNTIES = ['Nyeri', 'Kiambu', "Murang'a", 'Kirinyaga', 'Embu', 'Nakuru', 'Meru', 'Machakos', 'Kericho', 'Bungoma', 'Kisii', 'Nandi', 'Other'];
export const LANGUAGES = ['English', 'Kiswahili', 'Kikuyu', 'Luo', 'Kalenjin', 'Other'];
export const COFFEE_VARIETIES = ['SL28', 'SL34', 'Ruiru 11', 'Batian', 'K7', 'Other'];

/** Approximate centre of each county, used to place the map when the farmer picks a county. */
export const COUNTY_CENTERS: Record<string, [number, number]> = {
  Nyeri: [-0.4201, 36.9476], Kiambu: [-1.1714, 36.8356], "Murang'a": [-0.721, 37.1526], Kirinyaga: [-0.499, 37.28],
  Embu: [-0.5389, 37.4596], Nakuru: [-0.3031, 36.08], Meru: [0.048, 37.6559], Machakos: [-1.5177, 37.2634],
  Kericho: [-0.3689, 35.2863], Bungoma: [0.5635, 34.5606], Kisii: [-0.6817, 34.7667], Nandi: [0.1836, 35.1269],
};
export const KENYA_CENTER: [number, number] = [-0.4201, 36.9476];

export const PROTOTYPE_SCORE_NOTE =
  'This prototype score is a decision-support indicator generated from the information provided by the farmer. It is not a scientifically validated agronomic rating.';

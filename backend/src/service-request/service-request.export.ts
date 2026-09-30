import { CsvColumn, toCsv } from '../common/csv';

const TYPE: Record<string, string> = {
  AGRONOMIST_VISIT: 'Agronomist visit', SOIL_TEST: 'Soil test', BIOCHAR_ASSESSMENT: 'Biochar assessment',
  COFFEE_QUALITY_ASSESSMENT: 'Coffee quality assessment', BUYER_OFFTAKE_SUPPORT: 'Buyer / offtake support',
};
const STATUS: Record<string, string> = { PENDING: 'Pending', IN_REVIEW: 'In review', ASSIGNED: 'Assigned', COMPLETED: 'Completed', CANCELLED: 'Cancelled' };

export const REQUEST_COLUMNS: CsvColumn<any>[] = [
  { header: 'Request ID', value: (r) => r.requestId },
  { header: 'Farmer ID', value: (r) => r.farmer?.farmerId },
  { header: 'Farmer Name', value: (r) => r.farmer?.fullName },
  { header: 'Farm Name', value: (r) => r.farm?.farmName },
  { header: 'Request Type', value: (r) => TYPE[r.type] ?? r.type },
  { header: 'Status', value: (r) => STATUS[r.status] ?? r.status },
  { header: 'Description', value: (r) => r.description },
  { header: 'Created At', value: (r) => r.createdAt },
  { header: 'Updated At', value: (r) => r.updatedAt },
];

export const requestsToCsv = (requests: any[]) => toCsv(REQUEST_COLUMNS, requests);

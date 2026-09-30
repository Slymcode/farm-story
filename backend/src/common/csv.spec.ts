import { neutraliseFormula, toCsv } from './csv';
import { farmersToCsv, FARMER_COLUMNS } from '../farmer/farmer.export';
import { REQUEST_COLUMNS, requestsToCsv } from '../service-request/service-request.export';

describe('toCsv', () => {
  it('escapes commas, quotes and newlines and uses CRLF', () => {
    const csv = toCsv([{ header: 'A', value: (r: any) => r.a }, { header: 'B', value: (r: any) => r.b }], [{ a: 'x, y', b: 'say "hi"\nnow' }]);
    expect(csv).toBe('A,B\r\n"x, y","say ""hi""\nnow"\r\n');
  });
  it('renders null/undefined as empty and arrays as "; " joined', () => {
    const csv = toCsv([{ header: 'A', value: (r: any) => r.a }, { header: 'B', value: (r: any) => r.b }], [{ a: null, b: ['SL28', 'Ruiru 11'] }]);
    expect(csv).toBe('A,B\r\n,SL28; Ruiru 11\r\n');
  });
  it('neutralises spreadsheet formulas but keeps phone numbers and negatives intact', () => {
    expect(neutraliseFormula('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(neutraliseFormula('@cmd')).toBe("'@cmd");
    expect(neutraliseFormula('+254 712 345 678')).toBe('+254 712 345 678');
    expect(neutraliseFormula('-1.5')).toBe('-1.5');
    expect(neutraliseFormula('-cmd|x')).toBe("'-cmd|x");
  });
});

const farmer = {
  farmerId: 'FS-KEN-000001', fullName: 'John Mwangi', mobileNumber: '+254712345678', email: null, county: 'Nyeri', preferredLanguage: 'English',
  createdAt: new Date('2026-01-02T03:04:05.000Z'),
  farms: [{
    farmName: "John's Coffee Farm", sizeAcres: 2.5, primaryCrop: 'COFFEE', coffeeVariety: ['SL28', 'Ruiru 11'], coffeeTrees: 1100,
    estimatedAnnualProductionKg: 1800, lastHarvestDate: new Date('2025-12-15T00:00:00.000Z'), challenges: ['LOW_YIELD', 'PESTS_DISEASE'],
    insight: { opportunityScore: 45, healthStatus: 'MODERATE_OPPORTUNITY' },
  }],
};

describe('farmer CSV export', () => {
  it('has the required headers in order', () => {
    expect(FARMER_COLUMNS.map((c) => c.header)).toEqual([
      'Farmer ID', 'Full Name', 'Mobile', 'Email', 'County', 'Preferred Language', 'Farm Name', 'Farm Size (acres)', 'Primary Crop', 'Coffee Variety',
      'Coffee Trees', 'Estimated Annual Production (kg)', 'Last Harvest Date', 'Challenges', 'Opportunity Score', 'Insight Status', 'Created At',
    ]);
  });
  it('contains the farmer and farm data', () => {
    const [, row] = farmersToCsv([farmer]).trim().split('\r\n');
    expect(row).toBe("FS-KEN-000001,John Mwangi,+254712345678,,Nyeri,English,John's Coffee Farm,2.5,Coffee,SL28; Ruiru 11,1100,1800,2025-12-15,Low yield; Pests / disease,45,Moderate opportunity for improvement,2026-01-02T03:04:05.000Z");
  });
  it('still lists a farmer who has no farm yet, and outputs one row per farm', () => {
    expect(farmersToCsv([{ ...farmer, farms: [] }]).trim().split('\r\n')).toHaveLength(2);
    expect(farmersToCsv([{ ...farmer, farms: [farmer.farms[0], farmer.farms[0]] }]).trim().split('\r\n')).toHaveLength(3);
  });
});

describe('service request CSV export', () => {
  it('has the required headers and real values', () => {
    expect(REQUEST_COLUMNS.map((c) => c.header)).toEqual(['Request ID', 'Farmer ID', 'Farmer Name', 'Farm Name', 'Request Type', 'Status', 'Description', 'Created At', 'Updated At']);
    const csv = requestsToCsv([{
      requestId: 'FS-REQ-000001', type: 'SOIL_TEST', status: 'PENDING', description: 'Please come in the morning, after 8am',
      farmer: { farmerId: 'FS-KEN-000001', fullName: 'John Mwangi' }, farm: { farmName: "John's Coffee Farm" },
      createdAt: new Date('2026-02-01T00:00:00.000Z'), updatedAt: new Date('2026-02-02T00:00:00.000Z'),
    }]);
    expect(csv.trim().split('\r\n')[1]).toBe('FS-REQ-000001,FS-KEN-000001,John Mwangi,John\'s Coffee Farm,Soil test,Pending,"Please come in the morning, after 8am",2026-02-01T00:00:00.000Z,2026-02-02T00:00:00.000Z');
  });
});

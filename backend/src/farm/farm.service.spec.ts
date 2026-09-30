import { FarmService, buildFarmUpdateData } from './farm.service';
import { UpdateFarmDto } from './dto/farm.dto';

const dto = (o: object) => o as UpdateFarmDto;

describe('buildFarmUpdateData (PATCH semantics)', () => {
  it('preserves existing coffee fields when a coffee farm is updated without them', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ farmName: 'Updated Farm Name' }));
    expect(data.farmName).toBe('Updated Farm Name');
    expect(data).not.toHaveProperty('coffeeVariety', []);
    expect(data.coffeeVariety).toBeUndefined(); // undefined => Prisma leaves the column alone
    expect(data.coffeeTrees).toBeUndefined();
  });

  it('preserves coffee fields when primaryCrop is explicitly re-sent as COFFEE', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ primaryCrop: 'COFFEE' }));
    expect(data.coffeeVariety).toBeUndefined();
    expect(data.coffeeTrees).toBeUndefined();
  });

  it('applies explicitly provided coffee fields', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ coffeeVariety: ['Batian'], coffeeTrees: 900 }));
    expect(data.coffeeVariety).toEqual(['Batian']);
    expect(data.coffeeTrees).toBe(900);
  });

  it('clears coffee fields when coffee is explicitly changed to another crop', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ primaryCrop: 'MAIZE', coffeeTrees: 50 }));
    expect(data.coffeeVariety).toEqual([]);
    expect(data.coffeeTrees).toBeNull();
  });

  it('non-coffee -> coffee: accepts supplied coffee fields', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'MAIZE' }, dto({ primaryCrop: 'COFFEE', coffeeVariety: ['SL28'], coffeeTrees: 300 }));
    expect(data.primaryCrop).toBe('COFFEE');
    expect(data.coffeeVariety).toEqual(['SL28']);
    expect(data.coffeeTrees).toBe(300);
  });

  it('non-coffee -> coffee: does not invent values when none are supplied', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'MAIZE' }, dto({ primaryCrop: 'COFFEE' }));
    expect(data.coffeeVariety).toBeUndefined();
    expect(data.coffeeTrees).toBeUndefined();
  });

  it('non-coffee stays non-coffee: coffee fields are not written', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'MAIZE' }, dto({ farmName: 'X', coffeeVariety: ['SL28'], coffeeTrees: 5 }));
    expect(data).not.toHaveProperty('coffeeVariety');
    expect(data).not.toHaveProperty('coffeeTrees');
  });

  it('an unrelated partial update leaves every other field undefined (unchanged)', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ farmName: 'Only name' }));
    const { farmName, ...rest } = data;
    expect(farmName).toBe('Only name');
    expect(Object.values(rest).every((v) => v === undefined)).toBe(true);
  });

  it('dedupes challenges and converts dates only when provided', () => {
    const data = buildFarmUpdateData({ primaryCrop: 'COFFEE' }, dto({ challenges: ['LOW_YIELD', 'LOW_YIELD'], lastSoilTestDate: '2024-03-01' }));
    expect(data.challenges).toEqual(['LOW_YIELD']);
    expect(data.lastSoilTestDate).toEqual(new Date('2024-03-01'));
    expect(data.lastHarvestDate).toBeUndefined();
  });
});

describe('FarmService.update', () => {
  it('sends only the changed field to Prisma and refreshes the insight', async () => {
    const farm = { id: 'f1', primaryCrop: 'COFFEE', coffeeVariety: ['SL28', 'Ruiru 11'], coffeeTrees: 1100, insight: null };
    const prisma: any = { farm: { findUnique: jest.fn().mockResolvedValue(farm), update: jest.fn().mockResolvedValue(farm) } };
    const insights: any = { generateForFarm: jest.fn().mockResolvedValue(undefined) };
    await new FarmService(prisma, insights).update('f1', dto({ farmName: 'Updated Farm Name' }));
    const { data } = prisma.farm.update.mock.calls[0][0];
    expect(data.farmName).toBe('Updated Farm Name');
    expect(data.coffeeVariety).toBeUndefined();
    expect(data.coffeeTrees).toBeUndefined();
    expect(insights.generateForFarm).toHaveBeenCalledWith('f1');
  });
});

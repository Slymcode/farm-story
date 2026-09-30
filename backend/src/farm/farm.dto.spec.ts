import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFarmDto } from './dto/farm.dto';

const base = {
  farmerId: 'abc', farmName: "John's Coffee Farm", location: 'Nyeri County, Kenya', latitude: -0.42, longitude: 36.95,
  sizeAcres: 2.5, primaryCrop: 'COFFEE', challenges: ['LOW_YIELD'],
};
const fields = async (o: object) => (await validate(plainToInstance(CreateFarmDto, o))).map((e) => e.property);

describe('CreateFarmDto', () => {
  it('accepts a valid coffee farm (blank optional fields from the form are fine)', async () => {
    expect(await fields({ ...base, coffeeVariety: ['SL28'], coffeeTrees: '1100', estimatedAnnualProductionKg: '1800', lastHarvestDate: '', lastSoilTestDate: '' })).toEqual([]);
  });
  it('requires farm name, crop and location', async () => {
    expect(await fields({ ...base, farmName: '', primaryCrop: undefined })).toEqual(expect.arrayContaining(['farmName', 'primaryCrop']));
  });
  it('rejects farm size of zero or negative', async () => {
    expect(await fields({ ...base, sizeAcres: 0 })).toEqual(['sizeAcres']);
    expect(await fields({ ...base, sizeAcres: -3 })).toEqual(['sizeAcres']);
  });
  it('rejects out-of-range coordinates', async () => {
    expect(await fields({ ...base, latitude: 91 })).toEqual(['latitude']);
    expect(await fields({ ...base, longitude: -181 })).toEqual(['longitude']);
  });
  it('rejects negative trees and production', async () => {
    expect(await fields({ ...base, coffeeTrees: -1 })).toEqual(['coffeeTrees']);
    expect(await fields({ ...base, estimatedAnnualProductionKg: -5 })).toEqual(['estimatedAnnualProductionKg']);
  });
  it('rejects an unknown challenge', async () => {
    expect(await fields({ ...base, challenges: ['DRAGONS'] })).toEqual(['challenges']);
  });
});

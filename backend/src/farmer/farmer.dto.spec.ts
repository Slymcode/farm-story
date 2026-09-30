import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFarmerDto } from './dto/create-farmer.dto';

const check = async (o: object) => {
  const dto = plainToInstance(CreateFarmerDto, o);
  const errors = await validate(dto);
  return { dto, fields: errors.map((e) => e.property), errors };
};
const valid = { fullName: 'John Mwangi', mobileNumber: '0712 345 678', county: 'Nyeri', preferredLanguage: 'English' };

describe('CreateFarmerDto', () => {
  it('accepts a valid registration and normalises the phone number', async () => {
    const { fields, dto } = await check(valid);
    expect(fields).toEqual([]);
    expect(dto.mobileNumber).toBe('0712345678');
  });
  it('accepts an international number and an empty email', async () => {
    expect((await check({ ...valid, mobileNumber: '+254712345678', email: '' })).fields).toEqual([]);
  });
  it('requires name, mobile, county and language', async () => {
    expect((await check({})).fields).toEqual(expect.arrayContaining(['fullName', 'mobileNumber', 'county', 'preferredLanguage']));
  });
  it('rejects an invalid mobile number with a friendly message', async () => {
    const { errors } = await check({ ...valid, mobileNumber: 'abc' });
    expect(Object.values(errors[0].constraints!)[0]).toMatch(/valid mobile number/);
  });
  it('rejects an invalid email but allows omitting it', async () => {
    expect((await check({ ...valid, email: 'not-an-email' })).fields).toEqual(['email']);
    expect((await check(valid)).fields).toEqual([]);
  });
  it('rejects an unknown language', async () => {
    expect((await check({ ...valid, preferredLanguage: 'Klingon' })).fields).toEqual(['preferredLanguage']);
  });
});

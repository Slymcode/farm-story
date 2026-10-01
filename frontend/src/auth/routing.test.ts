import test from 'node:test';
import assert from 'node:assert/strict';
import { DASHBOARD_PATH, ONBOARDING_PATH, gateRedirect, homePathFor, postLoginPath } from './routing.ts';

const incomplete = { onboardingCompleted: false };
const done = { onboardingCompleted: true };

test('login sends a farmer with unfinished onboarding to Continue Onboarding', () => {
  assert.equal(postLoginPath(incomplete), ONBOARDING_PATH);
  assert.equal(postLoginPath(incomplete, '/farmer/dashboard'), ONBOARDING_PATH);
});

test('login sends a farmer who finished onboarding to the dashboard', () => {
  assert.equal(postLoginPath(done), DASHBOARD_PATH);
});

test('login returns to the page the farmer asked for, only when it is a farmer page', () => {
  assert.equal(postLoginPath(done, '/farmer/intelligence'), '/farmer/intelligence');
  assert.equal(postLoginPath(done, '/admin'), DASHBOARD_PATH);
  assert.equal(postLoginPath(done, 'https://evil.example'), DASHBOARD_PATH);
  assert.equal(postLoginPath(done, '/farmer'), DASHBOARD_PATH);
});

test('route gates: logged-out farmers go to login', () => {
  for (const g of ['any', 'onboarded', 'incomplete'] as const) assert.equal(gateRedirect(null, g), 'login');
});

test('route gates: unfinished farmers are held in onboarding; finished farmers skip it', () => {
  assert.equal(gateRedirect(incomplete, 'onboarded'), ONBOARDING_PATH);
  assert.equal(gateRedirect(incomplete, 'incomplete'), null);
  assert.equal(gateRedirect(done, 'onboarded'), null);
  assert.equal(gateRedirect(done, 'incomplete'), DASHBOARD_PATH);
  assert.equal(homePathFor(done), DASHBOARD_PATH);
});

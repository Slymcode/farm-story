import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { farmSchema } from "./onboarding.ts";

const dateValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const yesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return dateValue(date);
};

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return dateValue(date);
};

describe("farm date fields", () => {
  for (const field of ["lastHarvestDate", "lastSoilTestDate"] as const) {
    it(`${field} allows blank and past dates`, () => {
      assert.equal(farmSchema.shape[field].safeParse("").success, true);
      assert.equal(
        farmSchema.shape[field].safeParse(yesterday()).success,
        true,
      );
    });

    it(`${field} rejects today, future dates, and invalid calendar dates`, () => {
      assert.equal(
        farmSchema.shape[field].safeParse(dateValue(new Date())).success,
        false,
      );
      assert.equal(
        farmSchema.shape[field].safeParse(tomorrow()).success,
        false,
      );
      assert.equal(
        farmSchema.shape[field].safeParse("2026-02-30").success,
        false,
      );
    });
  }
});

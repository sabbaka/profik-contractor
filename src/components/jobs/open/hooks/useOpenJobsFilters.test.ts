import {
  buildOpenJobsParams,
  countActiveFilterGroups,
  EMPTY_OPEN_JOBS_FILTERS,
  resolveRadiusKm,
} from "./useOpenJobsFilters";

describe("buildOpenJobsParams", () => {
  it("returns an empty object for an untouched draft", () => {
    expect(buildOpenJobsParams(EMPTY_OPEN_JOBS_FILTERS, null)).toEqual({});
  });

  it("parses the price fields as positive integers, dropping blanks", () => {
    const params = buildOpenJobsParams(
      { ...EMPTY_OPEN_JOBS_FILTERS, priceMin: "500", priceMax: "" },
      null,
    );
    expect(params).toEqual({ priceMin: 500 });
  });

  it("ignores a non-numeric or zero price", () => {
    const params = buildOpenJobsParams(
      { ...EMPTY_OPEN_JOBS_FILTERS, priceMin: "abc", priceMax: "0" },
      null,
    );
    expect(params).toEqual({});
  });

  it("formats the date range as local YYYY-MM-DD", () => {
    const params = buildOpenJobsParams(
      {
        ...EMPTY_OPEN_JOBS_FILTERS,
        dateFrom: new Date(2026, 2, 3),
        dateTo: new Date(2026, 2, 10),
      },
      null,
    );
    expect(params).toEqual({ dateFrom: "2026-03-03", dateTo: "2026-03-10" });
  });

  it("drops a radius picked before location was ever granted", () => {
    const params = buildOpenJobsParams(
      { ...EMPTY_OPEN_JOBS_FILTERS, radiusKm: 10 },
      null,
    );
    expect(params).toEqual({});
  });

  it("sends lat/lng/radiusKm together once coords exist", () => {
    const params = buildOpenJobsParams(
      { ...EMPTY_OPEN_JOBS_FILTERS, radiusKm: 10 },
      { lat: 50.0755, lng: 14.4378 },
    );
    expect(params).toEqual({ lat: 50.0755, lng: 14.4378, radiusKm: 10 });
  });

  it("sends the unbounded radius once the slider is pinned to its max", () => {
    const params = buildOpenJobsParams(
      { ...EMPTY_OPEN_JOBS_FILTERS, radiusKm: 30 },
      { lat: 50.0755, lng: 14.4378 },
    );
    expect(params.radiusKm).toBe(100);
  });
});

describe("resolveRadiusKm", () => {
  it("passes through values under the slider's max", () => {
    expect(resolveRadiusKm(10)).toBe(10);
  });

  it('maps the max ("30+") to the server\'s real ceiling', () => {
    expect(resolveRadiusKm(30)).toBe(100);
  });
});

describe("countActiveFilterGroups", () => {
  it("counts zero for no filters", () => {
    expect(countActiveFilterGroups({})).toBe(0);
  });

  it("counts price as one group regardless of one or both bounds", () => {
    expect(countActiveFilterGroups({ priceMin: 500 })).toBe(1);
    expect(countActiveFilterGroups({ priceMin: 500, priceMax: 1000 })).toBe(1);
  });

  it("counts price, date and location as up to three groups", () => {
    expect(
      countActiveFilterGroups({
        priceMin: 500,
        dateFrom: "2026-03-03",
        lat: 50.0755,
        lng: 14.4378,
        radiusKm: 15,
      }),
    ).toBe(3);
  });
});

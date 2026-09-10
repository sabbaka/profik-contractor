import { forwardIdCursor } from "./pagination";

type Item = { id: string };

const page = (n: number, offset = 0): Item[] =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${offset + i}` }));

describe("forwardIdCursor", () => {
  const { initialPageParam, getNextPageParam } = forwardIdCursor<Item>(
    20,
    (item) => item.id,
  );

  it("starts with no cursor, so the first request sends none", () => {
    expect(initialPageParam).toBeNull();
  });

  it("hands back the last id of a full page", () => {
    expect(getNextPageParam(page(20))).toBe("id-19");
  });

  // "There is another page" is inferred from a full page, which is the whole
  // reason the same pageSize has to reach both the limit param and this helper.
  it("stops on a page shorter than the page size", () => {
    expect(getNextPageParam(page(19))).toBeUndefined();
    expect(getNextPageParam(page(1))).toBeUndefined();
  });

  it("stops on an empty page", () => {
    expect(getNextPageParam([])).toBeUndefined();
  });

  it("reads the id through the accessor it was given", () => {
    const nested = forwardIdCursor<{ job: Item }>(2, (item) => item.job.id);
    expect(
      nested.getNextPageParam([{ job: { id: "a" } }, { job: { id: "b" } }]),
    ).toBe("b");
  });
});

import { act, renderHook } from "@testing-library/react-native";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps the initial value until the delay elapses", async () => {
    const { result, rerender } = await renderHook<number, { value: number }>(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: 1 },
      },
    );
    expect(result.current).toBe(1);

    await rerender({ value: 2 });
    expect(result.current).toBe(1);

    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(2);
  });

  it("resets the timer on every change, so only the last value lands", async () => {
    const { result, rerender } = await renderHook<number, { value: number }>(
      ({ value }) => useDebouncedValue(value, 300),
      {
        initialProps: { value: 1 },
      },
    );

    await rerender({ value: 2 });
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    await rerender({ value: 3 });
    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe(1); // 300ms since value=2 never elapsed uninterrupted

    await act(async () => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe(3);
  });
});

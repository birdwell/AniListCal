import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { format } from "date-fns";
import {
  useDaySelection,
  useNextWeekDates,
  useAnimeCalendarData,
  useCalendar,
} from "../hooks/useCalendar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Create mock functions
const mockUseQuery = vi.fn();
const mockGetUser = vi.fn();
const mockFetchUserAnime = vi.fn();
const mockIsWeeklyShow = vi.fn();
const mockFormatDate = vi.fn();

// Mock the dependencies
vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query");
  return {
    ...actual,
    useQuery: (...args: any[]) => mockUseQuery(...args),
  };
});

vi.mock("../lib/auth", () => ({
  getUser: (...args: any[]) => mockGetUser(...args),
}));

vi.mock("../lib/anilist", () => ({
  fetchUserAnime: (...args: any[]) => mockFetchUserAnime(...args),
}));

vi.mock("../lib/calendar-utils", () => ({
  isWeeklyShow: (...args: any[]) => mockIsWeeklyShow(...args),
  formatDate: (...args: any[]) => mockFormatDate(...args),
}));

// Create a wrapper with QueryClientProvider for the tests
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDaySelection", () => {
  beforeEach(() => {
    // Mock the current date to be consistent in tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 1, 28)); // February 28, 2025 (Friday)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with day index 0", () => {
    const { result } = renderHook(() => useDaySelection(), {
      wrapper: createWrapper(),
    });
    expect(result.current.selectedDay).toBe(0);
  });

  it("should set the selected day when setSelectedDay is called", () => {
    const { result } = renderHook(() => useDaySelection(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setSelectedDay(2);
    });

    expect(result.current.selectedDay).toBe(2);
  });

  it("should order days starting with the current day of week", () => {
    // February 28, 2025 is a Friday (day 5)
    const { result } = renderHook(() => useDaySelection(), {
      wrapper: createWrapper(),
    });

    // Days should be ordered starting with Friday
    expect(result.current.orderedDays).toEqual([
      "Friday",
      "Saturday",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
    ]);
  });
});

describe("useNextWeekDates", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 1, 28)); // February 28, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return an array of the next 7 days in yyyy-MM-dd format", () => {
    const { result } = renderHook(() => useNextWeekDates(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toEqual([
      "2025-02-28", // Today (Feb 28)
      "2025-03-01", // Mar 1
      "2025-03-02", // Mar 2
      "2025-03-03", // Mar 3
      "2025-03-04", // Mar 4
      "2025-03-05", // Mar 5
      "2025-03-06", // Mar 6
    ]);
  });

  it("should memoize the result", () => {
    const { result, rerender } = renderHook(() => useNextWeekDates(), {
      wrapper: createWrapper(),
    });
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult); // Same reference
  });
});

describe("useAnimeCalendarData", () => {
  const mockUser = { id: "user123" };
  const mockAnimeEntries = [
    {
      id: "1",
      status: "CURRENT",
      media: {
        id: "anime1",
        title: { userPreferred: "Show 1" },
        nextAiringEpisode: {
          airingAt: 1740852000, // Feb 29, 2025
          episode: 5,
        },
      },
    },
    {
      id: "2",
      status: "CURRENT",
      media: {
        id: "anime2",
        title: { userPreferred: "Show 2" },
        nextAiringEpisode: {
          airingAt: 1740938400, // Mar 1, 2025
          episode: 8,
        },
      },
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 1, 28)); // February 28, 2025

    // Reset all mocks
    vi.resetAllMocks();

    // Mock the useQuery responses with default values
    mockUseQuery.mockImplementation((options: any) => {
      const queryKey = options.queryKey || [];

      if (queryKey[0] === "/api/users/current") {
        return { data: mockUser, isLoading: false };
      }
      if (queryKey[0] === "/anilist/anime") {
        return { data: mockAnimeEntries, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    // Mock isWeeklyShow to return true for the first show
    mockIsWeeklyShow.mockImplementation((timestamp) => {
      return timestamp === 1740852000; // Only the first show is weekly
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should fetch user and anime data", () => {
    const { result } = renderHook(() => useAnimeCalendarData(), {
      wrapper: createWrapper(),
    });

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["/api/users/current"] })
    );

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["/anilist/anime", "user123"] })
    );

    expect(result.current.isLoading).toBe(false);
  });

  it("should group shows by airing date", () => {
    const { result } = renderHook(() => useAnimeCalendarData(), {
      wrapper: createWrapper(),
    });

    // Check that airingDateMap has entries for today (weekly show) and actual airing dates
    const today = format(new Date(2025, 1, 28), "yyyy-MM-dd"); // 2025-02-28
    const tomorrow = format(new Date(2025, 1, 29), "yyyy-MM-dd"); // 2025-02-29
    const dayAfter = format(new Date(2025, 2, 1), "yyyy-MM-dd"); // 2025-03-01

    expect(result.current.airingDateMap).toHaveProperty(today);
    expect(result.current.airingDateMap).toHaveProperty(tomorrow);
    expect(result.current.airingDateMap).toHaveProperty(dayAfter);

    // The first show should appear both on today (as weekly) and its actual date
    expect(result.current.airingDateMap[today][0].media!.id).toBe("anime1");
    expect(result.current.airingDateMap[tomorrow][0].media!.id).toBe("anime1");

    // The second show should only appear on its actual date
    expect(result.current.airingDateMap[dayAfter][0].media!.id).toBe("anime1");
    if (result.current.airingDateMap[dayAfter].length > 1) {
      expect(result.current.airingDateMap[dayAfter][1].media!.id).toBe("anime2");
    }
  });

  it("should handle loading states correctly", () => {
    // First call: both queries loading
    mockUseQuery.mockImplementationOnce(() => ({ data: undefined, isLoading: true }));
    mockUseQuery.mockImplementationOnce(() => ({ data: undefined, isLoading: true }));

    const { result, rerender } = renderHook(() => useAnimeCalendarData(), {
      wrapper: createWrapper(),
    });
    expect(result.current.isLoading).toBe(true);

    // Reset mocks for the next test
    mockUseQuery.mockReset();
    mockUseQuery.mockImplementation((options: any) => {
      const queryKey = options.queryKey || [];
      if (queryKey[0] === "/api/users/current") {
        return { data: mockUser, isLoading: false };
      }
      if (queryKey[0] === "/anilist/anime") {
        return { data: mockAnimeEntries, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    rerender();
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useCalendar", () => {
  const mockUser = { id: "user123" };
  const mockAnimeEntries = [
    {
      id: "1",
      status: "CURRENT",
      media: {
        id: "anime1",
        title: { userPreferred: "Show 1" },
        nextAiringEpisode: {
          airingAt: 1740852000, // Feb 29, 2025
          episode: 5,
        },
      },
    },
    {
      id: "2",
      status: "CURRENT",
      media: {
        id: "anime2",
        title: { userPreferred: "Show 2" },
        nextAiringEpisode: {
          airingAt: 1740938400, // Mar 1, 2025
          episode: 8,
        },
      },
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 1, 28)); // February 28, 2025

    // Reset all mocks
    vi.resetAllMocks();

    // Mock the useQuery responses
    mockUseQuery.mockImplementation((options: any) => {
      const queryKey = options.queryKey || [];

      if (queryKey[0] === "/api/users/current") {
        return { data: mockUser, isLoading: false };
      }
      if (queryKey[0] === "/anilist/anime") {
        return { data: mockAnimeEntries, isLoading: false };
      }
      return { data: undefined, isLoading: false };
    });

    // Mock isWeeklyShow to return true for the first show
    mockIsWeeklyShow.mockImplementation((timestamp) => {
      return timestamp === 1740852000; // Only the first show is weekly
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("should combine all calendar functionality", () => {
    const { result } = renderHook(() => useCalendar(), {
      wrapper: createWrapper(),
    });

    // Check that all properties are present
    expect(result.current).toHaveProperty("selectedDay");
    expect(result.current).toHaveProperty("setSelectedDay");
    expect(result.current).toHaveProperty("orderedDays");
    expect(result.current).toHaveProperty("selectedDate");
    expect(result.current).toHaveProperty("showsForSelectedDate");
    expect(result.current).toHaveProperty("isLoading");

    // Check initial values
    expect(result.current.selectedDay).toBe(0);
    expect(result.current.selectedDate).toBe("2025-02-28");
    expect(result.current.isLoading).toBe(false);

    // Check that orderedDays starts with Friday (day 5)
    expect(result.current.orderedDays[0]).toBe("Friday");
  });

  it("should filter shows for the selected date", () => {
    const { result } = renderHook(() => useCalendar(), {
      wrapper: createWrapper(),
    });

    // Initially, it should show today's shows (which includes the weekly show)
    expect(result.current.showsForSelectedDate.length).toBe(1);
    expect(result.current.showsForSelectedDate[0][0]).toBe("2025-02-28");
    expect(result.current.showsForSelectedDate[0][1][0].media!.id).toBe(
      "anime1"
    );

    // Find the index for '2025-03-01' in nextWeekDates
    const nextWeekDates = [
      "2025-02-28",
      "2025-03-01",
      "2025-03-02",
      "2025-03-03",
      "2025-03-04",
      "2025-03-05",
      "2025-03-06",
    ];
    const march1Index = nextWeekDates.indexOf("2025-03-01");
    act(() => {
      result.current.setSelectedDay(march1Index);
    });

    expect(result.current.selectedDate).toBe("2025-03-01");
    expect(result.current.showsForSelectedDate.length).toBe(1);
    expect(result.current.showsForSelectedDate[0][0]).toBe("2025-03-01");
    expect(result.current.showsForSelectedDate[0][1][0].media!.id).toBe(
      "anime1"
    );
  });
});

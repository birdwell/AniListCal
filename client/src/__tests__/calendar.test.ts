import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { format } from 'date-fns';
// Use a type-only import for MediaListStatus to avoid the import error
import { groupShowsByAiringDate } from '../hooks/useCalendar';
import { getDayName } from '../lib/calendar-utils';

describe('groupShowsByAiringDate', () => {
  // Mock data for testing
  const mockEntries = [
    {
      id: '1',
      status: 'CURRENT',
      media: {
        title: { userPreferred: 'Show 1' },
        nextAiringEpisode: {
          airingAt: 1709175600, // Feb 28, 2024 (timestamp in seconds)
          episode: 5
        }
      }
    },
    {
      id: '2',
      status: 'CURRENT',
      media: {
        title: { userPreferred: 'Show 2' },
        nextAiringEpisode: {
          airingAt: 1709262000, // Mar 1, 2024 (timestamp in seconds)
          episode: 8
        }
      }
    },
    {
      id: '3',
      status: 'COMPLETED',
      media: {
        title: { userPreferred: 'Show 3' },
        nextAiringEpisode: {
          airingAt: 1709175600, // Feb 28, 2024 (timestamp in seconds)
          episode: 12
        }
      }
    },
    {
      id: '4',
      status: 'CURRENT',
      media: {
        title: { userPreferred: 'Show 4' },
        nextAiringEpisode: null // Should be filtered out
      }
    }
  ];

  // We'll skip mocking Date in this test since we're testing the actual date-fns functionality
  // Instead, we'll use fixed timestamps and verify the results directly

  it('should return an empty object when animeEntries is undefined', () => {
    const result = groupShowsByAiringDate(undefined);
    expect(result).toEqual({});
  });

  it('should filter out entries that do not have nextAiringEpisode or are not CURRENT', () => {
    const result = groupShowsByAiringDate(mockEntries);

    // Should only include entries with status CURRENT and nextAiringEpisode
    const totalEntries = Object.values(result).flat().length;
    expect(totalEntries).toBe(2); // Only 2 entries should pass the filter
  });

  it('should group entries by their airing date in local time', () => {
    const result = groupShowsByAiringDate(mockEntries);

    // Get the expected date keys in local time
    const date1 = new Date(mockEntries[0].media.nextAiringEpisode!.airingAt! * 1000);
    const date2 = new Date(mockEntries[1].media.nextAiringEpisode!.airingAt! * 1000);

    const expectedDate1 = format(date1, 'yyyy-MM-dd');
    const expectedDate2 = format(date2, 'yyyy-MM-dd');

    // Check that the entries are grouped by the correct dates
    expect(Object.keys(result)).toContain(expectedDate1);
    expect(Object.keys(result)).toContain(expectedDate2);

    // Check that the entries are in the correct groups
    expect(result[expectedDate1][0].id).toBe('1');
    expect(result[expectedDate2][0].id).toBe('2');
  });

  it('should handle timezone differences correctly', () => {
    // Create a show that airs close to midnight
    const midnightShow = {
      id: '5',
      status: 'CURRENT',
      media: {
        title: { userPreferred: 'Midnight Show' },
        nextAiringEpisode: {
          airingAt: 1709179199, // Feb 28, 2024 at 23:59:59 UTC
          episode: 10
        }
      }
    };

    // Get the expected date in local time
    const date = new Date(midnightShow.media.nextAiringEpisode.airingAt * 1000);
    const expectedDate = format(date, 'yyyy-MM-dd');

    const result = groupShowsByAiringDate([midnightShow]);

    // The show should be grouped by the local date, not UTC date
    expect(Object.keys(result)).toContain(expectedDate);
    expect(result[expectedDate][0].id).toBe('5');
  });
});

describe('getDayName', () => {
  it('should return correct day name for various dates', () => {
    // Test known dates
    expect(getDayName('2025-01-01')).toBe('Wednesday'); // January 1, 2025 is a Wednesday
    expect(getDayName('2025-02-28')).toBe('Friday');    // February 28, 2025 is a Friday
    expect(getDayName('2025-03-01')).toBe('Saturday');  // March 1, 2025 is a Saturday
    expect(getDayName('2025-12-25')).toBe('Thursday');  // December 25, 2025 is a Thursday
  });

  it('should handle different years correctly', () => {
    expect(getDayName('2024-02-29')).toBe('Thursday'); // Leap year date
    expect(getDayName('2023-01-01')).toBe('Sunday');   // January 1, 2023 is a Sunday
  });

  it('should handle edge cases', () => {
    expect(getDayName('2000-01-01')).toBe('Saturday'); // Y2K date
    expect(getDayName('1970-01-01')).toBe('Thursday'); // Unix epoch start date
  });
});

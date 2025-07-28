import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShowsList } from '../ShowsList';
import '@testing-library/jest-dom';

describe('ShowsList', () => {
  const mockProps = {
    showsForSelectedDate: [],
    selectedDay: 0,
    selectedDate: '2025-02-28', // Friday
  };

  it('should display correct day name in empty state based on selectedDate', () => {
    render(<ShowsList {...mockProps} />);
    
    // Should show "Friday" because selectedDate is 2025-02-28 (Friday)
    // regardless of what selectedDay index is
    expect(screen.getByText('No shows airing on Friday')).toBeInTheDocument();
  });

  it('should display correct day name for different dates', () => {
    // Test with Monday
    const mondayProps = {
      ...mockProps,
      selectedDate: '2025-03-03', // Monday
    };
    
    const { rerender } = render(<ShowsList {...mondayProps} />);
    expect(screen.getByText('No shows airing on Monday')).toBeInTheDocument();
    
    // Test with Sunday
    const sundayProps = {
      ...mockProps,
      selectedDate: '2025-03-02', // Sunday
    };
    
    rerender(<ShowsList {...sundayProps} />);
    expect(screen.getByText('No shows airing on Sunday')).toBeInTheDocument();
  });
});
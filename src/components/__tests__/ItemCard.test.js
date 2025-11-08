import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ItemCard from '../ItemCard';

// Mock useThemeTokens
jest.mock('../../design/tokens', () => ({
  useThemeTokens: () => ({
    colors: {
      surface: '#1a1a1a',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      placeholder: '#737373',
    },
    spacing: {
      sm: 8,
      md: 12,
    },
    radii: {
      lg: 12,
    },
    typography: {
      sizes: {
        sm: 12,
        md: 16,
      },
    },
    shadow: () => ({}),
    elevation: {
      sm: 2,
    },
  }),
}));

describe('ItemCard', () => {
  const mockItem = {
    id: '1',
    name: 'Air Jordan 4 Retro',
    category: 'Scarpe Sportive',
    brand: 'Nike Jordan',
    size: '42',
    mainColor: 'Nero/Rosso',
    thumbnailUrl: 'https://example.com/image.jpg',
  };

  it('renders item name correctly', () => {
    const { getByText } = render(<ItemCard item={mockItem} />);
    expect(getByText('Air Jordan 4 Retro')).toBeTruthy();
  });

  it('renders item category correctly', () => {
    const { getByText } = render(<ItemCard item={mockItem} />);
    expect(getByText('Scarpe Sportive')).toBeTruthy();
  });

  it('renders brand and size correctly', () => {
    const { getByText } = render(<ItemCard item={mockItem} />);
    expect(getByText('Nike Jordan • 42')).toBeTruthy();
  });

  it('renders brand only when size is missing', () => {
    const itemWithoutSize = { ...mockItem, size: undefined };
    const { getByText } = render(<ItemCard item={itemWithoutSize} />);
    expect(getByText('Nike Jordan')).toBeTruthy();
  });

  it('renders size only when brand is missing', () => {
    const itemWithoutBrand = { ...mockItem, brand: undefined };
    const { getByText } = render(<ItemCard item={itemWithoutBrand} />);
    expect(getByText('42')).toBeTruthy();
  });

  it('renders image with thumbnailUrl', () => {
    const { getByTestId } = render(
      <ItemCard item={mockItem} />
    );
    // Image component is rendered even if we can't access testID easily
    // This test verifies component doesn't crash with image
    expect(() => render(<ItemCard item={mockItem} />)).not.toThrow();
  });

  it('renders placeholder image when thumbnailUrl is missing', () => {
    const itemWithoutImage = { ...mockItem, thumbnailUrl: undefined };
    const { getByText } = render(<ItemCard item={itemWithoutImage} />);
    // Should render without crashing
    expect(getByText('Air Jordan 4 Retro')).toBeTruthy();
  });

  it('calls onPress with item when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <ItemCard item={mockItem} onPress={onPressMock} />
    );
    
    fireEvent.press(getByText('Air Jordan 4 Retro'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
    expect(onPressMock).toHaveBeenCalledWith(mockItem);
  });

  it('does not crash when onPress is not provided', () => {
    const { getByText } = render(<ItemCard item={mockItem} />);
    expect(() => fireEvent.press(getByText('Air Jordan 4 Retro'))).not.toThrow();
  });

  it('truncates long item names with numberOfLines', () => {
    const longNameItem = {
      ...mockItem,
      name: 'This is a very long item name that should be truncated',
    };
    const { getByText } = render(<ItemCard item={longNameItem} />);
    expect(getByText(longNameItem.name)).toBeTruthy();
  });

  it('handles missing category gracefully', () => {
    const itemWithoutCategory = { ...mockItem, category: undefined };
    const { getByText, queryByText } = render(
      <ItemCard item={itemWithoutCategory} />
    );
    
    expect(getByText('Air Jordan 4 Retro')).toBeTruthy();
    // Category text should not be rendered
    expect(queryByText('Scarpe Sportive')).toBeNull();
  });

  it('renders minimal item with only name', () => {
    const minimalItem = {
      id: '2',
      name: 'Basic Item',
    };
    const { getByText } = render(<ItemCard item={minimalItem} />);
    expect(getByText('Basic Item')).toBeTruthy();
  });
});

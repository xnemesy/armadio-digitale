import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import PressableScale from '../PressableScale';

describe('PressableScale', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <PressableScale onPress={jest.fn()}>
        <Text>Test Child</Text>
      </PressableScale>
    );
    
    expect(getByText('Test Child')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPressMock}>
        <Text>Press Me</Text>
      </PressableScale>
    );
    
    fireEvent.press(getByText('Press Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <PressableScale onPress={onPressMock} disabled={true}>
        <Text>Disabled</Text>
      </PressableScale>
    );
    
    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('applies custom style prop', () => {
    const customStyle = { backgroundColor: 'red', padding: 10 };
    const { getByText } = render(
      <PressableScale onPress={jest.fn()} style={customStyle}>
        <Text>Styled</Text>
      </PressableScale>
    );
    
    const pressable = getByText('Styled').parent;
    expect(pressable).toHaveStyle(customStyle);
  });

  it('renders with custom activeScale prop', () => {
    const { getByText } = render(
      <PressableScale onPress={jest.fn()} activeScale={0.9}>
        <Text>Custom Scale</Text>
      </PressableScale>
    );
    
    expect(getByText('Custom Scale')).toBeTruthy();
  });

  it('handles pressIn and pressOut events', () => {
    const { getByText } = render(
      <PressableScale onPress={jest.fn()}>
        <Text>Press Events</Text>
      </PressableScale>
    );
    
    const pressable = getByText('Press Events');
    
    fireEvent(pressable, 'pressIn');
    fireEvent(pressable, 'pressOut');
    
    // Component should not crash and handle events gracefully
    expect(getByText('Press Events')).toBeTruthy();
  });

  it('passes additional pressable props', () => {
    const testID = 'custom-pressable';
    const { getByTestId } = render(
      <PressableScale onPress={jest.fn()} testID={testID}>
        <Text>Props Test</Text>
      </PressableScale>
    );
    
    expect(getByTestId(testID)).toBeTruthy();
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <PressableScale onPress={jest.fn()}>
        <Text>Child 1</Text>
        <Text>Child 2</Text>
      </PressableScale>
    );
    
    expect(getByText('Child 1')).toBeTruthy();
    expect(getByText('Child 2')).toBeTruthy();
  });
});

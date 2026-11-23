import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { NumberStepper, stepValue } from './NumberStepper';

describe('stepValue', () => {
  it.each([
    ['10', 1, '11'],
    ['10', -1, '9'],
    ['', 1, '1'],
    ['abc', 1, '1'],
    ['0.29', 1, '1.29'],
    ['0', -1, '0'],
    ['0.5', -1, '0'],
  ])('%s %+d → %s (mínimo 0)', (value, delta, expected) => {
    expect(stepValue(value, delta)).toBe(expected);
  });

  it('no supera el máximo', () => {
    expect(stepValue('100000', 1, 0, 100_000)).toBe('100000');
  });
});

function Controlled({ initial, max }: { initial: string; max?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="storage">Almacenamiento</label>
      <NumberStepper
        id="storage"
        value={value}
        onValueChange={setValue}
        max={max}
        decreaseLabel="Reducir almacenamiento"
        increaseLabel="Aumentar almacenamiento"
      />
    </>
  );
}

const field = () => screen.getByRole('spinbutton', { name: 'Almacenamiento' });
const decrease = () => screen.getByRole('button', { name: 'Reducir almacenamiento' });
const increase = () => screen.getByRole('button', { name: 'Aumentar almacenamiento' });

describe('NumberStepper', () => {
  it('los botones suman y restan 1 conservando los decimales', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="0.29" />);

    await user.click(increase());
    expect(field()).toHaveValue(1.29);
    await user.click(decrease());
    expect(field()).toHaveValue(0.29);
  });

  it('deshabilita «−» en el mínimo y «+» en el máximo', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="1" max={2} />);

    await user.click(decrease());
    expect(field()).toHaveValue(0);
    expect(decrease()).toBeDisabled();

    await user.click(increase());
    await user.click(increase());
    expect(field()).toHaveValue(2);
    expect(increase()).toBeDisabled();
  });

  it('los botones no añaden paradas de tabulación y apuntan al campo', () => {
    render(<Controlled initial="5" />);

    for (const button of [decrease(), increase()]) {
      expect(button).toHaveAttribute('tabindex', '-1');
      expect(button).toHaveAttribute('aria-controls', 'storage');
    }
  });

  it('se puede seguir escribiendo en el campo', async () => {
    const user = userEvent.setup();
    render(<Controlled initial="" />);

    await user.type(field(), '42');
    expect(field()).toHaveValue(42);
  });
});

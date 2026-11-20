import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { UsersInput } from './UsersInput';

function Controlled({ initial = '10' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <UsersInput value={value} onChange={setValue} />;
}

const slider = () => screen.getByRole('slider', { name: 'Usuarios activos (deslizador)' });
const number = () => screen.getByRole('spinbutton', { name: 'Usuarios activos (número)' });

describe('UsersInput', () => {
  it('mover el deslizador actualiza el campo numérico', () => {
    render(<Controlled />);
    fireEvent.change(slider(), { target: { value: '51' } });
    expect(number()).toHaveValue(51);
  });

  it('escribir en el campo numérico mueve el deslizador', async () => {
    render(<Controlled />);
    await userEvent.setup().clear(number());
    await userEvent.setup().type(number(), '150');
    expect(slider()).toHaveValue('150');
  });

  it('por encima de 200 el deslizador se queda al máximo y el campo conserva el valor', async () => {
    render(<Controlled />);
    await userEvent.setup().clear(number());
    await userEvent.setup().type(number(), '5000');
    expect(number()).toHaveValue(5000);
    expect(slider()).toHaveValue('200');
  });

  it('el deslizador va de 0 a 200 y el campo admite hasta 100.000', () => {
    render(<Controlled />);
    expect(slider()).toHaveAttribute('min', '0');
    expect(slider()).toHaveAttribute('max', '200');
    expect(number()).toHaveAttribute('max', '100000');
    expect(number()).toHaveAccessibleDescription(/hasta 100\.000/);
  });

  it('muestra el error asociado al campo numérico', () => {
    render(<UsersInput value="abc" onChange={() => {}} error="El número de usuarios debe ser un número entero" />);
    expect(number()).toHaveAttribute('aria-invalid', 'true');
    expect(number()).toHaveAccessibleDescription(/debe ser un número entero/);
    expect(slider()).toHaveValue('0');
  });
});

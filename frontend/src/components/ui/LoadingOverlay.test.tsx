import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadingOverlay } from './LoadingOverlay';

describe('LoadingOverlay', () => {
  it('no muestra nada cuando esta oculto', () => {
    const { container } = render(<LoadingOverlay visible={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra la rueda de carga y el mensaje cuando esta visible', () => {
    render(<LoadingOverlay visible />);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('bloquea el scroll del documento mientras esta visible', () => {
    const { rerender } = render(<LoadingOverlay visible />);

    expect(document.body.style.overflow).toBe('hidden');

    rerender(<LoadingOverlay visible={false} />);

    expect(document.body.style.overflow).toBe('');
  });
});

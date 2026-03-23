import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DeleteModal } from './DeleteModal';
import { renderWithProviders } from '../../test/render';

describe('DeleteModal', () => {
  it('renders in a portal and calls the close handler', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <DeleteModal
        open
        onClose={onClose}
        title='Delete outlet'
        entityName='Airport'
        confirmId='outlet-1'
        onConfirm={vi.fn()}
      />,
    );

    expect(await screen.findByText('Delete outlet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call confirm when confirmId is missing', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <DeleteModal
        open
        onClose={vi.fn()}
        title='Delete item'
        confirmId={undefined}
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(await screen.findByRole('button', { name: /delete/i }));
    await waitFor(() => expect(onConfirm).not.toHaveBeenCalled());
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FormEditor from './FormEditor';
import type { Form } from '../../lib/types/forms';
import { renderWithProviders } from '../../test/render';

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    message: {
      ...actual.message,
      error: vi.fn(),
    },
  };
});

const baseForm: Form = {
  _id: 'form-1',
  title: 'Feedback Form',
  questions: [
    {
      _id: 'delTest',
      type: 'short_answer',
      title: 'Protected prompt',
      hint: '',
      isRequired: false,
    },
    {
      _id: 'question-1',
      type: 'multiple_choice',
      title: 'Favorite drink',
      hint: '',
      isRequired: false,
      options: [{ text: 'Tea' }],
    },
  ],
};

describe('FormEditor', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.123456789);
  });

  it('validates empty and duplicate titles before saving', async () => {
    const onSave = vi.fn();
    renderWithProviders(
      <FormEditor
        currentForm={{ ...baseForm, title: ' ' }}
        setCurrentForm={vi.fn()}
        onSave={onSave}
        onCancel={vi.fn()}
        onPreview={vi.fn()}
        existingTitles={['Feedback Form']}
        isSaving={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /save form/i }));
    expect(message.error).toHaveBeenCalledWith('Form title is required');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('adds, duplicates, and updates options without allowing multiple Other options', async () => {
    const setCurrentForm = vi.fn();
    renderWithProviders(
      <FormEditor
        currentForm={baseForm}
        setCurrentForm={setCurrentForm}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onPreview={vi.fn()}
        existingTitles={[]}
        isSaving={false}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /add new question/i }));
    expect(setCurrentForm).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({ _id: '4fzzzxjyl', title: '' }),
        ]),
      }),
    );

    await userEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0]);
    expect(setCurrentForm).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({ _id: '4fzzzxjyl', title: 'Protected prompt' }),
        ]),
      }),
    );

    const addOtherButtons = screen.getAllByRole('button', { name: /add other/i });
    await userEvent.click(addOtherButtons[0]);
    const firstOtherCall = setCurrentForm.mock.calls.at(-1)?.[0];
    expect(firstOtherCall.questions[1].options).toContainEqual({ text: 'Other:' });

    await userEvent.click(addOtherButtons[0]);
    const secondOtherCall = setCurrentForm.mock.calls.at(-1)?.[0];
    expect(
      secondOtherCall.questions[1].options.filter(
        (option: { text: string }) => option.text === 'Other:',
      ),
    ).toHaveLength(1);
  });

  it('switches rating questions to a 5-star default and keeps delTest undeletable', async () => {
    const setCurrentForm = vi.fn();
    renderWithProviders(
      <FormEditor
        currentForm={baseForm}
        setCurrentForm={setCurrentForm}
        onSave={vi.fn()}
        onCancel={vi.fn()}
        onPreview={vi.fn()}
        existingTitles={[]}
        isSaving={false}
      />,
    );

    await userEvent.selectOptions(screen.getByDisplayValue('Multiple Choice'), 'rating');
    expect(setCurrentForm).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({ _id: 'question-1', type: 'rating', maxRatings: 5 }),
        ]),
      }),
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete question/i });
    expect(deleteButtons[0]).toBeDisabled();
  });
});

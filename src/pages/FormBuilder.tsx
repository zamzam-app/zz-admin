import { useState } from 'react';
import { Form, FORM_KEYS } from '../lib/types/forms';
import { formsApi } from '../lib/services/api/forms.api';
import { message } from 'antd';
import { useApiQuery, useApiMutation } from '../lib/react-query/use-api-hooks';
import FormDashboard from '../components/forms/FormDashboard';
import FormEditor from '../components/forms/FormEditor';
import FormViewer from '../components/forms/FormViewer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { NoDataFallback } from '../components/common/NoDataFallback';
import { Button } from '../components/common/Button';

type ViewMode = 'dashboard' | 'builder' | 'viewer' | 'preview';
export default function FormBuilderPage() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [currentForm, setCurrentForm] = useState<Form | null>(null);

  const {
    data: savedForms = [],
    isLoading,
    error,
    refetch,
  } = useApiQuery(FORM_KEYS, formsApi.getForms);

  const createMutation = useApiMutation<Form, void>(() => formsApi.createForm(), [FORM_KEYS], {
    onSuccess: (newForm) => {
      setCurrentForm(newForm);
      setView('builder');
    },
    onError: () => message.error('Failed to create form'),
  });

  const updateMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: { title: string; questions: Form['questions'] } }) =>
      formsApi.updateForm(id, payload),
    [FORM_KEYS],
    {
      onSuccess: () => {
        message.success('Form saved successfully');
        setView('dashboard');
      },
      onError: () => message.error('Update failed'),
    },
  );

  const deleteMutation = useApiMutation((id: string) => formsApi.deleteForm(id), [FORM_KEYS], {
    onSuccess: () => message.success('Form deleted'),
    onError: () => message.error('Delete failed'),
  });

  const handleCreateNew = () => {
    createMutation.mutate();
  };

  const handleEdit = async (form: Form) => {
    try {
      const fullForm = await formsApi.getForm(form._id);
      setCurrentForm(fullForm);
      setView('builder');
    } catch {
      message.error('Failed to load form details');
    }
  };

  const handleSave = () => {
    if (!currentForm) return;
    updateMutation.mutate({
      id: currentForm._id,
      payload: { title: currentForm.title, questions: currentForm.questions },
    });
  };

  const handleDelete = (form: Form) => {
    deleteMutation.mutate(form._id);
  };

  if (error && view === 'dashboard') {
    return (
      <div className='space-y-8'>
        <NoDataFallback
          title='Failed to load forms'
          description={error.message}
          action={
            <Button variant='admin-primary' onClick={() => refetch()} className='rounded-2xl'>
              Try again
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading && view === 'dashboard') return <LoadingSpinner />;

  return (
    <div className='space-y-8'>
      {view === 'dashboard' && (
        <FormDashboard
          savedForms={savedForms}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onOpen={(f) => {
            setCurrentForm(f);
            setView('viewer');
          }}
          onDelete={handleDelete}
        />
      )}

      {currentForm && (view === 'viewer' || view === 'preview') && (
        <FormViewer
          form={currentForm}
          onBack={() => setView(view === 'preview' ? 'builder' : 'dashboard')}
        />
      )}

      {currentForm && view === 'builder' && (
        <FormEditor
          currentForm={currentForm}
          setCurrentForm={setCurrentForm as React.Dispatch<React.SetStateAction<Form | null>>}
          onSave={handleSave}
          onCancel={() => setView('dashboard')}
          onPreview={() => setView('preview')}
        />
      )}
    </div>
  );
}

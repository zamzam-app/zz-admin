import { useState, useEffect } from 'react';
import { Form } from '../lib/types/forms';
import { formsApi } from '../lib/services/api/forms.api';
import { message } from 'antd';
import FormDashboard from '../components/forms/FormDashboard';
import FormEditor from '../components/forms/FormEditor';
import FormViewer from '../components/forms/FormViewer';

type ViewMode = 'dashboard' | 'builder' | 'viewer' | 'preview';
export default function FormBuilderPage() {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [savedForms, setSavedForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentForm, setCurrentForm] = useState<Form | null>(null);

  // Load Forms on Mount
  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const data = await formsApi.getForms();
        setSavedForms(data);
      } catch {
        message.error('Could not load forms');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const handleCreateNew = async () => {
    try {
      const newForm = await formsApi.createForm();
      // Ensure we use the ID returned by MongoDB (_id)
      setCurrentForm(newForm);
      setSavedForms((prev) => [...prev, newForm]);
      setView('builder');
    } catch {
      message.error('Failed to create form');
    }
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

  const handleSave = async () => {
    if (!currentForm) return;

    try {
      const updated = await formsApi.updateForm(currentForm._id, {
        title: currentForm.title,
        questions: currentForm.questions,
      });

      setSavedForms((prev) => prev.map((f) => (f._id === updated._id ? updated : f)));

      message.success('Form saved successfully');
      setView('dashboard');
    } catch {
      message.error('Update failed');
    }
  };

  const handleDelete = async (form: Form) => {
    try {
      await formsApi.deleteForm(form._id);
      setSavedForms((prev) => prev.filter((f) => f._id !== form._id));
      message.success('Form deleted');
    } catch {
      message.error('Delete failed');
    }
  };

  // Prevent crashes if currentForm is null during builder mode
  if (loading && view === 'dashboard') return <div>Loading...</div>;

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

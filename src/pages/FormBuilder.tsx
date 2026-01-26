import { useState, useEffect } from 'react';
import { Form } from '../lib/types/forms';
import FormDashboard from '../components/forms/FormDashboard';
import FormEditor from '../components/forms/FormEditor';
import FormViewer from '../components/forms/FormViewer';

type ViewMode = 'dashboard' | 'builder' | 'viewer' | 'preview';

export default function FormBuilderPage() {
  const [view, setView] = useState<ViewMode>('dashboard');

  const [savedForms, setSavedForms] = useState<Form[]>(() => {
    try {
      const stored = localStorage.getItem('saved_forms');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentForm, setCurrentForm] = useState<Form>({
    id: '1',
    title: 'Untitled Form',
    questions: [
      {
        id: 'q1',
        type: 'short_answer',
        title: 'Untitled Question',
        hint: '',
        required: false,
      },
    ],
  });

  useEffect(() => {
    localStorage.setItem('saved_forms', JSON.stringify(savedForms));
  }, [savedForms]);

  /* -------------------- Handlers -------------------- */

  const handleCreateNew = () => {
    setCurrentForm({
      id: Date.now().toString(),
      title: 'New Form',
      questions: [],
    });
    setView('builder');
  };

  const handleEdit = (form: Form) => {
    setCurrentForm(form);
    setView('builder');
  };

  const handleOpen = (form: Form) => {
    setCurrentForm(form);
    setView('viewer');
  };

  const handleDelete = (form: Form) => {
    setSavedForms((prev) => prev.filter((f) => f.id !== form.id));
  };

  const handleSave = () => {
    setSavedForms((prev) => {
      const exists = prev.find((f) => f.id === currentForm.id);
      return exists
        ? prev.map((f) => (f.id === currentForm.id ? currentForm : f))
        : [...prev, currentForm];
    });
    setView('dashboard');
  };

  /* -------------------- Render -------------------- */

  // This single div with 'space-y-8' is the exact pattern
  // used in your working Employee and Infrastructure pages.
  return (
    <div className='space-y-8'>
      {view === 'dashboard' && (
        <FormDashboard
          savedForms={savedForms}
          onCreateNew={handleCreateNew}
          onEdit={handleEdit}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}

      {(view === 'viewer' || view === 'preview') && (
        <FormViewer
          form={currentForm}
          onBack={() => setView(view === 'preview' ? 'builder' : 'dashboard')}
        />
      )}

      {view === 'builder' && (
        <FormEditor
          currentForm={currentForm}
          setCurrentForm={setCurrentForm}
          onSave={handleSave}
          onCancel={() => setView('dashboard')}
          onPreview={() => setView('preview')}
        />
      )}
    </div>
  );
}

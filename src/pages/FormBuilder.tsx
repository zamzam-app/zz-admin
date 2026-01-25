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
      { id: 'q1', type: 'short_answer', title: 'Untitled Question', hint: '', required: false },
    ],
  });

  // Persist savedForms whenever they change
  useEffect(() => {
    localStorage.setItem('saved_forms', JSON.stringify(savedForms));
  }, [savedForms]);

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

  const handleSave = () => {
    setSavedForms((prev) => {
      const exists = prev.find((f) => f.id === currentForm.id);
      return exists
        ? prev.map((f) => (f.id === currentForm.id ? currentForm : f))
        : [...prev, currentForm];
    });

    setView('dashboard');
  };

  const handleCancelBuilder = () => {
    setView('dashboard');
  };

  const handlePreview = () => {
    setView('preview');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
  };

  if (view === 'dashboard') {
    return (
      <FormDashboard
        savedForms={savedForms}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onOpen={handleOpen}
      />
    );
  }

  if (view === 'viewer' || view === 'preview') {
    return (
      <FormViewer
        form={currentForm}
        onBack={view === 'preview' ? () => setView('builder') : handleBackToDashboard}
      />
    );
  }

  // Builder
  return (
    <FormEditor
      currentForm={currentForm}
      setCurrentForm={setCurrentForm}
      onSave={handleSave}
      onCancel={handleCancelBuilder}
      onPreview={handlePreview}
    />
  );
}

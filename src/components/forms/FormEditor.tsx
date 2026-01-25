import React from 'react';
import { ArrowLeft, Eye, Info, Trash2, X, Star } from 'lucide-react';
import { Form, Question, QuestionType } from '../../lib/types/forms';

interface Props {
  currentForm: Form;
  setCurrentForm: (form: Form) => void;
  onSave: () => void;
  onCancel: () => void;
  onPreview: () => void;
}

const FormEditor: React.FC<Props> = ({
  currentForm,
  setCurrentForm,
  onSave,
  onCancel,
  onPreview,
}) => {
  const addQuestion = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setCurrentForm({
      ...currentForm,
      questions: [
        ...currentForm.questions,
        { id: newId, type: 'short_answer', title: '', hint: '', required: false },
      ],
    });
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setCurrentForm({
      ...currentForm,
      questions: currentForm.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    });
  };

  const addOption = (qId: string) => {
    setCurrentForm({
      ...currentForm,
      questions: currentForm.questions.map((q) =>
        q.id === qId
          ? {
              ...q,
              options: [
                ...(q.options || []),
                {
                  id: Date.now().toString(),
                  text: `Option ${(q.options?.length || 0) + 1}`,
                },
              ],
            }
          : q,
      ),
    });
  };

  return (
    <div className='min-h-screen bg-[#FFFCF5] pb-20 font-sans'>
      {/* Navbar */}
      <nav className='bg-white h-16 flex justify-between items-center px-6 sticky top-0 z-50 shadow-sm border-b'>
        <div className='flex items-center gap-4'>
          <button onClick={onCancel} className='p-2 hover:bg-gray-100 rounded-full'>
            <ArrowLeft className='text-gray-600' />
          </button>
          <input
            className='font-bold text-gray-700 outline-none text-lg'
            value={currentForm.title}
            onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
          />
        </div>
        <div className='flex gap-4'>
          <button
            onClick={onPreview}
            className='flex items-center gap-2 text-[#D4AF37] font-bold px-4 py-2 hover:bg-[#F9F5E3] rounded-lg transition-all'
          >
            <Eye size={18} /> Preview
          </button>
          <button
            onClick={onSave}
            className='bg-[#D4AF37] text-white px-8 py-2 rounded-lg font-bold hover:shadow-lg transition-all'
          >
            Save Form
          </button>
        </div>
      </nav>

      {/* Editor Body */}
      <div className='max-w-3xl mx-auto mt-8 px-4 flex gap-6'>
        <div className='flex-1 space-y-6'>
          {currentForm.questions.map((q, idx) => (
            <div
              key={q.id}
              className='bg-white p-8 rounded-xl shadow-sm border-l-[6px] border-transparent focus-within:border-[#D4AF37] transition-all border border-gray-200 relative'
            >
              <div className='flex gap-4 mb-4'>
                <div className='flex-[2] space-y-2'>
                  <input
                    className='w-full text-lg font-medium bg-gray-50 p-4 rounded-lg border-b-2 border-transparent focus:border-[#D4AF37] outline-none'
                    placeholder={`Question ${idx + 1}`}
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                  />

                  <div className='flex items-center gap-2 px-2'>
                    <Info size={14} className='text-gray-400' />
                    <input
                      className='text-sm text-gray-500 bg-transparent border-b border-transparent focus:border-gray-300 outline-none w-full italic'
                      placeholder="Add a hint (User clicks '?' to see this)..."
                      value={q.hint}
                      onChange={(e) => updateQuestion(q.id, { hint: e.target.value })}
                    />
                  </div>
                </div>

                <select
                  className='flex-1 h-14 border-2 border-gray-100 rounded-lg px-3 font-semibold text-gray-600 outline-none focus:border-[#F5E6CA]'
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(q.id, {
                      type: e.target.value as QuestionType,
                    })
                  }
                >
                  <option value='short_answer'>Short Answer</option>
                  <option value='paragraph'>Paragraph</option>
                  <option value='multiple_choice'>Multiple Choice</option>
                  <option value='checkbox'>Checkboxes</option>
                  <option value='rating'>Star Rating</option>
                </select>
              </div>

              {/* Dynamic Inputs based on type */}
              <div className='space-y-4'>
                {['multiple_choice', 'checkbox'].includes(q.type) ? (
                  <div className='space-y-3'>
                    {q.options?.map((o, oIdx) => (
                      <div key={o.id} className='flex items-center gap-3 group'>
                        <span className='text-gray-300 font-bold w-4'>{oIdx + 1}.</span>
                        <input
                          className='flex-1 border-b border-gray-100 focus:border-[#D4AF37] outline-none py-1'
                          value={o.text}
                          onChange={(e) => {
                            const newOpts = q.options?.map((opt) =>
                              opt.id === o.id ? { ...opt, text: e.target.value } : opt,
                            );
                            updateQuestion(q.id, { options: newOpts });
                          }}
                        />
                        <X
                          className='text-gray-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-all'
                          size={18}
                          onClick={() =>
                            updateQuestion(q.id, {
                              options: q.options?.filter((opt) => opt.id !== o.id),
                            })
                          }
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(q.id)}
                      className='text-[#D4AF37] font-bold text-sm mt-4 hover:underline transition-all'
                    >
                      + Add Option
                    </button>
                  </div>
                ) : q.type === 'rating' ? (
                  <div className='flex items-center gap-4 p-4 bg-[#F9F5E3] rounded-xl'>
                    <span className='font-bold text-[#D4AF37] uppercase text-xs tracking-widest'>
                      Star Scale:
                    </span>
                    <select
                      className='bg-white border p-1 rounded font-bold text-[#D4AF37]'
                      value={q.maxRating}
                      onChange={(e) =>
                        updateQuestion(q.id, {
                          maxRating: parseInt(e.target.value),
                        })
                      }
                    >
                      <option value='3'>3 Stars</option>
                      <option value='5'>5 Stars</option>
                      <option value='10'>10 Stars</option>
                    </select>
                    <div className='flex gap-1 text-yellow-400'>
                      {[...Array(q.maxRating || 5)].map((_, i) => (
                        <Star key={i} size={20} fill='currentColor' />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='h-10 border-b border-dashed border-gray-300 flex items-center text-gray-300 italic'>
                    User will type their {q.type.replace('_', ' ')} here...
                  </div>
                )}
              </div>

              <div className='mt-8 pt-4 border-t flex justify-end gap-6 items-center text-gray-400'>
                <Trash2
                  className='hover:text-red-500 cursor-pointer transition-colors'
                  size={20}
                  onClick={() =>
                    setCurrentForm({
                      ...currentForm,
                      questions: currentForm.questions.filter((item) => item.id !== q.id),
                    })
                  }
                />
                <div className='flex items-center gap-2'>
                  <span className='text-xs font-bold uppercase tracking-wider'>Required</span>
                  <input
                    type='checkbox'
                    className='w-5 h-5 accent-[#D4AF37] cursor-pointer'
                    checked={q.required}
                    onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addQuestion}
            className='w-full py-6 border-4 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#F5E6CA] hover:text-[#D4AF37] hover:bg-[#F9F5E3] transition-all font-black text-xl uppercase tracking-tighter bg-white shadow-sm'
          >
            + Add New Question
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormEditor;

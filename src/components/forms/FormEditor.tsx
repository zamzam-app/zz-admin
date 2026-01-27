import React from 'react';
import { useEffect } from 'react';
import { ArrowLeft, Eye, Info, Trash2, X, Star, Save, Plus } from 'lucide-react';
import { Form, Question, QuestionType } from '../../lib/types/forms';
import { Button } from '../common/Button';
import Card from '../common/Card';

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


useEffect(() => {
  if (currentForm.questions.length === 0) {
    const ratingQuestion: Question = {
      id: "delTest",
      type: 'rating',
      title: 'Overall Rating',
      hint: 'Please rate your experience',
      required: true,
      maxRating: 5,
    };

    setCurrentForm({
      ...currentForm,
      questions: [ratingQuestion],
    });
  }
}, [currentForm, setCurrentForm]);

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
                { id: Date.now().toString(), text: `Option ${(q.options?.length || 0) + 1}` },
              ],
            }
          : q,
      ),
    });
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <button
            onClick={onCancel}
            className='p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition shadow-sm'
          >
            <ArrowLeft size={20} className='text-[#1F2937]' />
          </button>
          <div>
            <input
              className='text-2xl font-black text-[#1F2937] outline-none bg-transparent border-b-2 border-transparent focus:border-blue-500 w-full md:w-auto'
              value={currentForm.title}
              placeholder='Untitled Form'
              onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
            />
            <p className='text-gray-500 text-sm'>Design your form questions and logic</p>
          </div>
        </div>

        <div className='flex gap-3'>
          <Button
            variant='ghost'
            onClick={onPreview}
            className='rounded-2xl font-bold text-blue-600 hover:bg-blue-50 flex items-center gap-3'
          >
            <Eye size={18} />
            <span>Preview</span>
          </Button>
          <Button
            variant='admin-primary'
            onClick={onSave}
            className='rounded-2xl px-8 py-4 shadow-lg flex items-center gap-3'
          >
            <Save size={18} />
            <span>Save Form</span>
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className='space-y-6'>
        {currentForm.questions.map((q, idx) => (
          <Card
            key={q.id}
            className='p-8 border border-gray-100 rounded-[28px] bg-white shadow-sm hover:border-blue-200 transition-all'
          >
            <div className='flex flex-col md:flex-row gap-6 mb-6'>
              <div className='flex-1 space-y-4'>
                <div className='flex items-center gap-3'>
                  <span className='flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-500 font-black text-xs'>
                    {idx + 1}
                  </span>
                  <input
                    className='w-full text-lg font-black text-[#1F2937] bg-transparent outline-none border-b-2 border-gray-50 focus:border-blue-500 py-1 transition-all'
                    placeholder='Enter your question here...'
                    value={q.title}
                    onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
                  />
                </div>

                <div className='flex items-center gap-2 px-1 text-gray-400'>
                  <Info size={14} />
                  <input
                    className='w-full text-sm bg-transparent outline-none border-b border-dashed border-gray-200 focus:border-gray-400 italic'
                    placeholder='Add a helpful hint for users'
                    value={q.hint}
                    onChange={(e) => updateQuestion(q.id, { hint: e.target.value })}
                  />
                </div>
              </div>

              <select
                disabled={q.id === "delTest"}
                className={`h-12 px-4 rounded-xl border-2 border-gray-50 bg-gray-50 font-bold text-[#1F2937] outline-none focus:border-blue-500 transition-all cursor-pointer
                  ${
                    q.id === "delTest"
                     ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-50 border-gray-50 focus:border-blue-500 cursor-pointer'
                     }
                  `}
                value={q.type}
                onChange={(e) => updateQuestion(q.id, { type: e.target.value as QuestionType })}
              >
                <option value='short_answer'>Short Answer</option>
                <option value='paragraph'>Paragraph</option>
                <option value='multiple_choice'>Multiple Choice</option>
                <option value='checkbox'>Checkboxes</option>
                <option value='rating'>Star Rating</option>
              </select>
            </div>

            {/* Dynamic Content */}
            <div className='pl-11'>
              {['multiple_choice', 'checkbox'].includes(q.type) ? (
                <div className='space-y-3'>
                  {q.options?.map((o) => (
                    <div key={o.id} className='flex items-center gap-3 group'>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${q.type === 'checkbox' ? 'rounded-md' : 'rounded-full'} border-gray-200`}
                      />
                      <input
                        className='flex-1 border-b border-gray-100 outline-none py-1 focus:border-blue-400 text-[#1F2937] font-medium'
                        value={o.text}
                        onChange={(e) =>
                          updateQuestion(q.id, {
                            options: q.options?.map((opt) =>
                              opt.id === o.id ? { ...opt, text: e.target.value } : opt,
                            ),
                          })
                        }
                      />
                      <button
                        onClick={() =>
                          updateQuestion(q.id, {
                            options: q.options?.filter((opt) => opt.id !== o.id),
                          })
                        }
                        className='p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition'
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(q.id)}
                    className='text-sm font-black text-blue-500 hover:text-blue-600 flex items-center gap-2 mt-4'
                  >
                    <Plus size={14} /> Add Option
                  </button>
                </div>
              ) : q.type === 'rating' ? (
                <div className='flex items-center gap-6 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 w-fit'>
                  <select
                    className='bg-white border-2 border-blue-100 rounded-lg px-3 py-1 font-bold text-blue-600 outline-none'
                    value={q.maxRating || 5}
                    onChange={(e) => updateQuestion(q.id, { maxRating: Number(e.target.value) })}
                  >
                    <option value={3}>3 Stars</option>
                    <option value={5}>5 Stars</option>
                    <option value={10}>10 Stars</option>
                  </select>
                  <div className='flex gap-1 text-amber-400'>
                    {Array.from({ length: q.maxRating || 5 }).map((_, i) => (
                      <Star key={i} size={20} fill='currentColor' />
                    ))}
                  </div>
                </div>
              ) : (
                <div className='py-3 border-b-2 border-dashed border-gray-100 text-gray-300 font-medium italic'>
                  User input field...
                </div>
              )}
            </div>

            {/* Question Footer */}
            <div className='mt-8 pt-6 border-t border-gray-50 flex justify-between items-center'>
              <button
                disabled={q.id === "delTest"}
                onClick={() =>{
                  if (q.id === "delTest") return;
                  setCurrentForm({
                    ...currentForm,
                    questions: currentForm.questions.filter((item) => item.id !== q.id),
                  })
                }
              }
                className={`flex items-center gap-2 text-gray-400 font-bold transition-colors
                          ${
                        q.id === 'delTest'
                        ? 'text-gray-300 cursor-not-allowed'
                       : 'text-gray-400 hover:text-red-500 cursor-pointer'
                     }
                  `}>
                <Trash2 size={18} 
                className={q.id === 'delTest' ? 'text-gray-300' : '' }/> Delete Question
              </button>

              <label className='flex items-center gap-3 cursor-pointer group'>
                <span className='text-sm font-black text-gray-500 group-hover:text-[#1F2937]'>
                  Required
                </span>
                <input
                  type='checkbox'
                  checked={q.required}
                  onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                  className='w-5 h-5 rounded-lg border-2 border-gray-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer'
                />
              </label>
            </div>
          </Card>
        ))}

        <button
          onClick={addQuestion}
          className='w-full py-3 rounded-[28px] border-2 border-dashed border-gray-200 text-gray-400 font-black text-xl hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all group flex items-center justify-center gap-3'
        >
          <Plus size={20} className='group-hover:scale-110 transition-transform' /> Add New Question
        </button>
      </div>
    </div>
  );
};

export default FormEditor;

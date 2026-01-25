import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Star } from 'lucide-react';
import { Form } from '../../lib/types/forms';

interface Props {
  form: Form;
  onBack: () => void;
}

const FormViewer: React.FC<Props> = ({ form, onBack }) => {
  //eslint-disable-next-line
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const toggleHint = (qId: string) => {
    setOpenHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className='min-h-screen bg-[#FFFCF5] py-10 px-4'>
      <div className='max-w-2xl mx-auto'>
        <button
          onClick={onBack}
          className='mb-6 flex items-center gap-2 text-[#D4AF37] font-bold hover:underline'
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className='bg-white rounded-xl shadow-md border-t-[10px] border-[#D4AF37] p-8 mb-6'>
          <h1 className='text-4xl font-bold text-gray-900'>{form.title}</h1>
        </div>
        {form.questions.map((q) => (
          <div key={q.id} className='bg-white p-8 rounded-xl shadow-sm mb-4 border border-gray-200'>
            <div className='flex items-start justify-between mb-2'>
              <p className='text-lg font-semibold text-gray-800'>
                {q.title} {q.required && <span className='text-red-500'>*</span>}
              </p>
              {/* Hint Toggle Icon */}
              {q.hint && (
                <button
                  onClick={() => toggleHint(q.id)}
                  className={`p-1 rounded-full transition-colors ${
                    openHints[q.id]
                      ? 'bg-[#F5E6CA] text-[#D4AF37]'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <HelpCircle size={20} />
                </button>
              )}
            </div>

            {/* Conditional Hint Display (Only on click) */}
            {q.hint && openHints[q.id] && (
              <div className='mb-6 p-3 bg-blue-50 border-l-4 border-blue-400 rounded text-sm text-blue-800 animate-in fade-in slide-in-from-top-1'>
                <strong>Hint:</strong> {q.hint}
              </div>
            )}

            <div className='mt-4'>
              {q.type === 'short_answer' && (
                <input
                  type='text'
                  placeholder='Short answer text'
                  className='w-full border-b-2 border-gray-100 focus:border-[#D4AF37] outline-none py-2 transition-colors'
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
              {q.type === 'paragraph' && (
                <textarea
                  placeholder='Long answer text'
                  className='w-full border-b-2 border-gray-100 focus:border-[#D4AF37] outline-none py-2 resize-none'
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}

              {q.type === 'rating' && (
                <div className='flex flex-col gap-2'>
                  <div className='flex gap-3'>
                    {[...Array(q.maxRating || 5)].map((_, i) => {
                      const starValue = i + 1;
                      const isActive = starValue <= (answers[q.id] || 0);
                      return (
                        <button
                          key={i}
                          type='button'
                          onClick={() => setAnswers({ ...answers, [q.id]: starValue })}
                          className='transition-transform hover:scale-125 focus:outline-none'
                        >
                          <Star
                            size={40}
                            className={`${
                              isActive ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                            } transition-colors`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {['multiple_choice', 'checkbox'].includes(q.type) && (
                <div className='space-y-4'>
                  {q.options?.map((o) => (
                    <label
                      key={o.id}
                      className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer'
                    >
                      <input
                        type={q.type === 'checkbox' ? 'checkbox' : 'radio'}
                        name={q.id}
                        className='w-5 h-5 accent-[#D4AF37]'
                        onChange={(e) => {
                          if (q.type === 'checkbox') {
                            const current = answers[q.id] || [];
                            if (e.target.checked) {
                              setAnswers({ ...answers, [q.id]: [...current, o.id] });
                            } else {
                              setAnswers({
                                ...answers,
                                [q.id]: current.filter((id: string) => id !== o.id),
                              });
                            }
                          } else {
                            setAnswers({ ...answers, [q.id]: o.id });
                          }
                        }}
                        checked={
                          q.type === 'checkbox'
                            ? (answers[q.id] || []).includes(o.id)
                            : answers[q.id] === o.id
                        }
                      />
                      <span className='text-gray-700'>{o.text}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormViewer;

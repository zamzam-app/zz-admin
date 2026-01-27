import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, Star } from 'lucide-react';
import { Form } from '../../lib/types/forms';
import Card from '../common/Card';

interface Props {
  form: Form;
  onBack: () => void;
}

const FormViewer: React.FC<Props> = ({ form, onBack }) => {
  // FIXED: Replaced 'any' with a union type that matches your possible inputs
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [openHints, setOpenHints] = useState<Record<string, boolean>>({});

  const toggleHint = (qId: string) => {
    setOpenHints((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  return (
    <div className='space-y-8'>
      {/* Header Section */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <button
            onClick={onBack}
            className='p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition shadow-sm'
          >
            <ArrowLeft size={20} className='text-[#1F2937]' />
          </button>
          <div>
            <h1 className='text-3xl font-black text-[#1F2937]'>{form.title}</h1>
            <p className='text-gray-500 text-sm'>Previewing how users will see this form</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className='space-y-6'>
        {form.questions.map((q, index) => (
          <Card key={q.id} className='p-8 border border-gray-100 rounded-[28px] bg-white shadow-sm'>
            {/* Question Header */}
            <div className='flex justify-between items-start mb-6'>
              <div>
                <span className='text-[10px] text-blue-500 uppercase font-black tracking-widest block mb-1'>
                  Question {index + 1} {q.required && '• Required'}
                </span>
                <h3 className='text-xl font-bold text-[#1F2937]'>{q.title}</h3>
              </div>

              {q.hint && (
                <button
                  onClick={() => toggleHint(q.id)}
                  className={`p-2 rounded-xl transition-all ${
                    openHints[q.id] ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <HelpCircle size={20} />
                </button>
              )}
            </div>

            {/* Hint Box */}
            {q.hint && openHints[q.id] && (
              <div className='mb-6 p-4 bg-blue-50/50 border-l-4 border-blue-400 rounded-r-xl text-sm text-blue-700'>
                <span className='font-black uppercase text-[10px] block mb-1'>Hint</span>
                {q.hint}
              </div>
            )}

            {/* Answer Input Area */}
            <div className='mt-4'>
              {q.type === 'linear_scale' && (() => {
  const scale = q.scale ?? {
    min: 1,
    max: 5,
    minLabel: '',
    maxLabel: '',
  };

  const value = (answers[q.id] as number) ?? null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-medium text-gray-500">
        <span>{scale.minLabel}</span>
        <span>{scale.maxLabel}</span>
      </div>

      <div className="flex justify-between gap-2">
        {Array.from(
          { length: scale.max - scale.min + 1 },
          (_, i) => scale.min + i
        ).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setAnswers({ ...answers, [q.id]: n })}
            className={`w-12 h-12 rounded-full font-bold transition-all
              ${
                value === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }
            `}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
})()}

              {q.type === 'short_answer' && (
                <input
                  type='text'
                  placeholder='Type your response...'
                  className='w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium text-[#1F2937]'
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
              {q.type === 'paragraph' && (
                <textarea
                  rows={4}
                  placeholder='Type your detailed response...'
                  className='w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium text-[#1F2937] resize-none'
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                />
              )}
              {q.type === 'rating' && (
                <div className='flex gap-4 mt-2'>
                  {[...Array(q.maxRating || 5)].map((_, i) => {
                    const value = i + 1;
                    const active = value <= ((answers[q.id] as number) || 0);

                    return (
                      <button
                        key={i}
                        type='button'
                        onClick={() => setAnswers({ ...answers, [q.id]: value })}
                        className='transform hover:scale-125 transition-all duration-200'
                      >
                        <Star
                          size={42}
                          className={active ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
              
            {['multiple_choice', 'checkbox'].includes(q.type) && (
             <div className='flex flex-col gap-3 mt-2'>
            {q.options?.map((o) => {
             const isOther = o.isOther;

             const isChecked =
                q.type === 'checkbox'
              ? ((answers[q.id] as string[]) || []).some((v) => v.startsWith(o.id))
             : typeof answers[q.id] === 'string' && (answers[q.id] as string).startsWith(o.id);

        const getOtherValue = (value?: string) => {
         if (!value) return '';
           const idx = value.indexOf(':');
           return idx === -1 ? '' : value.slice(idx + 1);
        };

      return (
        <label
          key={o.id}
          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all w-full cursor-pointer
            ${
              isChecked
                ? 'border-blue-500 bg-blue-50/30'
                : 'border-gray-50 bg-gray-50 hover:border-gray-200'
            }
          `}
        >
          <input
            type={q.type === 'checkbox' ? 'checkbox' : 'radio'}
            name={q.id}
            className='w-5 h-5 accent-blue-600 shrink-0'
            checked={isChecked}
            onChange={(e) => {
              if (q.type === 'checkbox') {
                const current = (answers[q.id] as string[]) || [];
                if (e.target.checked) {
                  setAnswers({ ...answers, [q.id]: [...current, o.id] });
                } else {
                  setAnswers({
                    ...answers,
                    [q.id]: current.filter((v) => !v.startsWith(o.id)),
                  });
                }
              } else {
                setAnswers({ ...answers, [q.id]: o.id });
              }
            }}
          />

          {isOther ? (
            <div className='flex items-center gap-2 flex-1'>
              <span className='font-bold'>Other:</span>
              <input
                type='text'
                placeholder='Please specify'
                className='flex-1 border-b border-gray-300 outline-none focus:border-blue-500 bg-transparent'
                value={
                  typeof answers[q.id] === 'string'
                 ? getOtherValue(answers[q.id] as string)
                  : ''
                }
                onChange={(e) => {
                  const value = `${o.id}:${e.target.value}`;
                  if (q.type === 'checkbox') {
                    const current = (answers[q.id] as string[]) || [];
                    const filtered = current.filter((v) => !v.startsWith(o.id));
                    setAnswers({ ...answers, [q.id]: [...filtered, value] });
                  } else {
                    setAnswers({ ...answers, [q.id]: value });
                  }
                }}
                onFocus={() => {
                  // auto-select Other when typing
                  if (!isChecked) {
                    if (q.type === 'checkbox') {
                      const current = (answers[q.id] as string[]) || [];
                      setAnswers({ ...answers, [q.id]: [...current, o.id] });
                    } else {
                      setAnswers({ ...answers, [q.id]: o.id });
                    }
                  }
                }}
              />
            </div>
          ) : (
            <span className={`font-bold ${isChecked ? 'text-blue-700' : 'text-[#1F2937]'}`}>
              {o.text}
            </span>
                    )}
                  </label>
                  );
                })}
               </div>
              )}

            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormViewer;
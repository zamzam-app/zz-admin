import React, { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Form } from '../../lib/types/forms';
import Card from '../common/Card';

interface Props {
  form: Form;
  onBack: () => void;
}

const OTHER_PREFIX = 'other:';

const FormViewer: React.FC<Props> = ({ form, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});

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
          <Card
            key={q._id}
            className='p-8 border border-gray-100 rounded-[28px] bg-white shadow-sm'
          >
            {/* Question Header */}
            <div className='flex justify-between items-start mb-6'>
              <div>
                <span className='text-[10px] text-blue-500 uppercase font-black tracking-widest block mb-1'>
                  Question {index + 1} {q.isRequired && '• Required'}
                </span>
                <h3 className='text-xl font-bold text-[#1F2937]'>{q.title}</h3>
              </div>
            </div>
            {q.hint && (
              <div className='mb-6 p-4 bg-blue-50/50 border-l-4 border-blue-400 rounded-r-xl text-sm text-blue-700'>
                <span className='font-black uppercase text-[10px] block mb-1'>Hint</span>
                {q.hint}
              </div>
            )}
            {/* Answer Input Area */}
            <div className='mt-4'>
              {q.type === 'short_answer' && (
                <input
                  type='text'
                  placeholder='Type your response...'
                  className='w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium text-[#1F2937]'
                  value={(answers[q._id] as string) || ''}
                  onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                />
              )}
              {q.type === 'paragraph' && (
                <textarea
                  rows={4}
                  placeholder='Type your detailed response...'
                  className='w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 outline-none transition-all font-medium text-[#1F2937] resize-none'
                  value={(answers[q._id] as string) || ''}
                  onChange={(e) => setAnswers({ ...answers, [q._id]: e.target.value })}
                />
              )}
              {q.type === 'rating' && (
                <div className='flex gap-4 mt-2'>
                  {[...Array(q.maxRatings || 5)].map((_, i) => {
                    const value = i + 1;
                    const active = value <= ((answers[q._id] as number) || 0);

                    return (
                      <button
                        key={i}
                        type='button'
                        onClick={() => setAnswers({ ...answers, [q._id]: value })}
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
                  {q.options?.map((o, optIdx) => {
                    const isOther = o.text === 'Other:';
                    const optKey = String(optIdx);

                    const isChecked =
                      q.type === 'checkbox'
                        ? isOther
                          ? ((answers[q._id] as string[]) || []).some(
                              (v) => typeof v === 'string' && v.startsWith(OTHER_PREFIX),
                            )
                          : ((answers[q._id] as string[]) || []).includes(optKey)
                        : isOther
                          ? typeof answers[q._id] === 'string' &&
                            (answers[q._id] as string).startsWith(OTHER_PREFIX)
                          : answers[q._id] === optKey;

                    const getOtherValue = () => {
                      const raw = answers[q._id];
                      if (q.type === 'checkbox' && Array.isArray(raw)) {
                        const other = raw.find(
                          (v) => typeof v === 'string' && v.startsWith(OTHER_PREFIX),
                        );
                        return other ? (other as string).slice(OTHER_PREFIX.length) : '';
                      }
                      if (typeof raw === 'string' && raw.startsWith(OTHER_PREFIX))
                        return raw.slice(OTHER_PREFIX.length);
                      return '';
                    };

                    return (
                      <label
                        key={optIdx}
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
                          name={q._id}
                          className='w-5 h-5 accent-blue-600 shrink-0'
                          checked={isChecked}
                          onChange={(e) => {
                            if (q.type === 'checkbox') {
                              const current = (answers[q._id] as string[]) || [];
                              if (e.target.checked) {
                                setAnswers({
                                  ...answers,
                                  [q._id]: isOther
                                    ? [
                                        ...current.filter(
                                          (v) =>
                                            !(typeof v === 'string' && v.startsWith(OTHER_PREFIX)),
                                        ),
                                        OTHER_PREFIX,
                                      ]
                                    : [...current, optKey],
                                });
                              } else {
                                setAnswers({
                                  ...answers,
                                  [q._id]: isOther
                                    ? current.filter(
                                        (v) =>
                                          !(typeof v === 'string' && v.startsWith(OTHER_PREFIX)),
                                      )
                                    : current.filter((v) => v !== optKey),
                                });
                              }
                            } else {
                              setAnswers({
                                ...answers,
                                [q._id]: isOther ? OTHER_PREFIX : optKey,
                              });
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
                              value={getOtherValue()}
                              onChange={(e) => {
                                const value = `${OTHER_PREFIX}${e.target.value}`;
                                if (q.type === 'checkbox') {
                                  const current = (answers[q._id] as string[]) || [];
                                  const filtered = current.filter(
                                    (v) => !(typeof v === 'string' && v.startsWith(OTHER_PREFIX)),
                                  );
                                  setAnswers({ ...answers, [q._id]: [...filtered, value] });
                                } else {
                                  setAnswers({ ...answers, [q._id]: value });
                                }
                              }}
                              onFocus={() => {
                                if (!isChecked) {
                                  if (q.type === 'checkbox') {
                                    const current = (answers[q._id] as string[]) || [];
                                    setAnswers({
                                      ...answers,
                                      [q._id]: [
                                        ...current.filter(
                                          (v) =>
                                            !(typeof v === 'string' && v.startsWith(OTHER_PREFIX)),
                                        ),
                                        OTHER_PREFIX,
                                      ],
                                    });
                                  } else {
                                    setAnswers({ ...answers, [q._id]: OTHER_PREFIX });
                                  }
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <span
                            className={`font-bold ${isChecked ? 'text-blue-700' : 'text-[#1F2937]'}`}
                          >
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

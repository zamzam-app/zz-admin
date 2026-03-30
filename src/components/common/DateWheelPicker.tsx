import { useState, useMemo, useCallback } from 'react';
import { WheelPicker, WheelPickerWrapper, type WheelPickerOption } from '@ncdai/react-wheel-picker';
import '@ncdai/react-wheel-picker/style.css';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function getDaysInMonth(year: number, month: number): number {
  return dayjs(`${year}-${month}-01`).daysInMonth();
}

export interface DateWheelPickerProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  minYear?: number;
  maxYear?: number;
  id?: string;
  className?: string;
  highlightTextClassName?: string;
  optionTextClassName?: string;
}

const CURRENT_YEAR = dayjs().year();
const DEFAULT_MIN_YEAR = 1900;

export function DateWheelPicker({
  value,
  onChange,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = CURRENT_YEAR,
  id,
  className = '',
  highlightTextClassName = "font-['Epilogue'] text-base leading-none text-[#923a3a]",
  optionTextClassName = "font-['Epilogue'] text-sm font-medium leading-none text-[#0D141C]/45",
}: DateWheelPickerProps) {
  const getDefaultParts = useCallback(
    () => ({
      year: maxYear - 25,
      month: 1 as number,
      day: 1 as number,
    }),
    [maxYear],
  );

  const valueParts = useMemo(
    () =>
      value?.isValid() ? { year: value.year(), month: value.month() + 1, day: value.date() } : null,
    [value],
  );

  const defaultParts = getDefaultParts();
  const [day, setDay] = useState(valueParts?.day ?? defaultParts.day);
  const [month, setMonth] = useState(valueParts?.month ?? defaultParts.month);
  const [year, setYear] = useState(valueParts?.year ?? defaultParts.year);

  const displayDay = valueParts?.day ?? day;
  const displayMonth = valueParts?.month ?? month;
  const displayYear = valueParts?.year ?? year;

  const yearOptions = useMemo<WheelPickerOption<number>[]>(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, i) => {
        const y = minYear + i;
        return { value: y, label: String(y) };
      }),
    [minYear, maxYear],
  );

  const monthOptions = useMemo<WheelPickerOption<number>[]>(
    () =>
      MONTH_LABELS.map((label, i) => ({
        value: i + 1,
        label,
      })),
    [],
  );

  const dayOptions = useMemo<WheelPickerOption<number>[]>(
    () =>
      Array.from({ length: getDaysInMonth(displayYear, displayMonth) }, (_, i) => ({
        value: i + 1,
        label: String(i + 1),
      })),
    [displayYear, displayMonth],
  );

  const notifyChange = useCallback(
    (y: number, m: number, d: number) => {
      const date = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      if (date.isValid()) onChange(date);
    },
    [onChange],
  );

  const handleDayChange = useCallback(
    (d: number) => {
      if (!valueParts) setDay(d);
      notifyChange(displayYear, displayMonth, d);
    },
    [displayYear, displayMonth, valueParts, notifyChange],
  );

  const handleMonthChange = useCallback(
    (m: number) => {
      const maxDay = getDaysInMonth(displayYear, m);
      const newDay = Math.min(displayDay, maxDay);
      if (!valueParts) {
        setMonth(m);
        setDay(newDay);
      }
      notifyChange(displayYear, m, newDay);
    },
    [displayYear, displayDay, valueParts, notifyChange],
  );

  const handleYearChange = useCallback(
    (y: number) => {
      const maxDay = getDaysInMonth(y, displayMonth);
      const newDay = Math.min(displayDay, maxDay);
      if (!valueParts) {
        setYear(y);
        setDay(newDay);
      }
      notifyChange(y, displayMonth, newDay);
    },
    [displayMonth, displayDay, valueParts, notifyChange],
  );

  const wheelClassNames = {
    optionItem: optionTextClassName,
    highlightWrapper: 'bg-white/70 rounded-md border-y border-[#E8EDF2]',
    highlightItem: highlightTextClassName,
  };

  const PICKER_ROW_HEIGHT = 40;
  const VISIBLE_ROWS = 3;
  const pickerHeight = PICKER_ROW_HEIGHT * VISIBLE_ROWS;

  return (
    <div
      id={id}
      className={`date-wheel-picker rounded-xl border border-[#E8EDF2] bg-[#FDFCFB] overflow-hidden ${className}`}
      style={
        {
          ['--date-wheel-picker-height' as string]: `${pickerHeight}px`,
        } as React.CSSProperties
      }
    >
      <style>{`.date-wheel-picker [data-rwp-wrapper]{height:var(--date-wheel-picker-height) !important}.date-wheel-picker [data-rwp]{height:var(--date-wheel-picker-height) !important}`}</style>
      <WheelPickerWrapper className='flex'>
        <WheelPicker
          options={dayOptions}
          value={displayDay}
          onValueChange={handleDayChange}
          infinite
          optionItemHeight={PICKER_ROW_HEIGHT}
          classNames={wheelClassNames}
        />
        <WheelPicker
          options={monthOptions}
          value={displayMonth}
          onValueChange={handleMonthChange}
          infinite
          optionItemHeight={PICKER_ROW_HEIGHT}
          classNames={wheelClassNames}
        />
        <WheelPicker
          options={yearOptions}
          value={displayYear}
          onValueChange={handleYearChange}
          optionItemHeight={PICKER_ROW_HEIGHT}
          classNames={wheelClassNames}
        />
      </WheelPickerWrapper>
    </div>
  );
}

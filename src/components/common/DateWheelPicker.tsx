import { useState, useMemo, useCallback, useEffect } from 'react';
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

function getMinDayForMonth(year: number, month: number, minDate: Dayjs | undefined): number {
  if (!minDate) return 1;
  if (year === minDate.year() && month === minDate.month() + 1) return minDate.date();
  return 1;
}

export interface DateWheelPickerProps {
  value: Dayjs | null;
  onChange: (date: Dayjs) => void;
  /** When set, the user cannot pick a calendar date before this (compare by day). */
  minDate?: Dayjs;
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
  minDate,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = CURRENT_YEAR,
  id,
  className = '',
  highlightTextClassName = "font-['Epilogue'] text-base leading-none text-[#923a3a]",
  optionTextClassName = "font-['Epilogue'] text-sm font-medium leading-none text-[#0D141C]/45",
}: DateWheelPickerProps) {
  const effectiveMinYear = useMemo(
    () => (minDate ? Math.max(minYear, minDate.year()) : minYear),
    [minYear, minDate],
  );

  useEffect(() => {
    if (!minDate || !value?.isValid()) return;
    if (value.isBefore(minDate, 'day')) {
      onChange(minDate.startOf('day'));
    }
  }, [minDate, value, onChange]);
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
      Array.from({ length: Math.max(0, maxYear - effectiveMinYear + 1) }, (_, i) => {
        const y = effectiveMinYear + i;
        return { value: y, label: String(y) };
      }),
    [effectiveMinYear, maxYear],
  );

  const monthOptions = useMemo<WheelPickerOption<number>[]>(() => {
    const base = MONTH_LABELS.map((label, i) => ({
      value: i + 1,
      label,
    }));
    if (!minDate || displayYear !== minDate.year()) return base;
    return base.filter((o) => o.value >= minDate.month() + 1);
  }, [displayYear, minDate]);

  const dayOptions = useMemo<WheelPickerOption<number>[]>(() => {
    const dim = getDaysInMonth(displayYear, displayMonth);
    const start = getMinDayForMonth(displayYear, displayMonth, minDate);
    return Array.from({ length: dim - start + 1 }, (_, i) => ({
      value: start + i,
      label: String(start + i),
    }));
  }, [displayYear, displayMonth, minDate]);

  const notifyChange = useCallback(
    (y: number, m: number, d: number) => {
      let date = dayjs(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
      if (!date.isValid()) return;
      if (minDate && date.isBefore(minDate, 'day')) {
        date = minDate.startOf('day');
      }
      onChange(date);
    },
    [onChange, minDate],
  );

  const handleDayChange = useCallback(
    (d: number) => {
      const minDay = getMinDayForMonth(displayYear, displayMonth, minDate);
      const maxDay = getDaysInMonth(displayYear, displayMonth);
      const clamped = Math.min(Math.max(d, minDay), maxDay);
      if (!valueParts) setDay(clamped);
      notifyChange(displayYear, displayMonth, clamped);
    },
    [displayYear, displayMonth, valueParts, notifyChange, minDate],
  );

  const handleMonthChange = useCallback(
    (m: number) => {
      const maxDay = getDaysInMonth(displayYear, m);
      const minDay = getMinDayForMonth(displayYear, m, minDate);
      const newDay = Math.min(Math.max(displayDay, minDay), maxDay);
      if (!valueParts) {
        setMonth(m);
        setDay(newDay);
      }
      notifyChange(displayYear, m, newDay);
    },
    [displayYear, displayDay, valueParts, notifyChange, minDate],
  );

  const handleYearChange = useCallback(
    (y: number) => {
      const maxDay = getDaysInMonth(y, displayMonth);
      const minDay = getMinDayForMonth(y, displayMonth, minDate);
      const newDay = Math.min(Math.max(displayDay, minDay), maxDay);
      if (!valueParts) {
        setYear(y);
        setDay(newDay);
      }
      notifyChange(y, displayMonth, newDay);
    },
    [displayMonth, displayDay, valueParts, notifyChange, minDate],
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

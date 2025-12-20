import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import { DayFlag, DayPicker, getDefaultClassNames, SelectionState, UI } from 'react-day-picker';

interface LicenseExpirePickerProps {
    userId: number;
    currentExpire: number;
    onDateChange: (userId: number, newTimestamp: number) => void;
}

const LicenseExpirePicker: FC<LicenseExpirePickerProps> = ({ userId, currentExpire, onDateChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(currentExpire ? new Date(currentExpire * 1000) : undefined);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            const timestamp = Math.floor(date.getTime() / 1000);
            onDateChange(userId, timestamp);
            setIsOpen(false);
        }
    };

    const toggleDatePicker = () => {
        setIsOpen(!isOpen);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const defaultClassNames = getDefaultClassNames();

    return (
        <div className='relative' ref={dropdownRef}>
            <button onClick={toggleDatePicker} className='w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-left text-sm font-medium text-stone-600 transition-all duration-200 hover:border-stone-400 hover:bg-stone-100 focus:ring-2 focus:ring-stone-500 focus:outline-none'>
                <span>{selectedDate ? formatDate(Math.floor(selectedDate.getTime() / 1000)) : 'Chọn ngày'}</span>
            </button>

            {isOpen && (
                <div className='absolute z-50 mt-2 min-w-80 rounded-lg border border-stone-300 bg-white p-4 shadow-xl'>
                    <div className='mb-4 flex items-center justify-between'>
                        <p className='text-sm font-semibold text-stone-600'>Chọn ngày hết hạn</p>
                        <button onClick={() => setIsOpen(false)} className='text-stone-400 transition-colors hover:text-stone-600'>
                            <FontAwesomeIcon icon={faTimes} className='h-5 w-5' />
                        </button>
                    </div>

                    <DayPicker
                        mode='single'
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        locale={vi}
                        defaultMonth={selectedDate}
                        disabled={{ before: new Date() }}
                        modifiersClassNames={{
                            selected: 'bg-stone-600 [&_button]:!text-stone-50 [&_button:hover]:bg-stone-600 rounded-md'
                        }}
                        classNames={{
                            ...defaultClassNames,
                            [UI.Root]: `${defaultClassNames[UI.Root]} mx-0 [&_*_thead]:hidden [&_*_thead]:opacity-0 [&_*_thead]:h-0 [&_*_thead]:overflow-hidden`,
                            [UI.Months]: `${defaultClassNames[UI.Months]} flex flex-col space-y-4`,
                            [UI.Month]: `${defaultClassNames[UI.Month]} space-y-4`,
                            [UI.MonthCaption]: `${defaultClassNames[UI.MonthCaption]} flex justify-center items-center relative`,
                            [UI.CaptionLabel]: `${defaultClassNames[UI.CaptionLabel]} text-sm font-medium text-stone-600`,
                            [UI.Nav]: `${defaultClassNames[UI.Nav]} flex items-center justify-between`,
                            [UI.PreviousMonthButton]: `${defaultClassNames[UI.PreviousMonthButton]} p-1 rounded-md hover:bg-stone-100 transition-colors`,
                            [UI.NextMonthButton]: `${defaultClassNames[UI.NextMonthButton]} p-1 rounded-md hover:bg-stone-100 transition-colors`,
                            [UI.MonthGrid]: `${defaultClassNames[UI.MonthGrid]} w-full border-collapse space-y-1`,
                            [UI.Week]: `${defaultClassNames[UI.Week]} flex w-full mt-2`,
                            [UI.Weekdays]: `${defaultClassNames[UI.Weekdays]} hidden`,
                            [UI.Weekday]: `${defaultClassNames[UI.Weekday]} hidden`,
                            [UI.Day]: `${defaultClassNames[UI.Day]} text-center p-0 relative focus-within:relative focus-within:z-20`,
                            [UI.DayButton]: `${defaultClassNames[UI.DayButton]} h-9 w-9 p-0 font-normal text-stone-600 hover:bg-stone-100 rounded-md transition-colors`,
                            [SelectionState.range_start]: `${defaultClassNames[SelectionState.range_start]}`,
                            [SelectionState.range_middle]: `${defaultClassNames[SelectionState.range_middle]}`,
                            [SelectionState.range_end]: `${defaultClassNames[SelectionState.range_end]}`,
                            [SelectionState.selected]: `${defaultClassNames[SelectionState.selected]}`,
                            [DayFlag.today]: `${defaultClassNames[DayFlag.today]}`,
                            [DayFlag.outside]: `${defaultClassNames[DayFlag.outside]} text-stone-400 opacity-50`,
                            [DayFlag.disabled]: `${defaultClassNames[DayFlag.disabled]} text-stone-400 opacity-50`,
                            [DayFlag.hidden]: `${defaultClassNames[DayFlag.hidden]} invisible`
                        }}
                        formatters={{
                            formatCaption: (date, options) => {
                                return format(date, 'MMMM yyyy', { locale: options?.locale || vi });
                            },
                            formatWeekdayName: (date, options) => {
                                return format(date, 'EEEEEE', { locale: options?.locale || vi });
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default LicenseExpirePicker;

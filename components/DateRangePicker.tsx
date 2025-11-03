
import React, { useState, useEffect, useMemo, useCallback } from 'react';

interface DateRangePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (startDate: string, endDate: string) => void;
    initialStartDate?: string;
    initialEndDate?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ isOpen, onClose, onSelect, initialStartDate, initialEndDate }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const today = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    
    // Parse date string to local date (avoiding timezone issues)
    const parseDateLocal = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setHours(0, 0, 0, 0);
        return date;
    };
    
    const [startDate, setStartDate] = useState<Date | null>(initialStartDate ? parseDateLocal(initialStartDate) : null);
    const [endDate, setEndDate] = useState<Date | null>(initialEndDate ? parseDateLocal(initialEndDate) : null);
    
    const initialViewDate = useMemo(() => {
        const d = initialStartDate ? parseDateLocal(initialStartDate) : new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(1);
        return d;
    }, [initialStartDate]);
    const [viewDate, setViewDate] = useState(initialViewDate);
    
    // Update dates when initial dates change
    useEffect(() => {
        if (initialStartDate) {
            setStartDate(parseDateLocal(initialStartDate));
        }
        if (initialEndDate) {
            setEndDate(parseDateLocal(initialEndDate));
        }
    }, [initialStartDate, initialEndDate]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('body-scroll-lock');
        } else {
            document.body.classList.remove('body-scroll-lock');
        }
        return () => document.body.classList.remove('body-scroll-lock');
    }, [isOpen]);

    const goToNextMonth = () => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + 1);
            return newDate;
        });
    };
    const goToPrevMonth = () => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() - 1);
            return newDate;
        });
    };

    const handleDateClick = (day: Date) => {
        if (day < today) return;

        if (!startDate || (startDate && endDate)) {
            setStartDate(day);
            setEndDate(null);
        } else if (startDate && !endDate) {
            if (day < startDate) {
                setStartDate(day);
            } else {
                setEndDate(day);
            }
        }
    };

    const handleClear = () => {
        setStartDate(null);
        setEndDate(null);
        setHoveredDate(null);
    };

    // Helper function to format date as YYYY-MM-DD in local timezone
    const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleApply = () => {
        if (startDate && !endDate) {
            onSelect(formatDateLocal(startDate), formatDateLocal(startDate));
        } else if (startDate && endDate) {
            onSelect(formatDateLocal(startDate), formatDateLocal(endDate));
        }
        onClose();
    };
    
    const renderMonth = useCallback((dateToRender: Date) => {
        const year = dateToRender.getFullYear();
        const month = dateToRender.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const areDatesEqual = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${month}-${i}`} className="w-10 h-10"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            const isPast = currentDate < today;
            const isStartDate = startDate && areDatesEqual(currentDate, startDate);
            const isEndDate = endDate && areDatesEqual(currentDate, endDate);
            
            let isInRange = false;
            if (startDate && endDate) {
                isInRange = currentDate > startDate && currentDate < endDate;
            } else if (startDate && !endDate && hoveredDate) {
                const start = Math.min(startDate.getTime(), hoveredDate.getTime());
                const end = Math.max(startDate.getTime(), hoveredDate.getTime());
                isInRange = currentDate.getTime() > start && currentDate.getTime() < end;
            }

            let classNames = 'w-10 h-10 flex items-center justify-center transition-colors duration-200';
            
            if (isPast) {
                classNames += ' text-slate-300 cursor-not-allowed';
            } else {
                classNames += ' cursor-pointer text-slate-800';
                if (isStartDate || isEndDate) {
                    classNames += ' bg-violet-600 text-white font-bold rounded-full';
                } else if (isInRange) {
                    classNames += ' bg-violet-100 text-violet-800 rounded-none';
                } else {
                    classNames += ' hover:bg-slate-200 rounded-full';
                }
            }
            
            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(currentDate)}
                    onMouseEnter={() => !isPast && setHoveredDate(currentDate)}
                    disabled={isPast}
                    className={classNames}
                    aria-label={`Select date ${currentDate.toDateString()}`}
                >
                    {day}
                </button>
            );
        }
        
        return (
            <div className="p-4" onMouseLeave={() => setHoveredDate(null)}>
                <h3 className="text-lg font-semibold text-center text-slate-800 mb-4">
                    {dateToRender.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500 font-medium mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">{days}</div>
            </div>
        );
    }, [startDate, endDate, hoveredDate, today]);

    const secondMonthDate = useMemo(() => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        return d;
    }, [viewDate]);

    let nightCount = 0;
    if (startDate && endDate) {
        nightCount = Math.round(Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } else if (startDate && hoveredDate) {
        nightCount = Math.round(Math.abs(hoveredDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4 auth-modal-enter">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs md:max-w-2xl flex flex-col auth-modal-content-enter">
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Select Dates</h2>
                        <p className="text-sm text-slate-500">When is your adventure?</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-900 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                <main className="flex-grow flex items-center justify-between p-2 md:p-4">
                    <button onClick={goToPrevMonth} className="flex-shrink-0 p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    
                    <div className="flex-1 min-w-0 flex justify-center">
                        {renderMonth(viewDate)}
                        {!isMobile && renderMonth(secondMonthDate)}
                    </div>

                    <button onClick={goToNextMonth} className="flex-shrink-0 p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                </main>

                <footer className="flex-shrink-0 bg-slate-50 p-4 border-t border-slate-200 rounded-b-2xl flex items-center justify-between">
                     <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500">
                            {nightCount > 0 ? `${nightCount} ${nightCount === 1 ? 'Night' : 'Nights'}` : 'Select dates'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                         <button onClick={handleClear} className="px-4 py-2 text-sm text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition-colors">Clear</button>
                         <button onClick={handleApply} disabled={!startDate} className="px-6 py-2 bg-violet-600 text-white font-bold rounded-lg transition-colors duration-200 hover:bg-violet-700 disabled:bg-violet-300 disabled:cursor-not-allowed">Apply</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DateRangePicker;

import React, { useEffect } from 'react';

// Reusable Typeahead Selection Page
export interface SelectionPageProps<T> {
  isOpen: boolean;
  title: string;
  items: T[];
  onClose: () => void;
  onSelect: (item: T) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  popularItems?: T[];
  renderPopularItem?: (item: T, index: number) => React.ReactNode;
  accentColor?: 'violet' | 'amber' | 'teal' | 'fuchsia' | 'sky';
  error?: string | null;
}

const SelectionPage = <T extends any>({
  isOpen,
  title,
  items,
  onClose,
  onSelect,
  renderItem,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  isLoading = false,
  popularItems,
  renderPopularItem,
  accentColor = 'violet',
  error,
}: SelectionPageProps<T>) => {

  useEffect(() => {
    const bottomNav = document.querySelector('#bottom-nav-bar');
    const html = document.documentElement;
    const body = document.body;

    if (isOpen) {
      html.classList.add('body-scroll-lock');
      body.classList.add('body-scroll-lock');
      if (bottomNav) (bottomNav as HTMLElement).style.display = 'none';
    } else {
      html.classList.remove('body-scroll-lock');
      body.classList.remove('body-scroll-lock');
      if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
    }
    return () => {
        html.classList.remove('body-scroll-lock');
        body.classList.remove('body-scroll-lock');
        if (bottomNav) (bottomNav as HTMLElement).style.display = 'flex';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const accentColorClasses = {
    violet: 'focus:ring-violet-500 focus:border-violet-500',
    amber: 'focus:ring-amber-500 focus:border-amber-500',
    teal: 'focus:ring-teal-500 focus:border-teal-500',
    fuchsia: 'focus:ring-fuchsia-500 focus:border-fuchsia-500',
    sky: 'focus:ring-sky-500 focus:border-sky-500',
  };
  const focusRingClass = accentColorClasses[accentColor] || accentColorClasses.violet;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col slide-down-animation">
      <header className="flex-shrink-0 flex items-center p-2 border-b border-slate-200 bg-white mt-4">
        <button onClick={onClose} className="p-2 mr-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </header>

      <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-white">
        <div className="relative">
          <svg className="absolute inset-y-0 left-0 pl-3 h-full w-5 text-gray-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`w-full pl-10 pr-4 py-2 bg-slate-100 text-gray-800 border border-slate-200 rounded-lg focus:ring-2 ${focusRingClass} transition`}
          />
        </div>
      </div>

      <main className="flex-grow overflow-y-auto">
        {error ? (
          <div className="p-4 m-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-800 font-medium">{error}</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center p-8 text-slate-600 font-semibold">Loading suggestions...</div>
        ) : searchValue.trim() === '' && popularItems && popularItems.length > 0 && renderPopularItem ? (
            <div>
              <h3 className="p-4 text-sm font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border-b border-slate-200">Popular Searches</h3>
              <ul className="divide-y divide-slate-200">
                  {popularItems.map((item, index) => (
                      <li key={index} onClick={() => onSelect(item)}>
                          {renderPopularItem(item, index)}
                      </li>
                  ))}
              </ul>
            </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {items.map((item, index) => (
              <li key={index} onClick={() => onSelect(item)}>
                {renderItem(item, index)}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
export default SelectionPage;

import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';
import { buildSelectedCategoryString, parseCategoriesAvailable } from '../utils/eventCategories';

/**
 * CategoryPicker (v2)
 * Athletes select one item from each section (any number of sections).
 * Emits selectedCategory string joined by " | " when selection is complete.
 */
const CategoryPicker = ({ categoriesText = '', value = '', onChange = () => {}, className = '' }) => {
  const model = useMemo(() => parseCategoriesAvailable(categoriesText), [categoriesText]);
  const sections = model.sections || [];

  const parseValue = (val) => {
    if (!val || !String(val).trim()) return [];
    return String(val)
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
  };

  const [selected, setSelected] = useState(() => parseValue(value));
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    setSelected(parseValue(value));
  }, [value]);

  const hasCategories = sections.some((s) => (s.items || []).length > 0);
  if (!hasCategories) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500">No categories available for this event.</p>
      </div>
    );
  }

  const isComplete = sections.every((s, idx) => (s.items || []).length === 0 || !!String(selected[idx] || '').trim());

  const selectValue = (sectionIndex, item) => {
    const next = [...selected];
    next[sectionIndex] = item;
    setSelected(next);
    setOpenIndex(null);

    const finalString = buildSelectedCategoryString(sections, next);
    onChange(finalString); // emits '' until complete
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-800">Select Your Category</h4>
          {isComplete && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">✓ Complete</span>
          )}
        </div>
        <p className="text-xs text-gray-600">Choose one option from each section below.</p>
      </div>

      {sections.map((s, idx) => {
        const items = s.items || [];
        if (!items.length) return null;
        const chosen = String(selected[idx] || '').trim();

        return (
          <div key={s.id} className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors">
            <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
                {idx + 1}
              </span>
              {s.label}
              <span className="ml-2 text-red-500 text-xs">*</span>
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className={`w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-lg transition-all ${
                  chosen ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
              >
                <span className={chosen ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {chosen || `Select ${s.label}`}
                </span>
                <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${openIndex === idx ? 'transform rotate-180' : ''}`} />
              </button>

              {openIndex === idx && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpenIndex(null)} />
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                    {items.map((it) => (
                      <button
                        key={`${s.id}-${it}`}
                        type="button"
                        onClick={() => selectValue(idx, it)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                          chosen === it
                            ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{it}</span>
                        {chosen === it && <FaCheck className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}

      {isComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <FaCheck className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">Category Selected!</p>
              <p className="text-base text-green-800 font-mono bg-white px-3 py-2 rounded border border-green-200">
                {buildSelectedCategoryString(sections, selected)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;


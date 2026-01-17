import React, { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaTimes, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { parseCategoriesAvailable, serializeCategoriesAvailable } from '../utils/eventCategories';

/**
 * CategorySelector (v2)
 * - Admin/creator: modern category builder UI (any number of sections + items)
 * - Athlete/public: readOnly display of sections + items
 *
 * Backwards compatible: reads legacy text format; writes JSON v2 format.
 */
const CategorySelector = ({ value = '', onChange = () => {}, className = '', readOnly = false }) => {
  const initialModel = useMemo(() => parseCategoriesAvailable(value), [value]);
  const [model, setModel] = useState(initialModel);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newItemBySection, setNewItemBySection] = useState({}); // { [sectionId]: string }

  useEffect(() => {
    setModel(parseCategoriesAvailable(value));
  }, [value]);

  // Emit changes upward (edit mode only)
  useEffect(() => {
    if (readOnly) return;
    onChange(serializeCategoriesAvailable(model));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, readOnly]);

  const sections = model?.sections || [];

  const addSection = () => {
    const label = newSectionLabel.trim();
    if (!label) return;
    const exists = sections.some((s) => String(s.label).toLowerCase() === label.toLowerCase());
    if (exists) return;
    setModel((prev) => ({
      ...(prev || {}),
      sections: [...(prev?.sections || []), { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, label, items: [] }]
      }));
    setNewSectionLabel('');
  };

  const removeSection = (sectionId) => {
    setModel((prev) => ({
      ...(prev || {}),
      sections: (prev?.sections || []).filter((s) => s.id !== sectionId)
    }));
    setNewItemBySection((prev) => {
      const next = { ...(prev || {}) };
      delete next[sectionId];
      return next;
    });
  };

  const moveSection = (sectionId, dir) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const nextIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    setModel((prev) => ({ ...(prev || {}), sections: copy }));
  };

  const addItem = (sectionId) => {
    const raw = String(newItemBySection?.[sectionId] || '').trim();
    if (!raw) return;
    setModel((prev) => ({
      ...(prev || {}),
      sections: (prev?.sections || []).map((s) => {
        if (s.id !== sectionId) return s;
        const items = Array.from(new Set([...(s.items || []).map((x) => String(x).trim()), raw])).filter(Boolean);
        return { ...s, items };
      })
    }));
    setNewItemBySection((prev) => ({ ...(prev || {}), [sectionId]: '' }));
  };

  const removeItem = (sectionId, item) => {
    setModel((prev) => ({
      ...(prev || {}),
      sections: (prev?.sections || []).map((s) => {
        if (s.id !== sectionId) return s;
        return { ...s, items: (s.items || []).filter((x) => x !== item) };
      })
    }));
  };

  // Read-only display
  if (readOnly) {
    if (!sections.length) {
      return (
        <div className={className}>
          <p className="text-sm text-gray-500 italic">No categories specified for this event.</p>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {sections.map((s) => (
          <div key={s.id}>
            <div className="text-sm font-semibold text-gray-700 mb-2">{s.label}:</div>
              <div className="flex flex-wrap gap-2">
              {(s.items || []).map((it) => (
                  <span
                  key={`${s.id}-${it}`}
                  className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm font-medium border border-blue-100"
                  >
                  {it}
                  </span>
                ))}
              </div>
            </div>
        ))}
        </div>
    );
  }

  // Edit UI
  return (
    <div className={`space-y-5 ${className}`}>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-gray-900">Categories (for athlete registration)</div>
        <div className="text-xs text-gray-700 mt-1">
          Add one or more sections (e.g., Age Group, Stroke, Distance, Gender, Weight Class). Athletes will select one item from each section.
          </div>
      </div>

      {/* Add section */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add category section</label>
        <div className="flex gap-2">
          <input
            value={newSectionLabel}
            onChange={(e) => setNewSectionLabel(e.target.value)}
            placeholder="Section name (e.g., Age Group)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addSection}
            disabled={!newSectionLabel.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <FaPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Tip: Keep section names short and consistent. Example flow: Age Group → Stroke → Distance.
        </div>
      </div>

      {/* Sections */}
      {sections.length ? (
        <div className="space-y-4">
          {sections.map((s, idx) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{s.label}</div>
                  <div className="text-xs text-gray-500 mt-1">Athletes must pick one.</div>
                </div>
                <div className="flex items-center gap-2">
          <button
            type="button"
                    onClick={() => moveSection(s.id, 'up')}
                    disabled={idx === 0}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    title="Move up"
          >
                    <FaArrowUp className="w-3 h-3" />
          </button>
              <button
                type="button"
                    onClick={() => moveSection(s.id, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    title="Move down"
                  >
                    <FaArrowDown className="w-3 h-3" />
              </button>
                <button
                  type="button"
                    onClick={() => removeSection(s.id)}
                    className="p-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                    title="Remove section"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
          </div>
      </div>

              {/* Add item */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Add item</label>
                <div className="flex gap-2">
          <input
                    value={newItemBySection?.[s.id] || ''}
                    onChange={(e) => setNewItemBySection((p) => ({ ...(p || {}), [s.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addItem(s.id);
                      }
                    }}
                    placeholder={`Add an option for "${s.label}"`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
                    onClick={() => addItem(s.id)}
                    disabled={!String(newItemBySection?.[s.id] || '').trim()}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
        </div>

              {/* Items */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(s.items || []).length ? (
                  (s.items || []).map((it) => (
              <span
                      key={`${s.id}-${it}`}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-sm"
              >
                      <span className="text-gray-800">{it}</span>
                <button
                  type="button"
                        onClick={() => removeItem(s.id, it)}
                        className="text-gray-500 hover:text-red-600"
                        title="Remove item"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No items yet — add at least one.</span>
        )}
      </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-600">No sections yet. Add a section above.</div>
      )}
    </div>
  );
};

export default CategorySelector;


import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

/**
 * CategoryPicker Component
 * Allows athletes to select their category from available options
 * Provides dropdown selectors for each category section
 * 
 * @param {string} categoriesText - Categories text from event (e.g., "Age Groups: Group I, Group II | Strokes: Freestyle, Backstroke | Distances: 50m, 100m")
 * @param {string} value - Currently selected category string
 * @param {function} onChange - Callback when selection changes
 * @param {string} className - Additional CSS classes
 */
const CategoryPicker = ({ 
  categoriesText = '', 
  value = '', 
  onChange, 
  className = '' 
}) => {
  // Parse categories text into structured data
  const parseCategories = (text) => {
    if (!text || !text.trim()) {
      return { ageGroups: [], strokes: [], distances: [], labels: {} };
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    const result = { ageGroups: [], strokes: [], distances: [], labels: {} };
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      // Match pattern: "Label: value1, value2, ..."
      const match = line.match(/^([^:]+):\s*(.+)/i);
      if (!match) return;
      
      const label = match[1].trim();
      const values = match[2].split(',').map(v => v.trim()).filter(Boolean);
      
      // Determine which section based on label
      if (lower.includes('age group') || lower.includes('age') || lower.includes('group') || 
          lower.includes('division') || lower.includes('category') || lower.includes('class') ||
          lower.includes('weight')) {
        result.ageGroups = values;
        result.labels.ageGroup = label;
      } else if (lower.includes('stroke') || lower.includes('event type') || 
                 lower.includes('style') || lower.includes('type') || lower.includes('event') ||
                 lower.includes('division')) {
        result.strokes = values;
        result.labels.stroke = label;
      } else if (lower.includes('distance') || lower.includes('length') || 
                 lower.includes('meter') || lower.includes('metre') || lower.includes('km') ||
                 lower.includes('round') || lower.includes('set')) {
        result.distances = values;
        result.labels.distance = label;
      }
    });
    
    return result;
  };

  const categories = parseCategories(categoriesText);
  const hasCategories = categories.ageGroups.length > 0 || categories.strokes.length > 0 || categories.distances.length > 0;

  // Parse current value to extract selected items
  const parseCurrentValue = (val) => {
    if (!val || !val.trim()) return { ageGroup: '', stroke: '', distance: '' };
    
    // Try to parse format: "Group | Stroke | Distance"
    const parts = val.split('|').map(p => p.trim());
    return {
      ageGroup: parts[0] || '',
      stroke: parts[1] || '',
      distance: parts[2] || ''
    };
  };

  const [selected, setSelected] = useState(() => parseCurrentValue(value));
  const [isOpen, setIsOpen] = useState({ ageGroup: false, stroke: false, distance: false });
  const [manualInput, setManualInput] = useState(value && !value.includes('|')); // If value doesn't match format, use manual

  // Update when value prop changes
  useEffect(() => {
    const parsed = parseCurrentValue(value);
    setSelected(parsed);
    setManualInput(value && !value.includes('|'));
  }, [value]);

  // Build formatted category string
  const buildCategoryString = (ageGroup, stroke, distance) => {
    const parts = [];
    if (ageGroup) parts.push(ageGroup);
    if (stroke) parts.push(stroke);
    if (distance) parts.push(distance);
    return parts.join(' | ');
  };

  // Handle selection change
  const handleSelectionChange = (type, selectedValue) => {
    const newSelected = { ...selected, [type]: selectedValue };
    setSelected(newSelected);
    
    const categoryString = buildCategoryString(
      newSelected.ageGroup,
      newSelected.stroke,
      newSelected.distance
    );
    
    onChange(categoryString);
    setIsOpen({ ...isOpen, [type]: false });
  };

  // Toggle dropdown
  const toggleDropdown = (type) => {
    setIsOpen({ ...isOpen, [type]: !isOpen[type] });
  };

  // Switch between manual and selector mode
  const switchToManual = () => {
    setManualInput(true);
    // Keep current value if it exists
  };

  const switchToSelector = () => {
    setManualInput(false);
    // Try to parse current value
    const parsed = parseCurrentValue(value);
    setSelected(parsed);
  };

  if (!hasCategories) {
    return (
      <div className={className}>
        <p className="text-sm text-gray-500 italic">No categories available for this event.</p>
      </div>
    );
  }

  if (manualInput) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Selected Category <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <button
            type="button"
            onClick={switchToSelector}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Use Selector
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
          placeholder="e.g., Group II (13-14) | Freestyle | 50m"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Age Groups Selector */}
      {categories.ageGroups.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {categories.labels.ageGroup || 'Age Group'} <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('ageGroup')}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex items-center justify-between"
            >
              <span className={selected.ageGroup ? 'text-gray-900' : 'text-gray-500'}>
                {selected.ageGroup || `Select ${categories.labels.ageGroup || 'Age Group'}`}
              </span>
              <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen.ageGroup ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isOpen.ageGroup && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOpen({ ...isOpen, ageGroup: false })}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectionChange('ageGroup', '')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      !selected.ageGroup ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>None</span>
                    {!selected.ageGroup && <FaCheck className="w-4 h-4" />}
                  </button>
                  {categories.ageGroups.map((group, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('ageGroup', group)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        selected.ageGroup === group ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{group}</span>
                      {selected.ageGroup === group && <FaCheck className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Strokes/Event Types Selector */}
      {categories.strokes.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {categories.labels.stroke || 'Stroke / Event Type'} <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('stroke')}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex items-center justify-between"
            >
              <span className={selected.stroke ? 'text-gray-900' : 'text-gray-500'}>
                {selected.stroke || `Select ${categories.labels.stroke || 'Stroke / Event Type'}`}
              </span>
              <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen.stroke ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isOpen.stroke && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOpen({ ...isOpen, stroke: false })}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectionChange('stroke', '')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      !selected.stroke ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>None</span>
                    {!selected.stroke && <FaCheck className="w-4 h-4" />}
                  </button>
                  {categories.strokes.map((stroke, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('stroke', stroke)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        selected.stroke === stroke ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{stroke}</span>
                      {selected.stroke === stroke && <FaCheck className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Distances Selector */}
      {categories.distances.length > 0 && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {categories.labels.distance || 'Distance'} <span className="text-gray-500 text-xs font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('distance')}
              className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex items-center justify-between"
            >
              <span className={selected.distance ? 'text-gray-900' : 'text-gray-500'}>
                {selected.distance || `Select ${categories.labels.distance || 'Distance'}`}
              </span>
              <FaChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen.distance ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isOpen.distance && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsOpen({ ...isOpen, distance: false })}
                />
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  <button
                    type="button"
                    onClick={() => handleSelectionChange('distance', '')}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      !selected.distance ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <span>None</span>
                    {!selected.distance && <FaCheck className="w-4 h-4" />}
                  </button>
                  {categories.distances.map((distance, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('distance', distance)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                        selected.distance === distance ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{distance}</span>
                      {selected.distance === distance && <FaCheck className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview of selected category */}
      {(selected.ageGroup || selected.stroke || selected.distance) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs font-medium text-blue-900 mb-1">Selected Category:</p>
          <p className="text-sm text-blue-800 font-semibold">
            {buildCategoryString(selected.ageGroup, selected.stroke, selected.distance)}
          </p>
        </div>
      )}

      {/* Manual input option */}
      <div className="mt-2">
        <button
          type="button"
          onClick={switchToManual}
          className="text-xs text-gray-600 hover:text-gray-800 underline"
        >
          Or enter manually
        </button>
      </div>
    </div>
  );
};

export default CategoryPicker;


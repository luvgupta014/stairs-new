import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaCheck, FaInfoCircle } from 'react-icons/fa';

/**
 * CategoryPicker Component - Redesigned for better UX
 * Modern, clean interface for athletes to select their category
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
      const match = line.match(/^([^:]+):\s*(.+)/i);
      if (!match) return;
      
      const label = match[1].trim();
      const values = match[2].split(',').map(v => v.trim()).filter(Boolean);
      
      if (lower.includes('age group') || lower.includes('age') || lower.includes('group') || 
          lower.includes('division') || lower.includes('category') || lower.includes('class') ||
          lower.includes('weight')) {
        result.ageGroups = values;
        result.labels.ageGroup = label;
      } else if (lower.includes('stroke') || lower.includes('event type') || 
                 lower.includes('style') || lower.includes('type') || lower.includes('event')) {
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
    const parts = val.split('|').map(p => p.trim());
    return {
      ageGroup: parts[0] || '',
      stroke: parts[1] || '',
      distance: parts[2] || ''
    };
  };

  const [selected, setSelected] = useState(() => parseCurrentValue(value));
  const [isOpen, setIsOpen] = useState({ ageGroup: false, stroke: false, distance: false });
  const [manualInput, setManualInput] = useState(false);

  useEffect(() => {
    const parsed = parseCurrentValue(value);
    setSelected(parsed);
  }, [value]);

  const buildCategoryString = (ageGroup, stroke, distance) => {
    const parts = [];
    if (ageGroup) parts.push(ageGroup);
    if (stroke) parts.push(stroke);
    if (distance) parts.push(distance);
    return parts.join(' | ');
  };

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

  const toggleDropdown = (type) => {
    setIsOpen({ ...isOpen, [type]: !isOpen[type] });
  };

  if (!hasCategories) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-sm text-gray-500">No categories available for this event.</p>
      </div>
    );
  }

  if (manualInput) {
    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            Enter Category Manually
          </label>
          <button
            type="button"
            onClick={() => setManualInput(false)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Use Selector
          </button>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
          placeholder="e.g., Group II (13-14) | Freestyle | 50m"
        />
        <p className="mt-2 text-xs text-gray-500 flex items-center">
          <FaInfoCircle className="mr-1" />
          Format: Age Group | Stroke/Event Type | Distance
        </p>
      </div>
    );
  }

  const isComplete = (categories.ageGroups.length === 0 || selected.ageGroup) &&
                     (categories.strokes.length === 0 || selected.stroke) &&
                     (categories.distances.length === 0 || selected.distance);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Step-by-step selection with visual progress */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800">Select Your Category</h4>
          {isComplete && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              ✓ Complete
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Choose one option from each section below to build your category
        </p>
      </div>

      {/* Age Groups - Card Style */}
      {categories.ageGroups.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
              1
            </span>
            {categories.labels.ageGroup || 'Age Group'}
            <span className="ml-2 text-red-500 text-xs">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('ageGroup')}
              className={`w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-lg transition-all ${
                selected.ageGroup 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
            >
              <span className={selected.ageGroup ? 'text-gray-900 font-medium' : 'text-gray-500'}>
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
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {categories.ageGroups.map((group, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('ageGroup', group)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                        selected.ageGroup === group 
                          ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{group}</span>
                      {selected.ageGroup === group && <FaCheck className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Strokes/Event Types - Card Style */}
      {categories.strokes.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
              2
            </span>
            {categories.labels.stroke || 'Stroke / Event Type'}
            <span className="ml-2 text-red-500 text-xs">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('stroke')}
              className={`w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-lg transition-all ${
                selected.stroke 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
            >
              <span className={selected.stroke ? 'text-gray-900 font-medium' : 'text-gray-500'}>
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
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {categories.strokes.map((stroke, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('stroke', stroke)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                        selected.stroke === stroke 
                          ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{stroke}</span>
                      {selected.stroke === stroke && <FaCheck className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Distances - Card Style */}
      {categories.distances.length > 0 && (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-blue-300 transition-colors">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mr-2">
              3
            </span>
            {categories.labels.distance || 'Distance'}
            <span className="ml-2 text-red-500 text-xs">*</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('distance')}
              className={`w-full px-4 py-3 text-left bg-gray-50 border-2 rounded-lg transition-all ${
                selected.distance 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between`}
            >
              <span className={selected.distance ? 'text-gray-900 font-medium' : 'text-gray-500'}>
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
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
                  {categories.distances.map((distance, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectionChange('distance', distance)}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                        selected.distance === distance 
                          ? 'bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-500' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{distance}</span>
                      {selected.distance === distance && <FaCheck className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected Category Preview - Enhanced */}
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
                {buildCategoryString(selected.ageGroup, selected.stroke, selected.distance)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual input option - Better styling */}
      <div className="pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setManualInput(true)}
          className="text-sm text-gray-600 hover:text-blue-600 font-medium flex items-center"
        >
          <FaInfoCircle className="mr-2" />
          Need a custom category? Enter manually
        </button>
      </div>
    </div>
  );
};

export default CategoryPicker;

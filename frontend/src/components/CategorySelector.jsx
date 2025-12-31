import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

/**
 * CategorySelector Component
 * Provides an easy-to-use interface for adding event categories
 * Replaces the free-form textarea with structured inputs
 * 
 * @param {string} value - Current categories text value
 * @param {function} onChange - Callback when categories change
 * @param {string} className - Additional CSS classes
 * @param {string} ageGroupLabel - Custom label for age groups section (default: "Age Groups")
 * @param {string} strokeLabel - Custom label for strokes section (default: "Strokes / Event Types")
 * @param {string} distanceLabel - Custom label for distances section (default: "Distances")
 */
const CategorySelector = ({ 
  value = '', 
  onChange, 
  className = '',
  ageGroupLabel = 'Age Groups',
  strokeLabel = 'Strokes / Event Types',
  distanceLabel = 'Distances'
}) => {
  // Parse existing value into structured data (flexible parsing for different label names)
  const parseCategories = (text) => {
    if (!text) return { ageGroups: [], strokes: [], distances: [] };
    
    const lines = text.split('\n').filter(line => line.trim());
    const result = { ageGroups: [], strokes: [], distances: [] };
    
    lines.forEach(line => {
      const lower = line.toLowerCase();
      // Flexible parsing - check for common variations
      // Age Groups section (first section typically)
      if (lower.includes('age group') || lower.includes('age') || lower.includes('group') || 
          lower.includes('division') || lower.includes('category') || lower.includes('class')) {
        // Match pattern: "Label: value1, value2, ..."
        const match = line.match(/^[^:]+:\s*(.+)/i);
        if (match && !result.ageGroups.length) { // Only if not already filled
          result.ageGroups = match[1].split(',').map(g => g.trim()).filter(Boolean);
        }
      } 
      // Strokes/Event Types section (middle section typically)
      else if (lower.includes('stroke') || lower.includes('event type') || 
               lower.includes('style') || lower.includes('type') || lower.includes('event')) {
        const match = line.match(/^[^:]+:\s*(.+)/i);
        if (match && !result.strokes.length) {
          result.strokes = match[1].split(',').map(s => s.trim()).filter(Boolean);
        }
      } 
      // Distances section (last section typically)
      else if (lower.includes('distance') || lower.includes('length') || 
               lower.includes('meter') || lower.includes('metre') || lower.includes('km')) {
        const match = line.match(/^[^:]+:\s*(.+)/i);
        if (match && !result.distances.length) {
          result.distances = match[1].split(',').map(d => d.trim()).filter(Boolean);
        }
      }
      // Fallback: if line has ":" and values, try to parse
      else if (line.includes(':')) {
        const match = line.match(/^([^:]+):\s*(.+)/i);
        if (match) {
          const label = match[1].trim().toLowerCase();
          const values = match[2].split(',').map(v => v.trim()).filter(Boolean);
          
          // Try to categorize based on label
          if (!result.ageGroups.length && (label.includes('age') || label.includes('group') || label.includes('division'))) {
            result.ageGroups = values;
          } else if (!result.strokes.length && (label.includes('stroke') || label.includes('type') || label.includes('event'))) {
            result.strokes = values;
          } else if (!result.distances.length && (label.includes('distance') || label.includes('length'))) {
            result.distances = values;
          }
        }
      }
    });
    
    return result;
  };

  const [categories, setCategories] = useState(() => parseCategories(value));
  const [newAgeGroup, setNewAgeGroup] = useState('');
  const [newStroke, setNewStroke] = useState('');
  const [newDistance, setNewDistance] = useState('');
  const [showCustomNames, setShowCustomNames] = useState(false);
  const [customAgeGroupLabel, setCustomAgeGroupLabel] = useState(ageGroupLabel);
  const [customStrokeLabel, setCustomStrokeLabel] = useState(strokeLabel);
  const [customDistanceLabel, setCustomDistanceLabel] = useState(distanceLabel);
  
  // Use custom labels if set, otherwise use props
  const finalAgeGroupLabel = customAgeGroupLabel || ageGroupLabel;
  const finalStrokeLabel = customStrokeLabel || strokeLabel;
  const finalDistanceLabel = customDistanceLabel || distanceLabel;

  // Update when value prop changes
  useEffect(() => {
    if (value) {
      setCategories(parseCategories(value));
    }
  }, [value]);

  // Format categories back to text (using custom labels if provided)
  const formatCategories = (cats) => {
    const parts = [];
    if (cats.ageGroups.length > 0) {
      parts.push(`${finalAgeGroupLabel}: ${cats.ageGroups.join(', ')}`);
    }
    if (cats.strokes.length > 0) {
      parts.push(`${finalStrokeLabel}: ${cats.strokes.join(', ')}`);
    }
    if (cats.distances.length > 0) {
      parts.push(`${finalDistanceLabel}: ${cats.distances.join(', ')}`);
    }
    return parts.join('\n');
  };

  // Update parent when categories change
  useEffect(() => {
    const formatted = formatCategories(categories);
    onChange(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const addAgeGroup = () => {
    if (newAgeGroup.trim() && !categories.ageGroups.includes(newAgeGroup.trim())) {
      setCategories(prev => ({
        ...prev,
        ageGroups: [...prev.ageGroups, newAgeGroup.trim()]
      }));
      setNewAgeGroup('');
    }
  };

  const removeAgeGroup = (group) => {
    setCategories(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.filter(g => g !== group)
    }));
  };

  const addStroke = () => {
    if (newStroke.trim() && !categories.strokes.includes(newStroke.trim())) {
      setCategories(prev => ({
        ...prev,
        strokes: [...prev.strokes, newStroke.trim()]
      }));
      setNewStroke('');
    }
  };

  const removeStroke = (stroke) => {
    setCategories(prev => ({
      ...prev,
      strokes: prev.strokes.filter(s => s !== stroke)
    }));
  };

  const addDistance = () => {
    if (newDistance.trim() && !categories.distances.includes(newDistance.trim())) {
      setCategories(prev => ({
        ...prev,
        distances: [...prev.distances, newDistance.trim()]
      }));
      setNewDistance('');
    }
  };

  const removeDistance = (distance) => {
    setCategories(prev => ({
      ...prev,
      distances: prev.distances.filter(d => d !== distance)
    }));
  };

  // Common strokes for swimming
  const commonStrokes = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'Individual Medley'];
  const commonDistances = ['25m', '50m', '100m', '200m', '400m', '800m', '1500m'];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Custom Section Names Toggle */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setShowCustomNames(!showCustomNames)}
          className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
        >
          {showCustomNames ? '▼' : '▶'} Customize Section Names
        </button>
        {showCustomNames && (
          <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                First Section Name (default: "Age Groups")
              </label>
              <input
                type="text"
                value={customAgeGroupLabel}
                onChange={(e) => setCustomAgeGroupLabel(e.target.value)}
                placeholder="e.g., Weight Classes, Age Divisions, Categories"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Second Section Name (default: "Strokes / Event Types")
              </label>
              <input
                type="text"
                value={customStrokeLabel}
                onChange={(e) => setCustomStrokeLabel(e.target.value)}
                placeholder="e.g., Divisions, Event Categories, Match Types"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Third Section Name (default: "Distances")
              </label>
              <input
                type="text"
                value={customDistanceLabel}
                onChange={(e) => setCustomDistanceLabel(e.target.value)}
                placeholder="e.g., Rounds, Sets, Attempts, Lengths"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Customize section names to match your sport's terminology. Leave empty to use defaults.
            </p>
          </div>
        )}
      </div>

      {/* Age Groups Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {finalAgeGroupLabel}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newAgeGroup}
            onChange={(e) => setNewAgeGroup(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAgeGroup())}
            placeholder="Type any age group (e.g., Group I (11-12), U-14, Senior, etc.)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
          <button
            type="button"
            onClick={addAgeGroup}
            disabled={!newAgeGroup.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          💡 You can add any custom {finalAgeGroupLabel.toLowerCase()}. Examples: "Group I (11-12)", "U-14", "Senior (18+)", "Open Category", or any format you need
        </p>
        {categories.ageGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.ageGroups.map((group, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {group}
                <button
                  type="button"
                  onClick={() => removeAgeGroup(group)}
                  className="hover:text-blue-600 focus:outline-none"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Strokes/Event Types Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {finalStrokeLabel}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newStroke}
            onChange={(e) => setNewStroke(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStroke())}
            placeholder="Type any stroke or event type (e.g., Freestyle, Relay, Mixed, etc.)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
          <button
            type="button"
            onClick={addStroke}
            disabled={!newStroke.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          💡 Quick-add common items below, or type any custom {finalStrokeLabel.toLowerCase()} above (e.g., "Relay", "Mixed", "Synchronized")
        </p>
        {/* Quick add buttons for common strokes */}
        <div className="mb-2 flex flex-wrap gap-2">
          {commonStrokes.map(stroke => (
            !categories.strokes.includes(stroke) && (
              <button
                key={stroke}
                type="button"
                onClick={() => {
                  setCategories(prev => ({
                    ...prev,
                    strokes: [...prev.strokes, stroke]
                  }));
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                + {stroke}
              </button>
            )
          ))}
        </div>
        {categories.strokes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.strokes.map((stroke, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {stroke}
                <button
                  type="button"
                  onClick={() => removeStroke(stroke)}
                  className="hover:text-purple-600 focus:outline-none"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Distances Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {finalDistanceLabel}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newDistance}
            onChange={(e) => setNewDistance(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDistance())}
            placeholder="Type any distance (e.g., 50m, 100m, 1km, Marathon, etc.)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
          />
          <button
            type="button"
            onClick={addDistance}
            disabled={!newDistance.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus className="w-3 h-3" />
            Add
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-2">
          💡 Quick-add common items below, or type any custom {finalDistanceLabel.toLowerCase()} above (e.g., "1km", "Marathon", "Sprint", or any format you need)
        </p>
        {/* Quick add buttons for common distances */}
        <div className="mb-2 flex flex-wrap gap-2">
          {commonDistances.map(distance => (
            !categories.distances.includes(distance) && (
              <button
                key={distance}
                type="button"
                onClick={() => {
                  setCategories(prev => ({
                    ...prev,
                    distances: [...prev.distances, distance]
                  }));
                }}
                className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
              >
                + {distance}
              </button>
            )
          ))}
        </div>
        {categories.distances.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.distances.map((distance, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {distance}
                <button
                  type="button"
                  onClick={() => removeDistance(distance)}
                  className="hover:text-green-600 focus:outline-none"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {categories.ageGroups.length > 0 || categories.strokes.length > 0 || categories.distances.length > 0 ? (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Preview (as athletes will see it):</p>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">
            {formatCategories(categories)}
          </pre>
        </div>
      ) : (
        <p className="text-xs text-gray-500 mt-2">
          Add categories above. This information will be displayed to athletes during registration.
        </p>
      )}
    </div>
  );
};

export default CategorySelector;


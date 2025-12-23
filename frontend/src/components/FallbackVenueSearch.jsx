import React, { useState, useRef, useEffect } from "react";
import { FaMapMarkerAlt, FaExclamationTriangle, FaSearch } from "react-icons/fa";
import api from '../api';

const FallbackVenueSearch = ({
  onPlaceSelect,
  placeholder = "Enter venue name or address...",
  value = "",
  onChange,
  className = "",
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search function
  const searchPlaces = async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // NOTE: backend mounts this router at /api/maps (see backend/src/index.js)
      const response = await api.get(`/api/maps/places/autocomplete?input=${encodeURIComponent(query)}`);
      
      if (response.data.predictions) {
        setSuggestions(response.data.predictions);
        setShowSuggestions(true);
        // This is still "smart" search, just server-powered.
        setIsUsingFallback(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsUsingFallback(true);
      }
    } catch (error) {
      console.error('Place search error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Update input value immediately
    const syntheticEvent = {
      target: {
        name: "venue",
        value: inputValue,
      },
    };
    onChange?.(syntheticEvent);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(inputValue);
    }, 300);
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion) => {
    try {
      setIsLoading(true);
      
      // Get place details
      const response = await api.get(`/api/maps/places/details?place_id=${suggestion.place_id}`);
      
      if (response.data.result) {
        const place = response.data.result;
        
        const placeData = {
          placeId: place.place_id,
          name: place.name || suggestion.description,
          address: place.formatted_address || suggestion.description,
          latitude: place.geometry?.location?.lat || 0,
          longitude: place.geometry?.location?.lng || 0,
          city: "",
          state: "",
          country: "",
        };

        // Parse address components if available
        if (place.address_components) {
          place.address_components.forEach((component) => {
            const types = component.types;
            
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
              placeData.city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              placeData.state = component.long_name;
            } else if (types.includes("country")) {
              placeData.country = component.long_name;
            }
          });
        }

        onPlaceSelect?.(placeData);
        
        // Update input with selected value
        const syntheticEvent = {
          target: {
            name: "venue",
            value: place.formatted_address || suggestion.description,
          },
        };
        onChange?.(syntheticEvent);
      }
    } catch (error) {
      console.error('Place details error:', error);
      
      // Fallback: use basic suggestion data
      const basicPlaceData = {
        placeId: suggestion.place_id,
        name: suggestion.structured_formatting?.main_text || suggestion.description,
        address: suggestion.description,
        latitude: 0,
        longitude: 0,
        city: "",
        state: "",
        country: "",
      };
      
      onPlaceSelect?.(basicPlaceData);
      
      const syntheticEvent = {
        target: {
          name: "venue",
          value: suggestion.description,
        },
      };
      onChange?.(syntheticEvent);
    } finally {
      setIsLoading(false);
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={isUsingFallback ? `${placeholder} (Manual input)` : placeholder}
        className={`${className} pr-10`}
        disabled={disabled}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        ) : isUsingFallback ? (
          <FaExclamationTriangle
            className="text-amber-500 w-4 h-4"
            title="Using manual input mode"
          />
        ) : (
          <FaMapMarkerAlt
            className="text-green-500 w-4 h-4"
            title="Smart venue search active"
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.place_id}-${index}`}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-gray-400 w-4 h-4 mt-1 mr-3 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting?.main_text || suggestion.description}
                  </div>
                  {suggestion.structured_formatting?.secondary_text && (
                    <div className="text-sm text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status messages */}
      {isUsingFallback && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          <div className="flex items-start">
            <FaExclamationTriangle className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Venue suggestions unavailable</p>
              <p className="mt-1">
                Type the venue manually, or check backend `/api/maps/*` configuration (server key/billing).
              </p>
            </div>
          </div>
        </div>
      )}

      {!isUsingFallback && !isLoading && value && value.length >= 3 && suggestions.length === 0 && (
        <div className="mt-1 text-xs text-gray-500">
          Start typing to see venue suggestions
        </div>
      )}
    </div>
  );
};

export default FallbackVenueSearch;
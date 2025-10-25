import React, { useState } from "react";
import { FaMapMarkerAlt, FaGlobe, FaBuilding } from "react-icons/fa";

const SimpleVenueInput = ({
  onPlaceSelect,
  placeholder = "Enter venue name or address...",
  value = "",
  onChange,
  className = "",
  disabled = false,
}) => {
  const [venueDetails, setVenueDetails] = useState({
    name: value || "",
    address: "",
    city: "",
    state: "",
    country: "",
  });

  const handleInputChange = (field, inputValue) => {
    const updated = { ...venueDetails, [field]: inputValue };
    setVenueDetails(updated);
    
    // For the main input, also call onChange if provided
    if (field === 'name' && onChange) {
      onChange({ target: { value: inputValue } });
    }

    // Create a formatted address for the callback
    const formattedAddress = [
      updated.name,
      updated.address,
      updated.city,
      updated.state,
      updated.country
    ].filter(Boolean).join(", ");

    // Call onPlaceSelect with the formatted data
    if (onPlaceSelect && formattedAddress.trim()) {
      onPlaceSelect({
        formatted_address: formattedAddress,
        name: updated.name,
        place_id: `manual_${Date.now()}`, // Generate a simple ID
        geometry: {
          location: {
            lat: () => 0, // Default coordinates
            lng: () => 0,
          }
        },
        address_components: [
          { long_name: updated.city, types: ["locality"] },
          { long_name: updated.state, types: ["administrative_area_level_1"] },
          { long_name: updated.country, types: ["country"] }
        ]
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Main venue name input */}
      <div className="relative">
        <input
          type="text"
          value={venueDetails.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder={placeholder}
          className={`${className} pr-10`}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <FaBuilding className="text-blue-500 w-4 h-4" title="Venue name" />
        </div>
      </div>

      {/* Additional address fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            value={venueDetails.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Street address (optional)"
            className={`${className} pr-10`}
            disabled={disabled}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <FaMapMarkerAlt className="text-green-500 w-4 h-4" title="Address" />
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={venueDetails.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="City (optional)"
            className={`${className} pr-10`}
            disabled={disabled}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <FaGlobe className="text-purple-500 w-4 h-4" title="City" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={venueDetails.state}
          onChange={(e) => handleInputChange('state', e.target.value)}
          placeholder="State/Province (optional)"
          className={className}
          disabled={disabled}
        />

        <input
          type="text"
          value={venueDetails.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          placeholder="Country (optional)"
          className={className}
          disabled={disabled}
        />
      </div>

      {/* Information message */}
      <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded p-2">
        <div className="flex items-start">
          <FaBuilding className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">Manual venue entry</p>
            <p className="mt-1">
              Enter the venue name (required) and additional address details as needed. 
              Only the venue name is required to create the event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleVenueInput;
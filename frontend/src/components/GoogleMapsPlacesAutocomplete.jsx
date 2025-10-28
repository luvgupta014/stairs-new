import React, { useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";

const GoogleMapsPlacesAutocomplete = ({
  onPlaceSelect,
  placeholder = "Enter venue name or address...",
  value = "",
  onChange,
  className = "",
  disabled = false,
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const scriptLoadedRef = useRef(false);

  const checkGoogleMapsAvailability = () => {
    return (
      window.google &&
      window.google.maps &&
      window.google.maps.places &&
      window.google.maps.places.Autocomplete
    );
  };

  const initializeAutocomplete = () => {
    console.log("Attempting to initialize autocomplete...");

    if (!inputRef.current) {
      console.error("Input ref not available. Initialization aborted.");
      setLoadError("Input field not found. Please refresh the page.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    if (!checkGoogleMapsAvailability()) {
      console.error("Google Maps dependencies not available", {
        google: !!window.google,
        maps: !!window.google?.maps,
        places: !!window.google?.maps?.places,
        Autocomplete: !!window.google?.maps?.places?.Autocomplete,
      });
      setLoadError("Google Maps API not properly loaded.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    try {
      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["establishment", "geocode"],
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "address_components",
            "geometry",
            "types",
          ],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        console.log("Place changed:", place);

        if (!place.geometry) {
          console.log("No geometry available for:", place.name);
          return;
        }

        // Extract place details
        const placeData = {
          placeId: place.place_id,
          name: place.name || "",
          address: place.formatted_address || "",
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
          city: "",
          state: "",
          country: "",
        };

        // Parse address components
        if (place.address_components) {
          place.address_components.forEach((component) => {
            const types = component.types;

            if (
              types.includes("locality") ||
              types.includes("administrative_area_level_2")
            ) {
              placeData.city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              placeData.state = component.long_name;
            } else if (types.includes("country")) {
              placeData.country = component.long_name;
            }
          });
        }

        console.log("Extracted place data:", placeData);
        onPlaceSelect?.(placeData);
      });

      console.log("Autocomplete initialized successfully");
      setIsLoaded(true);
    } catch (error) {
      console.error("Autocomplete initialization error:", error);
      setLoadError("Failed to initialize autocomplete.");
      setIsManualMode(true);
      setIsLoaded(true);
    }
  };

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key not found. Manual input mode enabled.");
      setLoadError("Google Maps API not available. Please enter address manually.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    // Check if already loaded
    if (checkGoogleMapsAvailability()) {
      console.log("Google Maps already available");
      initializeAutocomplete();
      return;
    }

    // Check if script is already loading/loaded
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript && !scriptLoadedRef.current) {
      console.log("Google Maps script already exists, waiting for load...");

      existingScript.addEventListener("load", () => {
        scriptLoadedRef.current = true;
        initializeAutocomplete();
      });

      existingScript.addEventListener("error", () => {
        console.error("Failed to load Google Maps script");
        setLoadError("Failed to load Google Maps script.");
        setIsManualMode(true);
        setIsLoaded(true);
      });

      return;
    }

    if (scriptLoadedRef.current) {
      return; // Already loaded by this instance
    }

    console.log("Loading Google Maps script...");

    // Create unique callback name to avoid conflicts
    const callbackName = `initGoogleMaps_${Date.now()}`;

    window[callbackName] = () => {
      console.log("Google Maps callback triggered");
      scriptLoadedRef.current = true;
      initializeAutocomplete();
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      setLoadError("Failed to load Google Maps script.");
      setIsManualMode(true);
      setIsLoaded(true);
      delete window[callbackName];
    };

    document.head.appendChild(script);
  };

  useEffect(() => {
    loadGoogleMaps();

    // Wait for the input element to mount before initializing autocomplete
    const observer = new MutationObserver(() => {
      if (inputRef.current) {
        observer.disconnect();
        initializeAutocomplete();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Cleanup
    return () => {
      observer.disconnect();
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    const syntheticEvent = {
      target: {
        name: "venue",
        value: e.target.value,
      },
    };
    onChange?.(syntheticEvent);
  };

  if (!isLoaded) {
    return (
      <div className="relative">
        <input
          type="text"
          className={`${className} opacity-50`}
          placeholder="Loading Google Maps..."
          disabled
          value=""
          readOnly
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={
          isManualMode ? `${placeholder} (Manual input)` : placeholder
        }
        className={`${className} ${isManualMode ? "pr-10" : "pr-8"}`}
        disabled={disabled}
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center">
        {isManualMode ? (
          <FaExclamationTriangle
            className="text-amber-500 w-4 h-4"
            title="Google Maps unavailable - using manual input"
          />
        ) : (
          <FaMapMarkerAlt
            className="text-green-500 w-4 h-4"
            title="Smart venue search enabled"
          />
        )}
      </div>

      {loadError && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          <div className="flex items-start">
            <FaExclamationTriangle className="w-3 h-3 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Smart search unavailable</p>
              <p className="mt-1">{loadError}</p>
              <p className="mt-1 text-amber-700">
                💡 <strong>Ad Blocker Detected:</strong> Smart venue search is blocked. Please disable ad blocker for this site, or continue with manual entry below.
              </p>
              <p className="mt-1 text-green-700">
                ✓ <strong>Manual Mode Active:</strong> You can still enter complete venue details manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isManualMode && !loadError && (
        <div className="mt-1 text-xs text-green-600">
          Start typing to see venue suggestions from Google Maps
        </div>
      )}
    </div>
  );
};

export default GoogleMapsPlacesAutocomplete;

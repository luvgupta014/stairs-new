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

  // ✅ Check Maps availability
  const checkGoogleMapsAvailability = () =>
    window.google?.maps?.places?.Autocomplete;

  // ✅ Initialize Autocomplete
  const initializeAutocomplete = () => {
    console.log("Attempting to initialize autocomplete...");

    if (!inputRef.current) {
      console.error("❌ Input ref not available.");
      setLoadError("Input field not found. Please refresh.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    if (!checkGoogleMapsAvailability()) {
      console.error("❌ Google Maps dependencies not available.");
      setLoadError("Google Maps API not properly loaded.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    try {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
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
          ],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

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

        if (place.address_components) {
          place.address_components.forEach((c) => {
            if (c.types.includes("locality")) placeData.city = c.long_name;
            if (c.types.includes("administrative_area_level_1"))
              placeData.state = c.long_name;
            if (c.types.includes("country")) placeData.country = c.long_name;
          });
        }

        console.log("✅ Place selected:", placeData);
        onPlaceSelect?.(placeData);
      });

      console.log("✅ Autocomplete initialized");
      setIsLoaded(true);
    } catch (err) {
      console.error("❌ Autocomplete initialization error:", err);
      setLoadError("Failed to initialize autocomplete.");
      setIsManualMode(true);
      setIsLoaded(true);
    }
  };

  // ✅ Load Google Maps script safely
  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("❌ Google Maps API key missing.");
      setLoadError("Google Maps API not configured.");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    if (checkGoogleMapsAvailability()) {
      console.log("✅ Google Maps already available.");
      initializeAutocomplete();
      return;
    }

    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );
    if (existingScript) {
      console.log("⚙️ Script already exists — waiting for it to finish loading...");
      existingScript.addEventListener("load", initializeAutocomplete);
      return;
    }

    console.log("🚀 Injecting new Google Maps script...");
    const callbackName = `initGoogleMaps_${Date.now()}`;

    window[callbackName] = () => {
      console.log("✅ Google Maps callback triggered.");
      setTimeout(() => {
        if (inputRef.current) {
          initializeAutocomplete();
        } else {
          const wait = setInterval(() => {
            if (inputRef.current) {
              clearInterval(wait);
              initializeAutocomplete();
            }
          }, 300);
          setTimeout(() => clearInterval(wait), 5000);
        }
      }, 100);
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.error("❌ Failed to load Google Maps script.");
      setLoadError("Failed to load Google Maps API.");
      setIsManualMode(true);
      setIsLoaded(true);
      delete window[callbackName];
    };

    document.head.appendChild(script);

    // ⏳ Safety timeout (prevents endless loading)
    setTimeout(() => {
      if (!window.google?.maps?.places && !isLoaded) {
        console.warn("⚠️ Timeout: switching to manual mode.");
        setIsManualMode(true);
        setIsLoaded(true);
      }
    }, 10000);
  };

  // ✅ Effect: run once
  useEffect(() => {
    loadGoogleMaps();

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
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
            title="Manual input mode - Google Maps unavailable"
          />
        ) : (
          <FaMapMarkerAlt
            className="text-green-500 w-4 h-4"
            title="Smart venue search enabled"
          />
        )}
      </div>

      {!isManualMode && !loadError && (
        <div className="mt-1 text-xs text-green-600">
          Start typing to see venue suggestions from Google Maps
        </div>
      )}
    </div>
  );
};

export default GoogleMapsPlacesAutocomplete;
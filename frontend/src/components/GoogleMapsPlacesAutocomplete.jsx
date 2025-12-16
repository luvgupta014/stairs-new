import React, { useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
import FallbackVenueSearch from "./FallbackVenueSearch";

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
  const [isApiReady, setIsApiReady] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const checkGoogleMapsAvailability = () =>
    window.google?.maps?.places?.Autocomplete;

  const initializeAutocomplete = () => {
    console.log("🔧 Initializing autocomplete with input:", inputRef.current);

    if (!inputRef.current) {
      console.error("❌ Input ref not available");
      return;
    }

    if (!checkGoogleMapsAvailability()) {
      console.error("❌ Google Maps API not available");
      setLoadError("Google Maps API not properly loaded.");
      setIsManualMode(true);
      return;
    }

    try {
      // Clear existing listener
      if (autocompleteRef.current && window.google?.maps?.event) {
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
          ],
        }
      );

      autocompleteRef.current = autocomplete;

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        console.log("📍 Place changed:", place);

        if (!place.geometry) {
          console.warn("⚠️ No geometry for place");
          return;
        }

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

      console.log("✅ Autocomplete initialized successfully");
    } catch (err) {
      console.error("❌ Autocomplete initialization error:", err);
      setLoadError(`Failed to initialize: ${err.message}`);
      setIsManualMode(true);
    }
  };

  // Effect to initialize autocomplete when both API and input are ready
  useEffect(() => {
    if (isApiReady && inputRef.current && !autocompleteRef.current) {
      console.log("🎯 Both API and input ready - initializing");
      initializeAutocomplete();
    }
  }, [isApiReady, inputRef.current]);

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    console.log("🔍 Environment check:");
    console.log("- API Key exists:", !!apiKey);
    console.log("- Current domain:", window.location.hostname);
    console.log("- Protocol:", window.location.protocol);
    console.log("- Full URL:", window.location.href);

    if (!apiKey) {
      console.error("❌ Google Maps API key missing");
      setLoadError("Google Maps API key not configured.");
      setIsManualMode(true);
      setIsApiReady(true); // Set to true so component shows input
      return;
    }

    // If auth fails (bad key, billing disabled, referrer not allowed), Google triggers this callback.
    // We can then gracefully fall back to server-proxy suggestions instead of leaving a broken UI.
    window.gm_authFailure = () => {
      console.error("❌ Google Maps authentication failed (gm_authFailure).");
      setLoadError(
        "Google Maps authentication failed (key/billing/referrer). Using fallback venue search."
      );
      setIsManualMode(true);
      setIsApiReady(true);
    };

    // Check if already loaded
    if (checkGoogleMapsAvailability()) {
      console.log("✅ Google Maps already available");
      setIsApiReady(true);
      return;
    }

    // Check for existing script
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );

    if (existingScript) {
      console.log("⚙️ Script already exists - polling for API");

      intervalRef.current = setInterval(() => {
        if (checkGoogleMapsAvailability()) {
          console.log("✅ API ready via polling (existing script)");
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setIsApiReady(true);
        }
      }, 100);

      timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        console.warn("⚠️ Timeout waiting for existing script");
        setLoadError("Google Maps failed to load. Please refresh.");
        setIsManualMode(true);
        setIsApiReady(true); // Show input anyway
      }, 20000);

      return;
    }

    // Create new script
    console.log("🚀 Creating new Google Maps script");
    const callbackName = `initGoogleMaps_${Date.now()}`;

    window[callbackName] = () => {
      console.log("✅ Callback triggered");
      clearTimeout(timeoutRef.current);

      // Wait a tiny bit for Places library to fully initialize
      setTimeout(() => {
        if (checkGoogleMapsAvailability()) {
          console.log("✅ Places API confirmed available");
          setIsApiReady(true);
        } else {
          console.error("❌ Places API not available after callback");
          setLoadError("Places library failed to load");
          setIsManualMode(true);
          setIsApiReady(true);
        }
      }, 100);

      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&v=weekly`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      console.error("❌ Script failed to load");
      console.error("Check:");
      console.error("1. API key validity");
      console.error("2. Domain restrictions in Google Cloud Console");
      console.error("3. Billing enabled");
      clearTimeout(timeoutRef.current);
      setLoadError("Failed to load Google Maps API. Using fallback venue search.");
      setIsManualMode(true);
      setIsApiReady(true); // Show input anyway
      delete window[callbackName];
    };

    timeoutRef.current = setTimeout(() => {
      console.warn("⚠️ Script load timeout");
      setLoadError("Google Maps API load timeout");
      setIsManualMode(true);
      setIsApiReady(true); // Show input anyway
      delete window[callbackName];
    }, 15000);

    document.head.appendChild(script);
    console.log("📦 Script tag added to document");
  };

  useEffect(() => {
    loadGoogleMaps();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const handleInputChange = (e) => {
    onChange?.({
      target: {
        name: "venue",
        value: e.target.value,
      },
    });
  };

  // Show loading state only while waiting for API
  if (!isApiReady) {
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
        <div className="mt-1 text-xs text-gray-500">
          Initializing venue search...
        </div>
      </div>
    );
  }

  // If Google Maps JS/Places fails (or key missing), fallback to backend-proxy search UI
  if (isManualMode && loadError) {
    return (
      <div>
        <FallbackVenueSearch
          onPlaceSelect={onPlaceSelect}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={className}
          disabled={disabled}
        />
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          <div className="font-semibold">⚠️ Google Maps JS unavailable</div>
          <div className="mt-1">{loadError}</div>
          <div className="mt-1 text-gray-600">
            Using server-based venue suggestions (no browser Maps key required).
          </div>
        </div>
      </div>
    );
  }

  // Show actual input once API is ready
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        name="venue"
        value={value || ""}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />

      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <FaMapMarkerAlt
          className="text-green-500 w-4 h-4"
          title="Google Maps search enabled"
        />
      </div>

      <div className="mt-1 text-xs text-green-600">
        ✓ Start typing to search venues on Google Maps
      </div>
    </div>
  );
};

export default GoogleMapsPlacesAutocomplete;
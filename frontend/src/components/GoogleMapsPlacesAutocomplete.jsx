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
  const [debugInfo, setDebugInfo] = useState("");
  const loadingTimeoutRef = useRef(null);

  const checkGoogleMapsAvailability = () =>
    window.google?.maps?.places?.Autocomplete;

  const initializeAutocomplete = () => {
    console.log("🔧 Attempting to initialize autocomplete...");

    if (!inputRef.current) {
      console.error("❌ Input ref not available.");
      setLoadError("Input field not found. Please refresh.");
      setDebugInfo("Input ref missing");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    if (!checkGoogleMapsAvailability()) {
      console.error("❌ Google Maps dependencies not available.");
      setLoadError("Google Maps API not properly loaded.");
      setDebugInfo("Maps API not available");
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

      console.log("✅ Autocomplete initialized successfully");
      setIsLoaded(true);
      setDebugInfo("Loaded successfully");
    } catch (err) {
      console.error("❌ Autocomplete initialization error:", err);
      setLoadError(`Failed to initialize: ${err.message}`);
      setDebugInfo(`Error: ${err.message}`);
      setIsManualMode(true);
      setIsLoaded(true);
    }
  };

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    console.log("🔍 Environment check:");
    console.log("- API Key exists:", !!apiKey);
    console.log("- Current domain:", window.location.hostname);
    console.log("- Protocol:", window.location.protocol);
    console.log("- Full URL:", window.location.href);

    if (!apiKey) {
      console.error("❌ Google Maps API key missing.");
      setLoadError("Google Maps API key not configured in environment.");
      setDebugInfo("API key missing");
      setIsManualMode(true);
      setIsLoaded(true);
      return;
    }

    // Check if already loaded
    if (checkGoogleMapsAvailability()) {
      console.log("✅ Google Maps already available.");
      initializeAutocomplete();
      return;
    }

    // Check for existing script
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com/maps/api/js"]`
    );
    
    if (existingScript) {
      console.log("⚙️ Script already exists – waiting for it to finish loading...");
      
      if (existingScript.dataset.loaded === 'true' && checkGoogleMapsAvailability()) {
        initializeAutocomplete();
      } else {
        // Set up timeout for existing script
        loadingTimeoutRef.current = setTimeout(() => {
          if (!checkGoogleMapsAvailability()) {
            console.warn("⚠️ Existing script timeout - Maps API didn't load");
            setLoadError("Google Maps failed to load. Please refresh the page.");
            setDebugInfo("Existing script timeout");
            setIsManualMode(true);
            setIsLoaded(true);
          }
        }, 15000);

        existingScript.addEventListener("load", () => {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          existingScript.dataset.loaded = 'true';
          // Wait a bit for places library to initialize
          setTimeout(() => {
            if (checkGoogleMapsAvailability()) {
              initializeAutocomplete();
            } else {
              console.error("❌ Places library not available after script load");
              setLoadError("Places library failed to load.");
              setIsManualMode(true);
              setIsLoaded(true);
            }
          }, 500);
        });
        
        existingScript.addEventListener("error", (e) => {
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          console.error("❌ Existing script failed to load:", e);
          setLoadError("Google Maps script failed to load. Check API key and domain restrictions.");
          setDebugInfo("Script load error");
          setIsManualMode(true);
          setIsLoaded(true);
        });
      }
      return;
    }

    // Create new script
    console.log("🚀 Injecting new Google Maps script...");
    const callbackName = `initGoogleMaps_${Date.now()}`;

    window[callbackName] = () => {
      console.log("✅ Google Maps callback triggered.");
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // Wait for DOM and Places library
      setTimeout(() => {
        if (inputRef.current && checkGoogleMapsAvailability()) {
          initializeAutocomplete();
        } else {
          const waitInterval = setInterval(() => {
            if (inputRef.current && checkGoogleMapsAvailability()) {
              clearInterval(waitInterval);
              initializeAutocomplete();
            }
          }, 100);
          
          setTimeout(() => {
            clearInterval(waitInterval);
            if (!checkGoogleMapsAvailability()) {
              setLoadError("Failed to initialize Places library");
              setIsManualMode(true);
              setIsLoaded(true);
            }
          }, 5000);
        }
      }, 100);
      
      delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&v=weekly&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onerror = (e) => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      console.error("❌ Failed to load Google Maps script:", e);
      console.error("Check: 1) API key validity, 2) Domain restrictions, 3) Billing enabled");
      setLoadError("Failed to load Google Maps API. Check console for details.");
      setDebugInfo("Script injection failed");
      setIsManualMode(true);
      setIsLoaded(true);
      delete window[callbackName];
    };

    script.onload = () => {
      console.log("📦 Script loaded, waiting for callback...");
      script.dataset.loaded = 'true';
    };

    document.head.appendChild(script);

    // Set overall timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (!checkGoogleMapsAvailability() && !isLoaded) {
        console.warn("⚠️ Timeout: Maps API didn't load in 15 seconds");
        console.warn("Possible causes:");
        console.warn("1. Network issues or slow connection");
        console.warn("2. API key restrictions (check domain whitelist)");
        console.warn("3. Billing not enabled on Google Cloud");
        console.warn("4. HTTPS required but using HTTP");
        setLoadError("Google Maps API load timeout. Please refresh the page.");
        setDebugInfo("Load timeout (15s)");
        setIsManualMode(true);
        setIsLoaded(true);
      }
    }, 15000);
  };

  useEffect(() => {
    loadGoogleMaps();

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
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
        <div className="mt-1 text-xs text-gray-500">
          Initializing venue search... (This may take a few seconds)
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
            title={`Manual input mode - ${loadError || 'Google Maps unavailable'}`}
          />
        ) : (
          <FaMapMarkerAlt
            className="text-green-500 w-4 h-4"
            title="Smart venue search enabled"
          />
        )}
      </div>

      {isManualMode && loadError && (
        <div className="mt-1 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
          <div className="font-semibold">⚠️ Google Maps Unavailable</div>
          <div className="mt-1">{loadError}</div>
          <div className="mt-1 text-gray-600">Please enter venue details manually</div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-1 text-gray-500 text-xs">Debug: {debugInfo}</div>
          )}
        </div>
      )}

      {!isManualMode && !loadError && (
        <div className="mt-1 text-xs text-green-600">
          ✓ Start typing to see venue suggestions from Google Maps
        </div>
      )}
    </div>
  );
};

export default GoogleMapsPlacesAutocomplete;
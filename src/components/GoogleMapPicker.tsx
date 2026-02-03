"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface GoogleMapPickerProps {
  onLocationChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
  addressToGeocode?: string; // Alamat untuk di-geocode dan center map
  onGettingLocationChange?: (isGetting: boolean) => void; // Callback untuk update loading state di parent
}

export interface GoogleMapPickerRef {
  getCurrentLocation: () => void;
}

// Type definitions for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Map: new (element: HTMLElement, options?: any) => any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Marker: new (options?: any) => any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        LatLng: new (lat: number, lng: number) => any;
        Geocoder: new () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          geocode: (request: any, callback: (results: any, status: any) => void) => void;
        };
        GeocoderStatus: {
          OK: string;
          ERROR: string;
          INVALID_REQUEST: string;
          OVER_QUERY_LIMIT: string;
          REQUEST_DENIED: string;
          UNKNOWN_ERROR: string;
          ZERO_RESULTS: string;
        };
        Animation: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          DROP: any;
        };
        MapMouseEvent: {
          latLng: {
            lat: () => number;
            lng: () => number;
          };
        };
      };
    };
    initMap: () => void;
  }
}

const GoogleMapPicker = forwardRef<GoogleMapPickerRef, GoogleMapPickerProps>(({
  onLocationChange,
  initialLat,
  initialLng,
  height = "400px",
  addressToGeocode,
  onGettingLocationChange,
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [map, setMap] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marker, setMarker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const scriptLoadedRef = useRef(false);
  const geocodedAddressRef = useRef<string>(""); // Track alamat yang sudah di-geocode

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError("Google Maps API key tidak ditemukan");
      setIsLoading(false);
      return;
    }

    // Check if script already loaded
    if (window.google && window.google.maps) {
      scriptLoadedRef.current = true;
      initializeMap();
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (existingScript) {
      // Wait for script to load
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle);
          scriptLoadedRef.current = true;
          initializeMap();
        }
      }, 100);
      return () => clearInterval(checkGoogle);
    }

    // Load Google Maps script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      initializeMap();
    };
    script.onerror = () => {
      setError("Gagal memuat Google Maps");
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: don't remove script as it might be used elsewhere
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize map when Google Maps is loaded
  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    // Default to Jakarta if no initial position
    const defaultLat = initialLat || -6.2088;
    const defaultLng = initialLng || 106.8456;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: 15,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    // Create draggable marker
    const markerInstance = new window.google.maps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: mapInstance,
      draggable: true,
      title: "Drag untuk mengubah lokasi",
      animation: window.google.maps.Animation.DROP,
    });

    // Update position when marker is dragged
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markerInstance.addListener("dragend", (event: any) => {
      if (event.latLng) {
        const lat = Number(event.latLng.lat());
        const lng = Number(event.latLng.lng());
        if (!isNaN(lat) && !isNaN(lng)) {
          setCurrentPosition({ lat, lng });
          onLocationChange(lat, lng);
        }
      }
    });

    // Update position when map is clicked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapInstance.addListener("click", (event: any) => {
      if (event.latLng) {
        const lat = Number(event.latLng.lat());
        const lng = Number(event.latLng.lng());
        if (!isNaN(lat) && !isNaN(lng)) {
          markerInstance.setPosition({ lat, lng });
          setCurrentPosition({ lat, lng });
          onLocationChange(lat, lng);
        }
      }
    });

    setMap(mapInstance);
    setMarker(markerInstance);
    setCurrentPosition({ lat: defaultLat, lng: defaultLng });
    onLocationChange(defaultLat, defaultLng);
    setIsLoading(false);
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          if (map && marker && window.google) {
            const newPosition = new window.google.maps.LatLng(lat, lng);
            map.setCenter(newPosition);
            map.setZoom(17);
            marker.setPosition(newPosition);
            setCurrentPosition({ lat, lng });
            onLocationChange(lat, lng);
          } else {
            // If map not ready, store position for later
            setCurrentPosition({ lat, lng });
          }
        }
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Gagal mendapatkan lokasi";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Silakan izinkan akses lokasi.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMessage = "Waktu permintaan lokasi habis.";
            break;
        }
        setError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Expose getCurrentLocation via ref
  useImperativeHandle(ref, () => ({
    getCurrentLocation,
  }));

  // Update parent when isGettingLocation changes
  useEffect(() => {
    if (onGettingLocationChange) {
      onGettingLocationChange(isGettingLocation);
    }
  }, [isGettingLocation, onGettingLocationChange]);

  // Update marker position when initial position changes
  useEffect(() => {
    if (marker && typeof initialLat === 'number' && typeof initialLng === 'number') {
      const lat = Number(initialLat);
      const lng = Number(initialLng);
      const newPosition = new window.google.maps.LatLng(lat, lng);
      marker.setPosition(newPosition);
      if (map) {
        map.setCenter(newPosition);
      }
      setCurrentPosition({ lat, lng });
    }
  }, [initialLat, initialLng, marker, map]);

  // Geocode address when addressToGeocode changes (hanya sekali per alamat baru)
  useEffect(() => {
    if (
      addressToGeocode && 
      addressToGeocode.trim() && 
      addressToGeocode !== geocodedAddressRef.current && // Hanya geocode jika alamat berbeda
      map && 
      marker && 
      window.google
    ) {
      const geocoder = new window.google.maps.Geocoder();
      
      setIsLoading(true);
      
      geocoder.geocode(
        { 
          address: addressToGeocode,
          region: "ID", // Prioritize Indonesia addresses
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any, status: any) => {
          setIsLoading(false);
          
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = Number(location.lat());
            const lng = Number(location.lng());
            
            if (!isNaN(lat) && !isNaN(lng)) {
              // Update map center and marker (hanya initial positioning)
              const newPosition = new window.google.maps.LatLng(lat, lng);
              map.setCenter(newPosition);
              map.setZoom(17); // Zoom lebih dekat untuk akurasi
              marker.setPosition(newPosition);
              setCurrentPosition({ lat, lng });
              onLocationChange(lat, lng);
              setError(null);
              
              // Simpan alamat yang sudah di-geocode
              geocodedAddressRef.current = addressToGeocode;
            }
          } else {
            console.warn("Geocoding failed:", status);
            setError("Gagal menemukan lokasi alamat. Silakan gunakan 'Ambil Lokasi Saya' atau drag marker.");
          }
        }
      );
    }
  }, [addressToGeocode, map, marker, onLocationChange]);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-blue-500" />
        <Label className="text-sm font-semibold">
          Pilih Lokasi Pengirim di Peta
        </Label>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Memuat peta...</p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          style={{ width: "100%", height: "100%", borderRadius: "8px" }}
          className="border border-gray-300"
        />
      </div>

      {currentPosition && 
       typeof currentPosition.lat === 'number' && 
       typeof currentPosition.lng === 'number' && (
        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
          <p className="font-semibold text-blue-900">Koordinat Lokasi:</p>
          <p className="text-blue-700">
            Latitude: {Number(currentPosition.lat).toFixed(6)}, Longitude:{" "}
            {Number(currentPosition.lng).toFixed(6)}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            💡 Drag marker atau klik peta untuk mengubah lokasi
          </p>
        </div>
      )}
    </Card>
  );
});

GoogleMapPicker.displayName = "GoogleMapPicker";

export default GoogleMapPicker;

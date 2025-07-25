'use client';

import { useEffect, useRef, useCallback } from 'react';
import { LocationCoordinates } from '@/lib/types';
import { Loader } from '@googlemaps/js-api-loader';

interface MapProps {
  center?: LocationCoordinates;
  zoom?: number;
  onMapLoad?: (map: google.maps.Map) => void;
  onMapClick?: (coordinates: LocationCoordinates) => void;
}

export function Map({
  center = { latitude: 35.6762, longitude: 139.6503 }, // Tokyo by default
  zoom = 14,
  onMapLoad,
  onMapClick
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const clickListener = useRef<google.maps.MapsEventListener | null>(null);

  const initializeMap = useCallback(async () => {
    if (!mapContainer.current || map.current) return;

    try {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        version: 'weekly',
        libraries: ['places']
      });

      const { Map } = await loader.importLibrary('maps');

      // Initialize map
      map.current = new Map(mapContainer.current, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      });

      // Handle map click
      if (onMapClick) {
        clickListener.current = map.current.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onMapClick({
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng()
            });
          }
        });
      }

      // Call onMapLoad when map is ready
      if (onMapLoad) {
        google.maps.event.addListenerOnce(map.current, 'idle', () => {
          if (map.current && onMapLoad) {
            onMapLoad(map.current);
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
    }
  }, [center, zoom, onMapLoad, onMapClick]);

  useEffect(() => {
    initializeMap();

    // Cleanup
    return () => {
      if (clickListener.current) {
        google.maps.event.removeListener(clickListener.current);
      }
    };
  }, [initializeMap]);

  // Update center when it changes
  useEffect(() => {
    if (map.current && center) {
      map.current.panTo({ lat: center.latitude, lng: center.longitude });
      map.current.setZoom(zoom);
    }
  }, [center, zoom]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      {/* Custom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => map.current?.setZoom((map.current.getZoom() || zoom) + 1)}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => map.current?.setZoom((map.current.getZoom() || zoom) - 1)}
          className="bg-white p-2 rounded shadow hover:bg-gray-100"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
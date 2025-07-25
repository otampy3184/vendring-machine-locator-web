'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map } from '@/components/map/Map';
import { VendingMachineMarker } from '@/components/map/VendingMachineMarker';
import { FilterPanel } from '@/components/machine/FilterPanel';
import { MachineDetailCard } from '@/components/machine/MachineDetailCard';
import { AddMachineForm } from '@/components/machine/AddMachineForm';
import { Loading } from '@/components/ui/Loading';
import { Error } from '@/components/ui/Error';
import { useAuth } from '@/lib/hooks/useAuth';
import { useMachines } from '@/lib/hooks/useMachines';
import { locationService } from '@/lib/services/location.service';
import { imageService } from '@/lib/services/image.service';
import { LocationCoordinates, VendingMachine } from '@/lib/types';

export default function HomePage() {
  const { user } = useAuth();
  const {
    machines,
    filteredMachines,
    loading,
    error,
    machineTypeFilter,
    operatingStatusFilter,
    totalCount,
    operatingCount,
    maintenanceCount,
    outOfOrderCount,
    setMachineTypeFilter,
    setOperatingStatusFilter,
    addMachine,
    deleteMachine
  } = useMachines();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<VendingMachine | null>(null);
  const [addingLocation, setAddingLocation] = useState<LocationCoordinates | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user location on mount
  useEffect(() => {
    locationService.getCurrentPosition()
      .then((position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      })
      .catch((err) => {
        setLocationError('位置情報の取得に失敗しました');
        console.error('Failed to get location:', err);
      });
  }, []);

  // Handle map click for adding new machine
  const handleMapClick = useCallback((coordinates: LocationCoordinates) => {
    if (!user) {
      alert('自動販売機を追加するにはログインが必要です');
      return;
    }
    
    setAddingLocation(coordinates);
    setShowAddForm(true);
    setSelectedMachine(null);
  }, [user]);

  // Handle machine selection
  const handleMachineClick = useCallback((machine: VendingMachine) => {
    setSelectedMachine(machine);
    setShowAddForm(false);
    setAddingLocation(null);
  }, []);

  // Handle add machine form submission
  const handleAddMachine = async (data: any) => {
    try {
      // First add the machine to get the ID
      const machineId = await addMachine({
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        machineType: data.machineType,
        operatingStatus: data.operatingStatus,
        paymentMethods: data.paymentMethods
      });

      // Upload image if provided
      if (data.imageFile && machineId) {
        try {
          const uploadResult = await imageService.uploadImage(
            data.imageFile,
            machineId,
            (progress) => console.log('Upload progress:', progress)
          );
          
          // Update machine with image URLs
          // This would need to be implemented in the service
          console.log('Image uploaded:', uploadResult);
        } catch (imageError) {
          console.error('Failed to upload image:', imageError);
          // Image upload failed but machine was created
        }
      }

      // Close form
      setShowAddForm(false);
      setAddingLocation(null);
      
      // Show success feedback
      alert('自動販売機を登録しました！');
    } catch (error) {
      throw error;
    }
  };

  // Handle machine deletion
  const handleDeleteMachine = async (id: string) => {
    try {
      await deleteMachine(id);
      setSelectedMachine(null);
      alert('自動販売機を削除しました');
    } catch (error) {
      alert('削除に失敗しました');
      console.error('Failed to delete machine:', error);
    }
  };

  // Calculate distance for selected machine
  const selectedMachineDistance = selectedMachine && userLocation
    ? locationService.calculateDistance(userLocation, {
        latitude: selectedMachine.latitude,
        longitude: selectedMachine.longitude
      })
    : undefined;

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loading message="自動販売機データを読み込み中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Error message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <FilterPanel
        machineTypeFilter={machineTypeFilter}
        operatingStatusFilter={operatingStatusFilter}
        onMachineTypeChange={setMachineTypeFilter}
        onOperatingStatusChange={setOperatingStatusFilter}
        totalCount={totalCount}
        operatingCount={operatingCount}
        maintenanceCount={maintenanceCount}
        outOfOrderCount={outOfOrderCount}
      />
      
      <div className="flex-1 relative">
        <Map
          center={userLocation || undefined}
          zoom={14}
          onMapLoad={setMap}
          onMapClick={handleMapClick}
        />
        
        {/* Render markers */}
        {map && filteredMachines.map((machine) => (
          <VendingMachineMarker
            key={machine.id}
            map={map}
            machine={machine}
            onClick={handleMachineClick}
          />
        ))}
        
        {/* Add machine form */}
        {showAddForm && addingLocation && (
          <AddMachineForm
            location={addingLocation}
            onSubmit={handleAddMachine}
            onCancel={() => {
              setShowAddForm(false);
              setAddingLocation(null);
            }}
          />
        )}
        
        {/* Machine detail card */}
        {selectedMachine && !showAddForm && (
          <MachineDetailCard
            machine={selectedMachine}
            distance={selectedMachineDistance}
            onClose={() => setSelectedMachine(null)}
            onDelete={user ? handleDeleteMachine : undefined}
          />
        )}
        
        {/* Add button for mobile */}
        {user && !showAddForm && (
          <button
            onClick={() => {
              if (map) {
                const center = map.getCenter();
                if (center) {
                  handleMapClick({
                    latitude: center.lat(),
                    longitude: center.lng()
                  });
                }
              }
            }}
            className="absolute bottom-4 right-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors md:hidden"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
        
        {/* Location error notification */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">{locationError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
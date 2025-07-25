import { useEffect, useRef } from 'react';
import { VendingMachine, MachineType, OperatingStatus } from '@/lib/types';

interface VendingMachineMarkerProps {
  map: google.maps.Map;
  machine: VendingMachine;
  onClick?: (machine: VendingMachine) => void;
}

// Get color based on machine type
function getMarkerColor(machineType: MachineType): string {
  switch (machineType) {
    case MachineType.BEVERAGE:
      return '#3B82F6'; // Blue
    case MachineType.FOOD:
      return '#F97316'; // Orange
    case MachineType.ICE:
      return '#06B6D4'; // Cyan
    case MachineType.CIGARETTE:
      return '#6B7280'; // Gray
    case MachineType.MULTIPLE:
      return '#8B5CF6'; // Purple
    default:
      return '#10B981'; // Green
  }
}

// Get emoji based on machine type
function getMachineEmoji(machineType: MachineType): string {
  switch (machineType) {
    case MachineType.BEVERAGE:
      return '🥤';
    case MachineType.FOOD:
      return '🍱';
    case MachineType.ICE:
      return '🍦';
    case MachineType.CIGARETTE:
      return '🚬';
    case MachineType.MULTIPLE:
      return '🏪';
    default:
      return '🥤';
  }
}

export function VendingMachineMarker({ map, machine, onClick }: VendingMachineMarkerProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create custom marker icon using SVG
    const svgIcon = {
      path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
      fillColor: getMarkerColor(machine.machineType),
      fillOpacity: 1,
      strokeWeight: machine.operatingStatus !== OperatingStatus.OPERATING ? 3 : 0,
      strokeColor: '#EF4444',
      scale: 2,
      anchor: new google.maps.Point(12, 24),
    };

    // Create marker
    const marker = new google.maps.Marker({
      position: { lat: machine.latitude, lng: machine.longitude },
      map: map,
      icon: svgIcon,
      title: machine.description,
      animation: google.maps.Animation.DROP,
    });

    // Create info window content
    const infoContent = `
      <div style="padding: 8px; min-width: 200px;">
        <h3 style="font-weight: 600; margin-bottom: 4px;">${machine.description}</h3>
        <p style="font-size: 14px; color: #666; margin: 2px 0;">${machine.machineType}</p>
        <p style="font-size: 14px; margin: 2px 0; color: ${
          machine.operatingStatus === OperatingStatus.OPERATING 
            ? '#16a34a' 
            : machine.operatingStatus === OperatingStatus.MAINTENANCE
            ? '#ca8a04'
            : '#dc2626'
        }">
          ${getOperatingStatusLabel(machine.operatingStatus)}
        </p>
        <div style="margin-top: 8px; font-size: 20px; text-align: center;">
          ${getMachineEmoji(machine.machineType)}
        </div>
      </div>
    `;

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: infoContent,
    });

    // Add click listener
    marker.addListener('click', () => {
      // Close any other open info windows
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      
      infoWindow.open(map, marker);
      infoWindowRef.current = infoWindow;
      
      if (onClick) {
        onClick(machine);
      }
    });

    // Add hover effect
    marker.addListener('mouseover', () => {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 700);
    });

    markerRef.current = marker;
    infoWindowRef.current = infoWindow;

    // Cleanup
    return () => {
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      marker.setMap(null);
    };
  }, [map, machine, onClick]);

  return null;
}

function getOperatingStatusLabel(status: OperatingStatus): string {
  switch (status) {
    case OperatingStatus.OPERATING:
      return '稼働中';
    case OperatingStatus.MAINTENANCE:
      return 'メンテナンス中';
    case OperatingStatus.OUT_OF_ORDER:
      return '故障中';
    default:
      return status;
  }
}
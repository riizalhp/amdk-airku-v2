
import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useAppContext } from '../../hooks/useAppContext';
import { RouteStop, Coordinate } from '../../types';

interface RouteMapProps {
  stops: RouteStop[];
  depot: Coordinate;
}

export const RouteMap: React.FC<RouteMapProps> = ({ stops, depot }) => {
  const { stores } = useAppContext();
  
  const positions = useMemo(() => {
    const routeCoordinates: LatLngExpression[] = [[depot.lat, depot.lng]];
    stops.forEach(stop => {
      const store = stores.find(s => s.id === stop.storeId);
      if (store) {
        routeCoordinates.push([store.location.lat, store.location.lng]);
      }
    });
    return routeCoordinates;
  }, [stops, stores, depot]);

  if (positions.length <= 1) {
      return <p>Tidak ada pemberhentian untuk ditampilkan di peta.</p>
  }

  const center = positions[1] as LatLngExpression; // Center on the first stop

  return (
    <div style={{height: '60vh', width: '100%'}}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '8px' }}>
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[depot.lat, depot.lng]}>
            <Popup>Depot (Titik Mulai)</Popup>
        </Marker>
        {stops.map((stop, index) => {
            const store = stores.find(s => s.id === stop.storeId);
            if (!store) return null;
            return (
            <Marker key={stop.orderId} position={[store.location.lat, store.location.lng]}>
                <Popup>Pemberhentian {index + 1}: {stop.storeName}</Popup>
            </Marker>
            )
        })}
        <Polyline pathOptions={{ color: '#0077B6' }} positions={positions} />
        </MapContainer>
    </div>
  );
};

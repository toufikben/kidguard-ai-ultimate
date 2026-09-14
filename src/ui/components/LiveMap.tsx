import { MapContainer, TileLayer, Marker, Circle, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { SafeZone, GeoPoint } from '@/types';

// Fix leaflet default icons (Vite asset issue)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const childIcon = new L.DivIcon({
  html: `<div style="background:#3B82F6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px #3B82F6"></div>`,
  iconSize: [16, 16],
  className: '',
});

const parentIcon = new L.DivIcon({
  html: `<div style="background:#10B981;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 12px #10B981"></div>`,
  iconSize: [14, 14],
  className: '',
});

interface Props {
  center: GeoPoint | null;
  peer?: GeoPoint | null;
  self?: GeoPoint | null;
  zones?: SafeZone[];
  trail?: GeoPoint[];
  height?: number;
}

export default function LiveMap({ center, peer, self, zones = [], trail = [], height = 320 }: Props) {
  const initial: [number, number] = center
    ? [center.lat, center.lng]
    : [36.7538, 3.0588]; // Algiers

  useEffect(() => {
    // Invalidate size on mount
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
  }, []);

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-white/10">
      <MapContainer
        center={initial}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CartoDB'
        />

        {zones.map((z) => (
          <Circle
            key={z.id}
            center={[z.center.lat, z.center.lng]}
            radius={z.radius}
            pathOptions={{
              color: z.color,
              fillColor: z.color,
              fillOpacity: 0.12,
              weight: 2,
              dashArray: '6 6',
            }}
          >
            <Popup>{z.name}</Popup>
          </Circle>
        ))}

        {trail.length > 1 && (
          <Polyline
            positions={trail.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: '#3B82F6', weight: 3, opacity: 0.6 }}
          />
        )}

        {peer && (
          <Marker position={[peer.lat, peer.lng]} icon={childIcon}>
            <Popup>موقع الطفل</Popup>
          </Marker>
        )}

        {self && (
          <Marker position={[self.lat, self.lng]} icon={parentIcon}>
            <Popup>أنت</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

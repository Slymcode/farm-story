import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { KENYA_CENTER } from '@/lib/constants';

const pin = (color = '#16301f') => L.divIcon({
  className: 'fs-pin', iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -38],
  html: `<svg width="34" height="42" viewBox="0 0 34 42" aria-hidden="true"><path d="M17 41C17 41 2 26.5 2 16a15 15 0 0 1 30 0c0 10.5-15 25-15 25Z" fill="${color}" stroke="#fbf9f3" stroke-width="2"/><circle cx="17" cy="16" r="6" fill="#d8b04f"/></svg>`,
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], Math.max(map.getZoom(), 13), { animate: true }); }, [lat, lng, map]);
  return null;
}
function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export interface MapMarker { id: string; lat: number; lng: number; title: string; subtitle?: string; href?: string }
interface Props {
  lat?: number; lng?: number;
  /** When provided the single marker is draggable and the map is click-to-place. */
  onChange?: (lat: number, lng: number) => void;
  markers?: MapMarker[]; height?: number; label?: string;
}

export default function FarmMap({ lat, lng, onChange, markers, height = 280, label = 'Farm location map' }: Props) {
  const multi = !!markers;
  const center: [number, number] = lat != null && lng != null ? [lat, lng] : markers?.length ? [markers[0].lat, markers[0].lng] : KENYA_CENTER;
  return (
    <div role="region" aria-label={label} style={{ height }} className="overflow-hidden rounded-2xl border border-cream-300">
      <MapContainer center={center} zoom={multi ? 8 : lat != null ? 13 : 7} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {!multi && lat != null && lng != null && (
          <>
            <Marker position={[lat, lng]} icon={pin()} draggable={!!onChange} keyboard={!!onChange}
              eventHandlers={onChange ? { dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onChange(p.lat, p.lng); } } : undefined} />
            <Recenter lat={lat} lng={lng} />
          </>
        )}
        {onChange && <ClickToPlace onPick={onChange} />}
        {markers?.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={pin()} title={m.title}>
            <Popup><strong>{m.title}</strong>{m.subtitle && <><br />{m.subtitle}</>}{m.href && <><br /><a href={m.href}>Open profile</a></>}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

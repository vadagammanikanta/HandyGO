import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── Fix Leaflet default marker icon path broken by Vite's asset pipeline ─────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ─── Custom marker icons ───────────────────────────────────────────────────────
const partnerIcon = L.divIcon({
  html: `
    <div style="
      width: 36px; height: 36px;
      background: #1B4FD8;
      border: 3px solid #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(27,79,216,0.4);
      font-size: 16px;
    ">🔧</div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const customerIcon = L.divIcon({
  html: `
    <div style="
      width: 36px; height: 36px;
      background: #10B981;
      border: 3px solid #fff;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(16,185,129,0.4);
      font-size: 16px;
      animation: mapPulse 2s infinite;
    ">🏠</div>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ─── Sub-component: keeps the map centred on partner position ─────────────────
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
};

/**
 * MapView — renders an OpenStreetMap (via Leaflet) with two markers:
 *  - Partner's current position (blue wrench pin)
 *  - Customer's home location  (green house pin)
 *
 * Props:
 *  partnerLat / partnerLng — real-time partner position from Firestore
 *  customerLat / customerLng — customer's address coordinates
 *  partnerName — displayed in the partner marker popup
 */
const MapView = ({
  partnerLat = 12.9716,
  partnerLng = 77.5946,
  customerLat = 12.9750,
  customerLng = 77.5900,
  partnerName = 'Service Partner',
}) => {
  const center = [partnerLat, partnerLng];

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
      />

      {/* Re-centre whenever partner moves */}
      <RecenterMap lat={partnerLat} lng={partnerLng} />

      {/* Partner marker */}
      <Marker position={[partnerLat, partnerLng]} icon={partnerIcon}>
        <Popup>
          <span className="text-xs font-semibold">{partnerName}</span>
        </Popup>
      </Marker>

      {/* Customer marker */}
      <Marker position={[customerLat, customerLng]} icon={customerIcon}>
        <Popup>
          <span className="text-xs font-semibold">Your Location</span>
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapView;

"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js
// Using CDN URLs for marker icons
delete (L.Icon.Default.prototype as { _getIconUrl?: () => void })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Land {
  id: string;
  name: string;
  location: string;
  city?: string;
  state?: string;
  zip?: string;
  crop: string;
  area: string;
  leaseDuration: string;
  profit: string;
  coordinates: { lat: number; lng: number };
  parcelNumber?: string;
  zoning?: string;
  irrigation?: string;
}

interface MapComponentProps {
  lands: Land[];
}

export default function MapComponent({ lands }: MapComponentProps) {
  // Filter out lands with invalid coordinates
  const validLands = lands.filter(
    (land) =>
      land.coordinates &&
      land.coordinates.lat !== 0 &&
      land.coordinates.lng !== 0 &&
      !isNaN(land.coordinates.lat) &&
      !isNaN(land.coordinates.lng),
  );

  // Calculate center of all lands or default to North America
  const getCenter = () => {
    if (validLands.length === 0) {
      return [39.8283, -98.5795]; // Center of USA
    }
    const avgLat =
      validLands.reduce((sum, land) => sum + land.coordinates.lat, 0) /
      validLands.length;
    const avgLng =
      validLands.reduce((sum, land) => sum + land.coordinates.lng, 0) /
      validLands.length;
    return [avgLat, avgLng];
  };

  const center = getCenter();

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={validLands.length > 0 ? 6 : 4}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validLands.map((land) => (
        <Marker
          key={land.id}
          position={[land.coordinates.lat, land.coordinates.lng]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-lg mb-2">
                {land.name || "Unnamed Property"}
              </h3>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Address:</span>{" "}
                  {land.location}
                  {land.city && `, ${land.city}`}
                  {land.state && `, ${land.state}`}
                  {land.zip && ` ${land.zip}`}
                </p>
                {land.crop && (
                  <p>
                    <span className="font-semibold">Land Use:</span> {land.crop}
                  </p>
                )}
                {land.area && (
                  <p>
                    <span className="font-semibold">Acreage:</span> {land.area}
                  </p>
                )}
                {land.profit && (
                  <p>
                    <span className="font-semibold">Annual Rent/Profit:</span>{" "}
                    {land.profit}
                  </p>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

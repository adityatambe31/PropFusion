/**
 * Geocoding utility using Nominatim (OpenStreetMap)
 * Free service - no API key required
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function geocodeAddress(
  address: string,
  city?: string,
  state?: string,
  zip?: string,
): Promise<Coordinates | null> {
  try {
    const fullAddress = [address, city, state, zip].filter(Boolean).join(", ");

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        fullAddress,
      )}&limit=1`,
      {
        headers: {
          "User-Agent": "PropFusion/1.0", // Required by Nominatim
        },
      },
    );

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

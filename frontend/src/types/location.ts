export interface LocationCountry {
  id?: number;
  name?: string;
  alpha_2_code?: string;
  alpha_3_code?: string;
}

export interface LocationCelestialBody {
  id: number;
  name: string;
}

export interface LocationImage {
  id?: number;
  name?: string;
  image_url?: string;
  thumbnail_url?: string;
  credit?: string;
}

export interface LaunchLocation {
  apiId: number;
  name: string;
  active: boolean;
  country: LocationCountry | null;
  description: string | null;
  image: LocationImage | null;
  map_image: string | null;
  longitude: number | null;
  latitude: number | null;
  timezone_name: string | null;
  total_launch_count: number;
  total_landing_count: number;
  celestial_body: LocationCelestialBody | null;
}

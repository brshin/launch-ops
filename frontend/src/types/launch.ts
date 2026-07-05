
export interface Status {
    id: number;
    name: string;
    abbrev: string;
    description: string;
}

export interface NetPrecision {
    id: number;
    name: string;
    abbrev: string;
    description: string;
}

export interface License {
    id: number;
    name: string;
    priority: number;
    link: string | null;
}

export interface Image {
    id: number;
    name: string;
    image_url: string;
    thumbnail_url: string;
    credit: string;
    license: License;
    single_use: boolean;
    variants: any[];
}

export interface Type {
    id: number;
    name: string;
}

export interface LaunchServiceProvider {
    response_mode: string;
    id: number;
    url: string;
    name: string;
    abbrev: string;
    type: Type;
}

export interface Family {
    response_mode: string;
    id: number;
    name: string;
}

export interface Configuration {
    response_mode: string;
    id: number;
    url: string;
    name: string;
    families: Family[];
    full_name: string;
    variant: string;
}

export interface Rocket {
    id: number;
    configuration: Configuration;
}

export interface BaseCelestialBody {
    response_mode: string;
    id: number;
    name: string;
}

export interface Orbit {
    id: number;
    name: string;
    abbrev: string;
    celestial_body: BaseCelestialBody;
}

export interface Mission {
    id: number;
    name: string;
    type: string;
    description: string;
    image: string | null;
    orbit: Orbit;
    agencies: string[];
    info_urls: string[];
    vid_urls: string[];
}

export interface Country {
    id: number;
    name: string;
    alpha_2_code: string;
    alpha_3_code: string;
    nationality_name: string;
    nationality_name_composed: string;
}

export interface DetailedCelestialBody {
    response_mode: string;
    id: number;
    name: string;
    type: Type;
    diameter: number;
    mass: number;
    gravity: number;
    length_of_day: string;
    atmosphere: boolean;
    image: Image;
    description: string;
    wiki_url: string;
    total_attempted_launches: number;
    successful_launches: number;
    failed_launches: number;
    total_attempted_landings: number;
    successful_landings: number;
    failed_landings: number;
}

export interface Location {
    response_mode: string;
    id: number;
    url: string;
    name: string;
    celestial_body: DetailedCelestialBody;
    active: boolean;
    country: Country;
    description: string;
    image: Image;
    map_image: string;
    longitude: number;
    latitude: number;
    timezone_name: string;
    total_launch_count: number;
    total_landing_count: number;
}

export interface Pad {
    id: number;
    url: string;
    active: boolean;
    agencies: string[];
    name: string;
    image: Image;
    description: string;
    info_url: string | null;
    wiki_url: string | null;
    map_url: string;
    latitude: number;
    longitude: number;
    country: Country;
    map_image: string;
    total_launch_count: number;
    orbital_launch_attempt_count: number;
    fastest_turnaround: string;
    location: Location;
}

export interface Launch {
    apiId: string;
    name: string;
    status: Status;
    last_updated: string;
    net: string;
    net_precision: NetPrecision;
    window_start: string;
    window_end: string;
    image: Image;
    launch_service_provider: LaunchServiceProvider;
    rocket: Rocket;
    mission: Mission;
    pad: Pad;
}
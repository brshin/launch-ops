
export interface Status {
    abbrev: string;
}

export interface Image {
    name: string;
    image_url: string;
    thumbnail_url: string;
    credit: string;
}

export interface Type {
    name: string;
}

export interface LaunchServiceProvider {
    url: string;
    name: string;
    abbrev: string;
    type: Type;
}

export interface Family {
    name: string;
}

export interface Configuration {
    url: string;
    name: string;
    families: Family[];
    full_name: string;
    variant: string;
}

export interface Rocket {
    configuration: Configuration;
}

export interface Orbit {
    name: string;
    abbrev: string;
}

export interface Country {
    id: number;
    name: string;
    alpha_2_code: string;
    alpha_3_code: string;
    nationality_name: string;
}

export interface Logo {
    image_url: string;
    thumbnail_url: string;
}

export interface SocialLogo {
    image_url: string;
    thumbnail_url: string;
}

export interface Agency {
    name: string;
    abbrev: string;
    type: Type;
    country: Country[];
    description: string;
    administrator: string;
    founding_year: number;
    launchers: string;
    spacecraft: string;
    image: Image;
    logo: Logo;
    social_logo: SocialLogo;
    // Additional stats avaliable via API; only with Agency call from Mission, not Pad.
    // total_launch_count: number;
    // successful_launches: number;
    // failed_launches: number;
}

export interface Mission {
    name: string;
    type: string;
    description: string;
    image: string | null;
    orbit: Orbit;
    agencies: Agency[];
    info_urls: string[];
    vid_urls: string[];
}

export interface Location {
    name: string;
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
    agencies: Agency[];
    name: string;
    image: Image;
    description: string;
    map_url: string;
    latitude: number;
    longitude: number;
    country: Country;
    map_image: string;
    total_launch_count: number;
    orbital_launch_attempt_count: number;
    location: Location;
}

export interface Launch {
    apiId: string;
    name: string;
    status: Status;
    last_updated: string;
    net: string;
    window_start: string;
    window_end: string;
    image: Image;
    launch_service_provider: LaunchServiceProvider;
    rocket: Rocket;
    mission: Mission;
    pad: Pad;
}
export interface YoutubeVideo {
    name: string;
    host1: string;
    host2: string;
    host3: string;
    host4: string;
    summary: string;
  }
  
  export interface Partner {
    name: string;
    role: string;
    biography: string;
    image: string;
  }

  export interface Company {
    name: string;
    primary_partner: string;
    short_description: string;
    image: string;
    tag: string;
    location: string;
    website: string;
    long_description: string;
  }

  export interface Founder {
    name: string;
    image: string;
  }
  
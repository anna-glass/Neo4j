declare module 'neovis.js' {
  export default class Neovis {
    constructor(config: {
      containerId: string;
      neo4j: {
        serverUrl: string;
        serverUser: string;
        serverPassword: string;
        driverConfig?: any;
      };
      labels?: Record<string, {
        caption?: string;
        size?: string;
        community?: string;
        [key: string]: any;
      }>;
      relationships?: Record<string, {
        thickness?: string;
        caption?: boolean | string;
        [key: string]: any;
      }>;
      initialCypher?: string;
      visConfig?: any;
      [key: string]: any;
    });
    
    render(): void;
    clearNetwork(): void;
    registerOnEvent(eventType: string, callback: Function): void;
    reinit(config: any): void;
    reload(): void;
    stabilize(): void;
    renderWithCypher(cypher: string): void;
    updateWithCypher(cypher: string): void;
  }
} 
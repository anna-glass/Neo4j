'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// We'll need to manually define NeoVis types since it doesn't have TypeScript definitions
declare global {
  interface Window {
    neovis: any;
  }
}

interface NeoVisConfig {
  container_id: string;
  server_url: string;
  server_user: string;
  server_password: string;
  labels: {
    [key: string]: {
      caption: string;
      size: string;
      image?: string;
      community: string;
      title?: string;
    };
  };
  relationships: {
    [key: string]: {
      thickness: string;
      caption: boolean;
    };
  };
  initial_cypher: string;
  arrows?: boolean;
  hierarchical?: boolean;
  hierarchical_sort_method?: string;
  initial_node_display?: number;
}

export default function NetworkGraph() {
  const graphRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let visualization: any = null;
    let scriptLoaded = false;

    // Load neovis.js script
    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/neovis.js@2.0.2';
        script.async = true;
        script.onload = () => {
          scriptLoaded = true;
          resolve();
        };
        script.onerror = () => {
          reject(new Error('Failed to load neovis.js'));
        };
        document.head.appendChild(script);
      });
    };

    // Initialize the visualization
    const initializeVisualization = async () => {
      if (!scriptLoaded) {
        await loadScript();
      }

      try {
        // Get Neo4j credentials from environment variables
        // In a production app, you'd want to use an API endpoint that securely provides these
        const response = await fetch('/api/graph');
        
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }
        
        const data = await response.json();
        
        if (!window.neovis) {
          throw new Error('Neovis.js failed to load properly');
        }

        // Set up visualization with our graph data
        if (graphRef.current) {
          // Use direct visualization of the graph data we fetched
          // instead of connecting directly to Neo4j
          const viz = new window.neovis.default({
            container_id: graphRef.current.id,
            labels: {
              Person: {
                caption: 'label',
                size: 'pagerank',
                image: 'image',
                title: 'title'
              }
            },
            relationships: {
              KNOWS: {
                thickness: 'count',
                caption: true
              },
              WORKS_WITH: {
                thickness: 'count',
                caption: true
              },
              // Add any other relationship types in your data
            },
            arrows: true,
            hierarchical: true,
            hierarchical_sort_method: 'directed',
            initial_node_display: 30
          });
          
          // Set up event listeners
          viz.registerOnEvent('clickNode', (nodeId: string) => {
            // When a node is clicked, you can fetch and display profile data
            const node = data.nodes.find((n: any) => n.id === nodeId);
            if (node) {
              setProfileData(node.properties);
            }
          });
          
          // Render with our data instead of a Cypher query
          viz.renderWithData(data);
          
          visualization = viz;
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Visualization error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initializeVisualization();

    // Cleanup function
    return () => {
      if (visualization) {
        visualization.clearNetwork();
      }
    };
  }, []);

  // Handle closing the profile modal
  const handleCloseProfile = () => {
    setProfileData(null);
  };

  return (
    <div className="relative w-full h-screen">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
          <div className="text-lg font-semibold">Loading network graph...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-75 z-10">
          <div className="text-lg font-semibold text-red-600">Error: {error}</div>
        </div>
      )}
      
      <div 
        id="network-graph" 
        ref={graphRef} 
        className="w-full h-full"
      />
      
      {/* Profile Modal */}
      {profileData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Profile</h2>
              <button 
                onClick={handleCloseProfile}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center mb-4">
              {profileData.profilePic && (
                <img 
                  src={profileData.profilePic} 
                  alt={profileData.name || 'Profile'} 
                  className="w-16 h-16 rounded-full mr-4 object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{profileData.name || 'Unknown'}</h3>
                {profileData.title && <p className="text-gray-600">{profileData.title}</p>}
              </div>
            </div>
            
            <div className="mt-4">
              {/* Display other profile details */}
              {Object.entries(profileData)
                .filter(([key]) => !['id', 'name', 'profilePic', 'title'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="mb-2">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}: </span>
                    <span>{String(value)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
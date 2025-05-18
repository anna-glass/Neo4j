"use client"

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export default function KnowledgeNetwork() {
  const visRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string, cypher?: string }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vis, setVis] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages appear
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  useEffect(() => {
    const loadNeovis = async () => {
      try {
        setLoading(true);
        // We need to dynamically import neovis because it uses browser APIs
        const { default: Neovis } = await import('neovis.js');

        if (!visRef.current) {
          throw new Error("Visualization container not found");
        }

        // Configure the visualization
        const config = {
          containerId: visRef.current.id,
          neo4j: {
            serverUrl: process.env.NEXT_PUBLIC_NEO4J_URL!,
            serverUser: process.env.NEXT_PUBLIC_NEO4J_USERNAME!,
            serverPassword: process.env.NEXT_PUBLIC_NEO4J_PASSWORD!
          },
          labels: {
            // Configure the visualization for different node types
            Founder: {
              caption: 'name',
              size: 'pagerank',
              community: 'community'
            },
            Company: {
              caption: 'name',
              size: 'pagerank',
              community: 'community'
            },
            Partner: {
              caption: 'name',
              size: 'pagerank',
              community: 'community'
            },
            YoutubeVideo: {
              caption: 'name',
              size: 'pagerank',
              community: 'community'
            }
          },
          relationships: {
            FOUNDED: {
              thickness: 'count',
              caption: true
            },
            PARTNER_OF: {
              thickness: 'count',
              caption: true
            },
            CREATED: {
              thickness: 'count',
              caption: true
            },
            MENTIONS: {
              thickness: 'count',
              caption: true
            }
          },
          initialCypher: `
            MATCH (n) 
            WHERE n:Founder OR n:Company OR n:Partner OR n:YoutubeVideo
            WITH n LIMIT 100
            OPTIONAL MATCH (n)-[r]-(m)
            RETURN n, r, m
          `
        };

        // Create the visualization
        const visInstance = new Neovis(config);
        visInstance.render();
        setVis(visInstance);
        setLoading(false);
      } catch (err) {
        console.error("Failed to initialize graph visualization:", err);
        setError(`Error loading graph: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };

    loadNeovis();
  }, []);

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isProcessing) return;

    // Add user question to chat
    const userQuestion = question.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userQuestion }]);
    setQuestion('');
    setIsProcessing(true);

    try {
      // Call our hybrid reasoning API endpoint
      const response = await fetch('/api/chat/hybrid-reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userQuestion,
          history: chatHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add assistant response to chat
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        cypher: data.cypher 
      }]);

      // Update visualization with the new cypher query if available
      if (data.cypher && vis) {
        vis.renderWithCypher(data.cypher);
      }
    } catch (err) {
      console.error('Error processing question:', err);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : String(err)}` 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Knowledge Network</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Upload
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graph Visualization */}
            <div className="w-full">
              <h2 className="text-xl font-semibold mb-4">Graph Visualization</h2>
              {loading ? (
                <div className="flex justify-center items-center h-96">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div 
                  id="viz" 
                  ref={visRef} 
                  className="bg-white shadow overflow-hidden rounded-lg"
                  style={{ height: '600px' }}
                ></div>
              )}
            </div>

            {/* Chat Interface */}
            <div className="w-full flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Knowledge Chat</h2>
              <div className="bg-white shadow overflow-hidden rounded-lg flex-grow flex flex-col">
                <div className="p-4 overflow-y-auto flex-grow max-h-[500px]">
                  {chatHistory.length === 0 ? (
                    <div className="text-gray-500 text-center my-8">
                      <p>Ask questions about your knowledge network!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((message, index) => (
                        <div 
                          key={index} 
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user' 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{message.content}</div>
                            {message.cypher && (
                              <div className="mt-2 pt-2 border-t border-gray-300 text-xs text-gray-500">
                                <details>
                                  <summary className="cursor-pointer font-medium">View Cypher Query</summary>
                                  <pre className="mt-2 p-2 bg-gray-800 text-white rounded overflow-x-auto">
                                    {message.cypher}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>
                <form onSubmit={handleQuestionSubmit} className="border-t p-4">
                  <div className="flex">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="flex-grow rounded-l-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ask a question about your knowledge network..."
                      disabled={isProcessing}
                    />
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                      disabled={isProcessing || !question.trim()}
                    >
                      {isProcessing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 
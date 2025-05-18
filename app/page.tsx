"use client"

import { useState } from "react";
import { FileUploadForm } from "@/components/FileUploadForm";

export default function Home() {
  const [type, setType] = useState("Founder");

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">Database Ingest Tool</h1>
        <p className="text-center mb-10 text-gray-600">
          Upload a CSV file and insert it into the Neo4j vector database
        </p>
        <div className="mb-6 flex flex-col items-center">
          <label htmlFor="type" className="mb-2 font-semibold">
            Select Data Type:
          </label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={e => setType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="YoutubeVideo">YoutubeVideo</option>
            <option value="Company">Company</option>
            <option value="Founder">Founder</option>
            <option value="Partner">Partner</option>
          </select>
        </div>
        <FileUploadForm selectedType={type} />
      </div>
    </main>
  );
}

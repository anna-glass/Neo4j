"use client";

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

const DATA_TYPES = [
  "YoutubeVideo",
  "Company",
  "Founder",
  "Partner"
];

// Add interface for props at the top of the file
interface FileUploadFormProps {
  selectedType?: string;
}

// Update the component signature to accept props
export function FileUploadForm({ selectedType }: FileUploadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [type, setType] = useState(selectedType || DATA_TYPES[0]);
  const textField = "Content"; // Always use "Content" as the text field
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileContent(event.target.result as string);
          setMessage(`File loaded: ${selectedFile.name}`);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const insertIntoDb = async () => {
    if (!fileContent) {
      setMessage("Please upload a file first.");
      return;
    }
    if (!type) {
      setMessage("Please select a type.");
      return;
    }

    setIsLoading(true);
    setMessage("Inserting into database...");

    try {
      const response = await fetch("/api/retrieval/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csv: fileContent,
          type,
          textField,
        }),
      });

      if (response.status === 200) {
        const result = await response.json();
        setMessage(result.message || "Successfully inserted into database!");
      } else {
        const json = await response.json();
        if (json.error) {
          setMessage(`Error: ${json.error}`);
        } else {
          setMessage("An unknown error occurred.");
        }
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFileContent("");
    setMessage("");
    setType(DATA_TYPES[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
      <div className="flex flex-col items-center justify-center gap-4 p-6 border border-gray-300 rounded-lg">
        <div className="w-full">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-white
              hover:file:bg-primary/80"
          />
        </div>

        {fileContent && (
          <div className="w-full mt-4">
            <Button
              onClick={insertIntoDb}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <div role="status" className="flex justify-center items-center">
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-white animate-spin fill-sky-800"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                      fill="currentColor"
                    />
                    <path
                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                      fill="currentFill"
                    />
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div>
              ) : (
                "Insert Into Database"
              )}
            </Button>
          </div>
        )}

        {message && (
          <div className="w-full mt-4">
            <div className={`p-3 rounded-md ${message.includes("Error") ? "bg-red-100 text-red-700" : message.includes("Success") ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {message}
            </div>
            {(message.includes("Success") || message.includes("Error")) && (
              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full mt-2"
              >
                Upload Another File
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

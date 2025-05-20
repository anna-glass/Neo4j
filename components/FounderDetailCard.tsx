import React from "react";

type DetailCardProps = {
  open: boolean;
  onClose: () => void;
  person: {
    name: string;
    image: string;
    company: string;
    [key: string]: any;
  } | null;
};

export default function FounderDetailCard({ open, onClose, person }: DetailCardProps) {
  if (!open || !person) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="relative bg-white/40 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 p-8 flex flex-col items-center w-[360px] max-w-[90vw]"
        style={{
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.25)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 bg-white/60 rounded-full px-2 py-1"
          aria-label="Close"
        >
          ×
        </button>
        {person.image && (
          <img
            src={person.image}
            alt={person.name}
            className="w-24 h-24 rounded-xl object-cover shadow mb-4 border border-white/60"
          />
        )}
        <h2 className="text-xl font-bold mb-1 text-gray-900">{person.name}</h2>
        {person.company && <div className="mb-2 text-gray-700">{person.company}</div>}
        {/* Add more fields as needed */}
      </div>
    </div>
  );
}

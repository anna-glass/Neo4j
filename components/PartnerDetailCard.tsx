import React from "react";

type YoutubeVideo = {
  name?: string;
  summary?: string;
};

type DetailCardProps = {
  open: boolean;
  onClose: () => void;
  person: {
    name: string;
    bio?: string;
    image?: string;
    role?: string;
    youtube_videos?: YoutubeVideo[]; // <-- snake_case here!
    [key: string]: any;
  } | null;
};

// Helper to get first 2 sentences of a summary
function getTwoSentences(text?: string): string {
  if (!text) return "";
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  return sentences.slice(0, 2).join(" ").trim();
}

export default function PartnerDetailCard({ open, onClose, person }: DetailCardProps) {
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
        {person.role && (
          <div className="mb-2 text-gray-700 font-semibold">{person.role}</div>
        )}
        {person.bio && (
          <p className="text-sm text-gray-800 text-center">{person.bio}</p>
        )}
        {/* Talks about section */}
        {person.youtube_videos && person.youtube_videos.length > 0 && (
          <div className="mt-4 w-full">
            <div className="font-semibold text-gray-800 mb-1">Talks about:</div>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-2">
              {person.youtube_videos.map((video, idx) =>
                video.name ? (
                  <li key={idx}>
                    <strong>{video.name}</strong>
                    {video.summary && (
                      <>: {getTwoSentences(video.summary)}</>
                    )}
                  </li>
                ) : null
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

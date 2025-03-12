"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import * as mm from "music-metadata-browser";

const ArtistPage = () => {
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState(null);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    const { data, error } = await supabase.storage
      .from("music")
      .list("uploads");

    if (error) {
      console.error("Error fetching files:", error);
      return;
    }

    const filesWithMetadata = await Promise.all(
      data.map(async (file) => {
        const { data: urlData } = supabase.storage
          .from("music")
          .getPublicUrl(`uploads/${file.name}`);

        const response = await fetch(urlData.publicUrl);
        const blob = await response.blob();
        const metadata = await mm.parseBlob(blob);

        const artist = metadata.common.artist || "Unknown Artist";
        const albumArt =
          metadata.common.picture?.[0] &&
          URL.createObjectURL(new Blob([metadata.common.picture[0].data]));

        return {
          ...file,
          publicUrl: urlData.publicUrl,
          artist,
          albumArt,
        };
      })
    );

    setAudioFiles(filesWithMetadata);
  };

  // Group songs by artist
  const songsByArtist = audioFiles.reduce((acc, file) => {
    if (!acc[file.artist]) {
      acc[file.artist] = [];
    }
    acc[file.artist].push(file);
    return acc;
  }, {});

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
        <h1 className="text-2xl font-bold mb-6">Artists</h1>

        <div className="flex w-full max-w-2xl">
          {Object.keys(songsByArtist).map((artist) => (
            <button
              key={artist}
              className="mb-6 p-4 bg-white rounded shadow"
              onClick={() => setSelectedArtist(artist)}>
              <h2
                className={`text-xl font-semibold mb-2 ${
                  selectedArtist === artist
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                }`}>
                {artist}
              </h2>
            </button>
          ))}
        </div>
        {/* Songs of Selected Artist */}
        {selectedArtist && (
          <div className="mt-8 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">
              Songs by {selectedArtist}:
            </h2>
            {songsByArtist[selectedArtist]?.map((file) => (
              <div
                key={file.name}
                className="mb-4 p-4 bg-white rounded shadow flex items-center gap-4">
                {file.albumArt ? (
                  <img
                    src={file.albumArt}
                    alt="Album Art"
                    className="w-16 h-16 rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-sm text-gray-600">
                    No Art
                  </div>
                )}
                <div className="w-full">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-gray-600">{file.artist}</p>
                  <audio
                    controls
                    src={file.publicUrl}
                    className="w-full mt-2"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ArtistPage;

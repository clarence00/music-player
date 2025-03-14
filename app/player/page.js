"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import * as mm from "music-metadata-browser";
import Link from "next/link";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);

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

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const { data, error } = await supabase.storage
      .from("music")
      .upload(`uploads/${file.name}`, file);

    if (error) {
      console.error("Error uploading file:", error);
    } else {
      console.log("File uploaded successfully:", data);
      await fetchUploadedFiles();
    }

    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">MP3 Uploader</h1>
      <input
        type="file"
        accept=".mp3"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400">
        {uploading ? "Uploading..." : "Upload"}
      </button>
      <Link href="./artist">
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Artist
        </button>
      </Link>

      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Uploaded Files:</h2>
        {audioFiles.length > 0 ? (
          audioFiles.map((file) => (
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
          ))
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

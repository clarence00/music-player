"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [audioFiles, setAudioFiles] = useState([]);

  // Fetch uploaded files on component mount
  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    const { data, error } = await supabase.storage
      .from("music")
      .list("uploads"); // List files in the 'uploads' folder

    if (error) {
      console.error("Error fetching files:", error);
    } else {
      // Get public URLs for each file
      const filesWithUrls = await Promise.all(
        data.map(async (file) => {
          const { data: urlData } = supabase.storage
            .from("music")
            .getPublicUrl(`uploads/${file.name}`);
          return { ...file, publicUrl: urlData.publicUrl };
        })
      );
      setAudioFiles(filesWithUrls);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("music")
      .upload(`uploads/${file.name}`, file);

    if (error) {
      console.error("Error uploading file:", error);
    } else {
      console.log("File uploaded successfully:", data);
      // Refresh the list of uploaded files
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

      <div className="mt-8 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Uploaded Files:</h2>
        {audioFiles.length > 0 ? (
          audioFiles.map((file) => (
            <div
              key={file.name}
              className="mb-4 p-4 bg-white rounded shadow">
              <p className="font-medium">{file.name}</p>
              <audio
                controls
                src={file.publicUrl}
                className="w-full mt-2"
              />
            </div>
          ))
        ) : (
          <p>No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

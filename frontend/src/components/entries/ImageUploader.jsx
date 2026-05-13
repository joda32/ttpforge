import { useEffect, useRef, useState } from "react";
import { useImages, useUploadImage, useUpdateImageCaption, useDeleteImage } from "../../hooks/useImages";

function CaptionInput({ image, onSave }) {
  const [value, setValue] = useState(image.caption ?? "");

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed !== (image.caption ?? "")) onSave(trimmed);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); e.target.blur(); } }}
      placeholder="Add caption…"
      className="w-20 mt-1 bg-transparent border-b border-slate-600 text-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:text-slate-200 placeholder-slate-600 transition-colors truncate"
    />
  );
}

export default function ImageUploader({ entryId }) {
  const { data: images = [], isLoading } = useImages(entryId);
  const uploadMutation = useUploadImage(entryId);
  const captionMutation = useUpdateImageCaption(entryId);
  const deleteMutation = useDeleteImage(entryId);

  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      uploadMutation.mutate(f);
    });
  };

  // Global paste listener
  useEffect(() => {
    const onPaste = (e) => {
      const items = e.clipboardData?.items ?? [];
      const imageItems = Array.from(items).filter((i) => i.type.startsWith("image/"));
      if (!imageItems.length) return;
      e.preventDefault();
      imageItems.forEach((item) => {
        const file = item.getAsFile();
        if (file) uploadMutation.mutate(file);
      });
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [uploadMutation]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs text-slate-400 font-medium">Screenshots / Images</label>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg py-5 cursor-pointer transition-colors select-none ${
          dragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/40"
        }`}
      >
        <span className="text-2xl">ðŸ“Ž</span>
        <p className="text-xs text-slate-400">
          Drag & drop, <span className="text-blue-400 underline">browse</span>, or paste (Ctrl+V)
        </p>
        {uploadMutation.isPending && (
          <p className="text-xs text-blue-400 animate-pulse">Uploading…</p>
        )}
        {uploadMutation.isError && (
          <p className="text-xs text-red-400">Upload failed — try again</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Thumbnail grid */}
      {isLoading && <p className="text-xs text-slate-500">Loading images…</p>}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group flex flex-col items-center">
              <div className="relative">
                <img
                  src={img.data_url}
                  alt={img.caption || img.filename}
                  title={img.caption || img.filename}
                  onClick={() => setLightbox(img)}
                  className="w-20 h-20 object-cover rounded border border-slate-600 cursor-zoom-in hover:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(img.id); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-red-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 leading-none"
                  title="Delete image"
                >
                  ×
                </button>
              </div>
              <CaptionInput
                key={`${img.id}-${img.caption}`}
                image={img}
                onSave={(caption) => captionMutation.mutate({ imageId: img.id, caption })}
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.data_url}
              alt={lightbox.caption || lightbox.filename}
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            />
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-xs text-slate-300">{lightbox.caption || lightbox.filename}</span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useImages, useUploadImage, useUpdateImageCaption, useDeleteImage } from "../../hooks/useImages";

const THUMB = "w-20 h-20";

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
      placeholder="Caption…"
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

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") {
        const idx = images.findIndex((i) => i.id === lightbox.id);
        if (idx < images.length - 1) setLightbox(images[idx + 1]);
      }
      if (e.key === "ArrowLeft") {
        const idx = images.findIndex((i) => i.id === lightbox.id);
        if (idx > 0) setLightbox(images[idx - 1]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, images, closeLightbox]);

  const handleFiles = (files) => {
    Array.from(files).forEach((f) => {
      if (!f.type.startsWith("image/")) return;
      uploadMutation.mutate(f);
    });
  };

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
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 font-medium">Screenshots / Images</label>

      <div className="flex flex-wrap gap-3">
        {/* Upload tile — same size as thumbnails */}
        <div className="flex flex-col items-center">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            title="Click, drag & drop, or paste (Ctrl+V)"
            className={`${THUMB} flex flex-col items-center justify-center gap-0.5 border-2 border-dashed rounded cursor-pointer transition-colors select-none ${
              dragging
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : uploadMutation.isError
                ? "border-red-600 hover:border-red-500 text-red-400"
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-700/40 text-slate-400"
            }`}
          >
            {uploadMutation.isPending ? (
              <span className="text-xs animate-pulse text-blue-400">…</span>
            ) : uploadMutation.isError ? (
              <>
                <span className="text-base leading-none">⚠</span>
                <span className="text-xs leading-tight">Failed</span>
              </>
            ) : (
              <>
                <span className="text-xl leading-none">📷</span>
                <span className="text-xs leading-tight">Add</span>
              </>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {/* Thumbnails */}
        {isLoading && (
          <div className={`${THUMB} flex items-center justify-center text-xs text-slate-500`}>
            Loading…
          </div>
        )}
        {images.map((img) => (
          <div key={img.id} className="relative group flex flex-col items-center">
            <div className="relative">
              <img
                src={img.data_url}
                alt={img.caption || img.filename}
                title={img.caption || img.filename}
                onClick={() => setLightbox(img)}
                className={`${THUMB} object-cover rounded border border-slate-600 cursor-zoom-in hover:border-blue-500 transition-colors`}
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center gap-3 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.data_url}
              alt={lightbox.caption || lightbox.filename}
              className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
            />
            {lightbox.caption && (
              <p className="text-slate-300 text-sm">{lightbox.caption}</p>
            )}
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute -top-1 -right-1 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-lg transition-colors"
              title="Close (Esc)"
            >
              ×
            </button>
            {images.length > 1 && (
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                {images.findIndex((i) => i.id === lightbox.id) + 1} / {images.length}
                <span className="text-slate-600">· arrow keys to navigate</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

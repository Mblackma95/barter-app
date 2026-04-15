"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import styles from "./ImageUploadField.module.css";

const maxListingImages = 3;
const maxImageSizeBytes = 5 * 1024 * 1024;

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function ImageUploadField() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        size: formatFileSize(file.size),
        url: URL.createObjectURL(file),
      })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  return (
    <div className={styles.field}>
      <label>
        Listing images
        <input
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []).slice(0, maxListingImages);
            const hasOversizedFile = selectedFiles.some((file) => file.size > maxImageSizeBytes);

            setFiles(selectedFiles);
            setError(hasOversizedFile ? "Image must be under 5MB" : "");
            event.currentTarget.setCustomValidity(hasOversizedFile ? "Image must be under 5MB" : "");
          }}
        />
      </label>
      <p>Up to 3 images. First image becomes the cover. JPG, PNG, or WEBP only. Max 5MB each.</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {previews.length ? (
        <div className={styles.previewGrid}>
          {previews.map((preview, index) => (
            <figure key={preview.url}>
              <img src={preview.url} alt={preview.name} />
              <figcaption>
                {index === 0 ? "Cover" : `Image ${index + 1}`} - {preview.size}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </div>
  );
}

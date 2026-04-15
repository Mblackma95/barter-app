"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import styles from "./ProfilePhotoField.module.css";

const maxProfileImageSizeBytes = 5 * 1024 * 1024;

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function ProfilePhotoField({ existingAvatarUrl }: { existingAvatarUrl?: string | null }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const preview = useMemo(() => {
    if (!file) {
      return null;
    }

    return {
      name: file.name,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    };
  }, [file]);

  useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  return (
    <div className={styles.field}>
      <label>
        Profile photo
        <input
          name="profilePhoto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            const hasOversizedFile = selectedFile
              ? selectedFile.size > maxProfileImageSizeBytes
              : false;

            setFile(selectedFile);
            setError(hasOversizedFile ? "Image must be under 5MB" : "");
            event.currentTarget.setCustomValidity(hasOversizedFile ? "Image must be under 5MB" : "");
          }}
        />
      </label>
      <p className={styles.helper}>JPG, PNG, or WEBP. Max 5MB.</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {preview ? (
        <div className={styles.preview}>
          <img src={preview.url} alt={preview.name} />
          <p>{preview.size}</p>
        </div>
      ) : existingAvatarUrl ? (
        <div className={styles.preview}>
          <img src={existingAvatarUrl} alt="Current profile photo" />
          <p>Current photo</p>
        </div>
      ) : null}
    </div>
  );
}

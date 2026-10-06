"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 15 * 1024 * 1024;
const DIRECT_UPLOAD_LIMIT = 3 * 1024 * 1024;
const CHUNK_BYTES = 1024 * 1024;

type UploadResult = {
  ok?: boolean;
  error?: string;
  url?: string;
  filename?: string;
  optimizedSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  width?: number;
  height?: number;
};

type FileInfo = {
  name: string;
  size: number;
  optimizedSize?: number;
  originalWidth?: number;
  originalHeight?: number;
  width?: number;
  height?: number;
};

type UploadPhase = "idle" | "uploading" | "optimizing" | "saved";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function postForm(
  form: FormData,
  onProgress: (ratio: number) => void,
  onUploaded?: () => void,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.total ? event.loaded / event.total : 0);
    };
    if (onUploaded) xhr.upload.onload = onUploaded;
    xhr.onerror = () => reject(new Error("Network error. Please try again."));
    xhr.onabort = () => reject(new Error("Network error. Please try again."));
    xhr.onload = () => {
      let data: UploadResult = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResult;
      } catch {
        // Reverse proxies can return plain-text errors for request-size limits.
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
        resolve(data);
        return;
      }
      reject(
        new Error(
          data.error ||
            (xhr.status === 413
              ? "The server rejected this upload because the request was too large."
              : "Image processing failed."),
        ),
      );
    };
    xhr.send(form);
  });
}

async function postCompletion(uploadId: string): Promise<UploadResult> {
  let response: Response;
  try {
    response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", uploadId }),
    });
  } catch {
    throw new Error("Network error. Please try again.");
  }

  let data: UploadResult = {};
  try {
    data = (await response.json()) as UploadResult;
  } catch {
    // Keep the error below clear if a proxy returns a non-JSON response.
  }
  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Image processing failed.");
  }
  return data;
}

export default function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const busy = phase === "uploading" || phase === "optimizing";

  useEffect(() => {
    if (!value) setFileInfo(null);
  }, [value]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  function clearLocalPreview() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreview(null);
  }

  async function onFile(file?: File) {
    if (!file || busy) return;
    setErr("");
    setPhase("idle");
    setProgress(0);

    if (file.size > MAX_BYTES) {
      setErr("Image is larger than 15 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size === 0) {
      setErr("Unsupported image format.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    clearLocalPreview();
    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreview(objectUrl);
    setFileInfo({ name: file.name, size: file.size });
    setPhase("uploading");

    try {
      let result: UploadResult;
      if (file.size <= DIRECT_UPLOAD_LIMIT) {
        const form = new FormData();
        form.append("file", file, file.name);
        result = await postForm(
          form,
          (ratio) => setProgress(Math.min(100, Math.round(ratio * 100))),
          () => {
            setPhase("optimizing");
            setProgress(100);
          },
        );
      } else {
        const uploadId = crypto.randomUUID();
        const totalParts = Math.ceil(file.size / CHUNK_BYTES);

        for (let partIndex = 0; partIndex < totalParts; partIndex += 1) {
          const start = partIndex * CHUNK_BYTES;
          const end = Math.min(file.size, start + CHUNK_BYTES);
          const form = new FormData();
          form.append("action", "chunk");
          form.append("uploadId", uploadId);
          form.append("filename", file.name);
          form.append("fileSize", String(file.size));
          form.append("partIndex", String(partIndex));
          form.append("totalParts", String(totalParts));
          form.append("file", file.slice(start, end), file.name);

          await postForm(form, (ratio) => {
            const completedBytes = start + (end - start) * ratio;
            setProgress(Math.min(99, Math.round((completedBytes / file.size) * 100)));
          });
        }

        setPhase("optimizing");
        setProgress(100);
        result = await postCompletion(uploadId);
      }

      if (!result.url) throw new Error("Image processing failed.");
      onChange(result.url);
      setFileInfo({
        name: result.filename || file.name,
        size: file.size,
        optimizedSize: result.optimizedSize,
        originalWidth: result.originalWidth,
        originalHeight: result.originalHeight,
        width: result.width,
        height: result.height,
      });
      clearLocalPreview();
      setPhase("saved");
      setProgress(100);
    } catch (error) {
      setPhase("idle");
      setProgress(0);
      setErr(error instanceof Error ? error.message : "Image processing failed.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void onFile(event.dataTransfer.files?.[0]);
  }

  function removeImage() {
    if (busy) return;
    onChange("");
    setFileInfo(null);
    setErr("");
    setPhase("idle");
    setProgress(0);
    clearLocalPreview();
  }

  const imageSrc = preview || value;
  const statusText =
    phase === "uploading"
      ? "Uploading..."
      : phase === "optimizing"
        ? "Optimizing image..."
        : phase === "saved"
          ? "Saved"
          : "";

  return (
    <div>
      <label className="eyebrow">Изображение</label>
      <div
        className={`mt-2 border border-dashed p-3 transition-colors ${
          dragging ? "border-ink bg-surface" : "border-line-strong bg-panel"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setDragging(false);
          }
        }}
        onDrop={onDrop}
      >
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden border border-line bg-surface">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt={fileInfo?.name || "Image preview"}
                className="h-full w-full object-cover"
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  setFileInfo((current) => {
                    if (!current) return current;
                    if (current.width && current.height) return current;
                    return { ...current, originalWidth: naturalWidth, originalHeight: naturalHeight };
                  });
                }}
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-center text-[0.6rem] text-faint">
                Нет фото
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <input
              type="text"
              value={value}
              disabled={busy}
              onChange={(event) => {
                onChange(event.target.value);
                setFileInfo(null);
                setErr("");
                setPhase("idle");
                clearLocalPreview();
              }}
              placeholder="https://… или загрузите ниже"
              className="field"
            />

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="btn btn-ghost justify-center text-xs disabled:cursor-wait disabled:opacity-60"
              >
                {busy ? "Загрузка…" : value ? "Заменить изображение" : "Загрузить изображение"}
              </button>
              <span className="text-xs text-faint">Maximum 15 MB · JPEG, PNG, WebP, GIF</span>
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => void onFile(event.target.files?.[0])}
                className="sr-only"
                tabIndex={-1}
                aria-label="Choose an image"
              />
            </div>

            <p className="text-xs text-faint">Yoki rasmni shu yerga sudrab keling.</p>

            {fileInfo && (
              <div className="space-y-0.5 text-xs text-muted">
                <p className="truncate" title={fileInfo.name}>{fileInfo.name}</p>
                <p>
                  {formatBytes(fileInfo.size)}
                  {fileInfo.optimizedSize ? ` → ${formatBytes(fileInfo.optimizedSize)}` : ""}
                  {fileInfo.originalWidth && fileInfo.originalHeight
                    ? ` · ${fileInfo.originalWidth} × ${fileInfo.originalHeight}px`
                    : ""}
                  {fileInfo.width && fileInfo.height &&
                  (fileInfo.width !== fileInfo.originalWidth || fileInfo.height !== fileInfo.originalHeight)
                    ? ` → ${fileInfo.width} × ${fileInfo.height}px`
                    : ""}
                </p>
              </div>
            )}

            {busy && (
              <div className="space-y-1.5" aria-live="polite">
                <p className="text-xs text-muted">{statusText} {phase === "uploading" ? `${progress}%` : ""}</p>
                <div
                  className="h-px w-full overflow-hidden bg-line"
                  role="progressbar"
                  aria-label="Image upload progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div className="h-full bg-ink transition-[width] duration-150" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {phase === "saved" && <p className="text-xs text-ink" role="status">Saved</p>}
            {err && <p className="text-xs text-red-500/90" role="alert">{err}</p>}

            {value && !busy && (
              <button
                type="button"
                onClick={removeImage}
                className="text-xs text-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                Rasmni olib tashlash
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

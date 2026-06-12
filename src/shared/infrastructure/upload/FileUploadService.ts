import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import multer from "multer";
import type { Request } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_UPLOADS_ROOT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "uploads",
);
const DEFAULT_IMAGES_ROOT = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "images",
);
export const UPLOADS_ROOT = DEFAULT_UPLOADS_ROOT;
export const IMAGES_ROOT = DEFAULT_IMAGES_ROOT;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  images: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
};

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
];

/**
 * Multer storage engine that organises files by tenantId and entityType.
 * File naming: {tenantId}/{entityType}/{timestamp}-{originalName}
 */
const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const tenantId = (req as any).tenantContext?.tenantId || "unknown";
    const entityType = (req as any).uploadEntityType || "general";
    const dest = path.join(UPLOADS_ROOT, tenantId, entityType);

    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    // Sanitise original name — remove spaces and special chars
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

/**
 * Multer file filter — validates allowed MIME types.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: jpg, jpeg, png, gif, webp, pdf, doc, docx, xls, xlsx`,
      ),
    );
  }
};

/**
 * Configured multer instance with storage, file filter, and size limit.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Returns multer middleware for single file upload.
 * Sets the entityType on the request for directory organisation.
 */
export function getUploadMiddleware(
  fieldName: string,
  entityType: string = "general",
) {
  return [
    // Inject entityType onto request before multer runs
    (req: Request, _res: any, next: any) => {
      (req as any).uploadEntityType = entityType;
      next();
    },
    upload.single(fieldName),
  ];
}

/**
 * Returns the relative file path (from project root) for a stored file.
 */
export function getRelativeFilePath(file: Express.Multer.File): string {
  const uploadsIndex = file.path.indexOf("uploads");
  if (uploadsIndex === -1) return file.path;
  return file.path.substring(uploadsIndex);
}

export { MAX_FILE_SIZE, ALL_ALLOWED_TYPES };

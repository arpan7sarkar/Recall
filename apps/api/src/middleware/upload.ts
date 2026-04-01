import multer from "multer";

// Max file size: default 20MB, configurable via MAX_FILE_UPLOAD_MB env var
const maxFileSizeMB = parseInt(process.env.MAX_FILE_UPLOAD_MB || "20", 10);
const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

// Store to memory buffer so we can stream directly to R2
const storage = multer.memoryStorage();

// Accept PDF and images only
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
    // Accept file
    cb(null, true);
  } else {
    // Reject file
    cb(new Error("Invalid file type. Only PDF and images are allowed.") as any, false);
  }
};

// Multer middleware instance
export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSizeBytes,
  },
  fileFilter,
});

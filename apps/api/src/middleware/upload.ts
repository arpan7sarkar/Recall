import multer from "multer";
import { Request } from "express";
import { ALLOWED_UPLOAD_TYPES, maxUploadBytes } from "./uploadContract";

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_UPLOAD_TYPES.includes(file.mimetype as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF and images are allowed."));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxUploadBytes(),
  },
});

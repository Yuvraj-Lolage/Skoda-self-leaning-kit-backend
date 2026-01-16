const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

/**
 * Allowed MIME types
 */
const FILE_TYPE_MIME_MAP = {
  Video: ["video/mp4", "video/webm", "video/ogg"],
  Presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  PDF: ["application/pdf"],
  Excel: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  word: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

/**
 * TEMP upload folder ONLY
 */
const TEMP_UPLOAD_PATH = path.join(
  process.env.SHARED_FOLDER,
  "__temp__"
);

if (!fs.existsSync(TEMP_UPLOAD_PATH)) {
  fs.mkdirSync(TEMP_UPLOAD_PATH, { recursive: true });
}

/**
 * Multer storage → TEMP ONLY
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOAD_PATH); // ✅ TEMP ONLY
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

/**
 * Multer middleware
 */
const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 500, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const fileType = req.headers["x-file-type"];
    const allowedMimeTypes = FILE_TYPE_MIME_MAP[fileType];

    if (!fileType) {
      return cb(new Error("x-file-type header missing"), false);
    }

    if (!allowedMimeTypes) {
      return cb(new Error(`Invalid fileType: ${fileType}`), false);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(`Invalid file format for ${fileType}`),
        false
      );
    }

    cb(null, true);
  },
});

module.exports = upload;

// Multer config for image uploads
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const explicitUploadsDir = String(process.env.UPLOADS_DIR || "").trim();
export const UPLOADS_DIR = explicitUploadsDir
  ? path.resolve(explicitUploadsDir)
  : path.resolve(__dirname, "../uploads");

const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
const cloudinaryFolder = String(process.env.CLOUDINARY_FOLDER || "baraa-store").trim();
const cloudinaryEnabled = Boolean(cloudName && apiKey && apiSecret);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

function makeDiskStorage() {
  return multer.diskStorage({
    destination: function (_req, _file, cb) {
      try {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        cb(null, UPLOADS_DIR);
      } catch (error) {
        cb(error, UPLOADS_DIR);
      }
    },
    filename: function (_req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
}

function makeMemoryStorage() {
  return multer.memoryStorage();
}

const upload = multer({
  storage: cloudinaryEnabled ? makeMemoryStorage() : makeDiskStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"));
  },
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB, max 10 files
});

export function isCloudinaryEnabled() {
  return cloudinaryEnabled;
}

async function uploadBufferToCloudinary(file) {
  const ext = path.extname(file.originalname || "").replace(".", "").toLowerCase() || "jpg";
  const resourceType = "image";
  const uploadResult = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
      resource_type: resourceType,
      folder: cloudinaryFolder,
      format: ext,
    },
  );

  return uploadResult?.secure_url || uploadResult?.url || "";
}

export async function getUploadedFileUrls(files) {
  const list = Array.isArray(files) ? files : [];
  if (list.length === 0) return [];

  if (!cloudinaryEnabled) {
    return list.map((file) => `/uploads/${file.filename}`);
  }

  const urls = [];
  for (const file of list) {
    if (!file?.buffer) continue;
    // eslint-disable-next-line no-await-in-loop
    const url = await uploadBufferToCloudinary(file);
    if (url) urls.push(url);
  }
  return urls;
}

export default upload;

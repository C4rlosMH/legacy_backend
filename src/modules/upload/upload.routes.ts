import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../../config';

const router = Router();

// --- Configuracion de Multer ---
// Guarda archivos en public/uploads con nombre unico basado en timestamp
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes (JPEG, PNG, WEBP, GIF).'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
});

// POST /api/v1/upload
// Body: multipart/form-data con campo "image"
// Devuelve: { url: "http://IP:PORT/uploads/filename.jpg" }
router.post('/', upload.single('image'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ message: 'No se recibio ninguna imagen.' });
    return;
  }

  // Construimos la URL publica que el movil puede consumir directamente
  const host = config.upload.serverUrl; // ej: "http://192.168.2.221:2700"
  const url = `${host}/uploads/${req.file.filename}`;

  res.status(200).json({
    message: 'Imagen subida exitosamente.',
    url,
    filename: req.file.filename,
  });
});

export default router;

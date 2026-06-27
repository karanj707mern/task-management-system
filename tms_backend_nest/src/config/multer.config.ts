import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';

const uploadDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const ALLOWED_DOC_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.md',
];

function sanitizeDocExtension(originalname: string): string {
  const ext = originalname.substring(originalname.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_DOC_EXTENSIONS.includes(ext)) {
    return ext;
  }
  return '.txt';
}

function sanitizeExtension(originalname: string): string {
  const ext = originalname.substring(originalname.lastIndexOf('.')).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    return ext;
  }
  return '.jpg';
}

export const multerAvatarConfig = {
  storage: diskStorage({
    destination: uploadDir,
    filename: (_, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = sanitizeExtension(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (_: unknown, file: { mimetype: string }, cb: (error: Error | null, accept: boolean) => void) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
    }
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
};

export const multerConfig = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads', 'documents'),
    filename: (_, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = sanitizeDocExtension(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (_: unknown, file: { mimetype: string; originalname: string }, cb: (error: Error | null, accept: boolean) => void) => {
    const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
      cb(new Error(`File type ${ext} is not allowed`), false);
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};

export default () => ({
  upload: {
    avatarDir: uploadDir,
    maxFileSize: 8 * 1024 * 1024,
  },
});
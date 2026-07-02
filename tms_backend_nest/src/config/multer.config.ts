import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';

const avatarUploadDir = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(avatarUploadDir)) {
  mkdirSync(avatarUploadDir, { recursive: true });
}

const docUploadDir = join(process.cwd(), 'uploads', 'documents');
if (!existsSync(docUploadDir)) {
  mkdirSync(docUploadDir, { recursive: true });
}

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const multerAvatarFileFilter = (
  _req: unknown,
  file: { mimetype: string; originalname: string },
  cb: (error: Error | null, accept: boolean) => void,
): void => {
  if (ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, webp, gif) are allowed'), false);
  }
};

export const multerAvatarLimits = {
  fileSize: 8 * 1024 * 1024,
};

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

export const multerConfig = {
  storage: diskStorage({
    destination: docUploadDir,
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

export const multerAvatarConfig = {
  storage: diskStorage({
    destination: avatarUploadDir,
    filename: (_, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: multerAvatarFileFilter,
  limits: multerAvatarLimits,
};

export default () => ({
  upload: {
    avatarDir: avatarUploadDir,
    maxFileSize: 8 * 1024 * 1024,
  },
});

// middleware/avatarGate.js
import fs from 'fs';
import path from 'path';

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ensure = (p) => (
  fs.existsSync(p) || fs.mkdirSync(p, { recursive: true }), p
);

const uploadsRoot = path.join(process.cwd(), 'uploads');
const avatarsDir = ensure(path.join(uploadsRoot, 'avatars'));

const publicUrlFromAbsPath = (absPath) => {
  const rel = absPath.split(uploadsRoot)[1].replace(/\\/g, '/'); // '/posts/abc.jpg'
  return `/uploads${rel}`; // → '/Uploads/posts/abc.jpg' (or '/Uploads/avatars/...')
};

export function avatarGate(moveToAvatars = true) {
  return async (req, res, next) => {
    // No file? That’s fine; user might be updating text fields only.
    if (!req.file) return next();

    const isImage = /^image\/(png|jpe?g|webp|gif)$/i.test(req.file.mimetype);
    const tooBig = req.file.size > AVATAR_MAX_SIZE;

    // If invalid, delete what multer wrote and fail.
    if (!isImage || tooBig) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch {}
      const why = !isImage
        ? 'Only image files allowed for profile photo'
        : 'Profile photo must be ≤ 5MB';
      return res.status(400).json({ success: false, message: why });
    }

    // Optional: move file from /Uploads/posts → /Uploads/avatars using the same multer file
    if (moveToAvatars) {
      const newPath = path.join(avatarsDir, path.basename(req.file.path));
      try {
        await fs.promises.rename(req.file.path, newPath);
        req.file.path = newPath;
      } catch (e) {
        // If moving fails, keep original path under /Uploads/posts
      }
    }

    // Add convenient fields for controller
    req.file.publicUrl = publicUrlFromAbsPath(req.file.path);
    req.file.filenameOnly = path.basename(req.file.path);

    next();
  };
}

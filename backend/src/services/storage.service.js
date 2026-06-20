const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({ region: process.env.AWS_REGION });

const BUCKET = process.env.AWS_S3_BUCKET;

// Only images, kept small — avatars don't need to be large files, and capping
// this early avoids someone uploading something absurd through this endpoint.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

const validateImage = (file) => {
  if (!file) {
    throw httpError(422, 'No file provided');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw httpError(422, 'Only JPEG, PNG, and WebP images are allowed');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw httpError(422, 'File must be under 5MB');
  }
};

// Uploads a buffer to S3 under a namespaced key and returns the public URL.
// Keys are namespaced by purpose and a fresh uuid filename so two users'
// uploads never collide and old avatars aren't overwritten in place (the
// caller is responsible for deleting the old one if replacing).
const uploadImage = async (file, { folder = 'avatars' } = {}) => {
  validateImage(file);

  const extension = file.mimetype.split('/')[1];
  const key = `${folder}/${uuidv4()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { key, url };
};

// Best-effort delete of a previous file when replacing it. Failure here
// shouldn't block the new upload from succeeding — an orphaned old file in
// S3 costs a few cents of storage, not worth failing the user's request over.
const deleteImage = async (key) => {
  if (!key) return;

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error(`S3 delete failed for key ${key}: ${err.message}`);
  }
};

module.exports = { uploadImage, deleteImage };
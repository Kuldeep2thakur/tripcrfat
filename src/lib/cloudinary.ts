const CLOUD_NAME = 'dbtxwousd';
const API_KEY = '387868558519787';
const UPLOAD_PRESET = 'miniproject';  // Using existing upload preset

export async function uploadToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || UPLOAD_PRESET);

  const res = await fetch(url, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // Cloudinary returns secure_url (string) along with other metadata.
  return data;
}

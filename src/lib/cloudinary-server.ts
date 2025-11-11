import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dbtxwousd',
  api_key: '387868558519787',
  api_secret: 'Do_kqgavMJ_l5-jqFzjF9jtCrTs',
});

export async function generateSignature(params: { [key: string]: any }) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, ...params },
    cloudinary.config().api_secret!
  );

  return { timestamp, signature };
}

export { cloudinary };
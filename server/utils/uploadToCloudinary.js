import cloudinary from "../config/cloudinary.js";

// Uploads an image buffer to Cloudinary, returns { url, public_id }
export const uploadToCloudinary = (buffer, folder = "shopease/products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// Deletes an image from Cloudinary by its public_id
export const deleteFromCloudinary = async (public_id) => {
  if (!public_id) return;
  await cloudinary.uploader.destroy(public_id);
};
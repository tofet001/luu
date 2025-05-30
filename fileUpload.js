const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload image to Cloudinary
const uploadToCloudinary = async filePath => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'lumina',
      use_filename: true,
      unique_filename: false,
      resource_type: 'auto'
    });

    // Delete file from server
    fs.unlinkSync(filePath);

    return result;
  } catch (err) {
    // Delete file from server if error occurs
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw err;
  }
};

module.exports = uploadToCloudinary;
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload a file to Cloudinary
const uploadFile = async (file) => {
    try {
        // Convert buffer to base64
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'goomer-reviews',
            resource_type: 'auto'
        });
        
        return result.secure_url;
    } catch (error) {
        throw new Error(`Could not upload file: ${error.message}`);
    }
};

// Helper function to delete a file from Cloudinary
const deleteFile = async (fileUrl) => {
    try {
        if (!fileUrl) return;
        
        // Extract public_id from URL
        const splitUrl = fileUrl.split('/');
        const filename = splitUrl[splitUrl.length - 1];
        const publicId = `goomer-reviews/${filename.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
    }
};

module.exports = {
    uploadFile,
    deleteFile
};

import axios from "axios";

const CLOUD_NAME = "dyio9wcoc";
const UPLOAD_PRESET = "yxg71cb0";

export const uploadToCloudinary = async (files) => {
    try {
        const uploadPromises = files.map((file) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", UPLOAD_PRESET);

            return axios.post(
                `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
                formData
            );
        });

        const responses = await Promise.all(uploadPromises);

        // trả về list URL
        return responses.map((res) => res.data.secure_url);
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
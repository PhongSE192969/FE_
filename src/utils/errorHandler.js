import toast from 'react-hot-toast';

export const handleError = (error, defaultMessage = 'Có lỗi xảy ra') => {
    console.error('Error:', error);

    let message = defaultMessage;

    if (error?.message) {
        message = error.message;
    } else if (typeof error === 'string') {
        message = error;
    }

    toast.error(message);
    return { success: false, message };
};

export const showSuccess = (message) => toast.success(message);
export const showError = (message) => toast.error(message);
export const showWarning = (message) => toast(message);  // 👈 toast.warn?
export const showInfo = (message) => toast(message);
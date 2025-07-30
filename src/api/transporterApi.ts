import axios from 'axios';

export const registerTransporter = async (data: FormData) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_REACT_APP_API_URL}/api/register/transporter/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

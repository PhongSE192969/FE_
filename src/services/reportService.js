import axios from "axios";

const API_BASE_URL = "http://localhost:3006"; // Cổng report-service

const reportService = {
  /**
   * Lấy dữ liệu dashboard
   */
  getDashboard: async () => {
    try {
      console.log("📡 Calling API:", API_BASE_URL + "/reports/dashboard");

      const response = await axios.get(`${API_BASE_URL}/reports/dashboard`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 15000, // Tăng timeout lên 15s
        withCredentials: false,
      });

      console.log("📥 API Response:", response.data);

      // BE trả về trực tiếp Map, không qua ApiResponse wrapper
      return response.data;
    } catch (error) {
      console.error("❌ API Error:", {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response,
      });
      throw error;
    }
  },

  /**
   * Lấy dashboard theo khoảng thời gian
   */
  getDashboardByDate: async (fromDate, toDate) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reports/dashboard`, {
        params: { from: fromDate, to: toDate },
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching dashboard by date:", error);
      throw error;
    }
  },
};

export default reportService;

import { loggingService } from './loggingService';

const API_BASE_URL = 'http://localhost:4000';

export const apiService = {
  async detectObjects(image: File) {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      // Log the API response
      loggingService.logAPIResponse('/detect', 'POST', data);

      return data;
    } catch (error) {
      loggingService.logAPIResponse('/detect', 'POST', null, error);
      throw error;
    }
  },

  async analyzeImage(image: File) {
    try {
      const formData = new FormData();
      formData.append('image', image);

      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      // Log the API response
      loggingService.logAPIResponse('/analyze', 'POST', data);

      return data;
    } catch (error) {
      loggingService.logAPIResponse('/analyze', 'POST', null, error);
      throw error;
    }
  }
};
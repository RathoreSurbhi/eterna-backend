import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;
  private backoffMultiplier: number;

  constructor(baseURL: string, timeout: number = 10000) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'EternaBackend/1.0',
      },
    });

    this.maxRetries = config.retry.maxRetries;
    this.retryDelay = config.retry.retryDelay;
    this.backoffMultiplier = config.retry.backoffMultiplier;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRetryableError(error: AxiosError): boolean {
    if (!error.response) {
      return true; // Network errors
    }

    const status = error.response.status;
    return status === 429 || status >= 500;
  }

  async get<T>(url: string, params?: any, retries = 0): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, { params });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (this.isRetryableError(axiosError) && retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(this.backoffMultiplier, retries);
        logger.warn(`Request failed, retrying in ${delay}ms... (Attempt ${retries + 1}/${this.maxRetries})`, {
          url,
          error: axiosError.message,
        });

        await this.sleep(delay);
        return this.get<T>(url, params, retries + 1);
      }

      logger.error('Request failed after retries', {
        url,
        error: axiosError.message,
        status: axiosError.response?.status,
      });

      throw error;
    }
  }

  async post<T>(url: string, data?: any, retries = 0): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;

      if (this.isRetryableError(axiosError) && retries < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(this.backoffMultiplier, retries);
        await this.sleep(delay);
        return this.post<T>(url, data, retries + 1);
      }

      throw error;
    }
  }
}

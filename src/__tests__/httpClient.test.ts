import { HttpClient } from '../utils/httpClient';
import axios from 'axios';

// Increase timeout for potentially slow retry tests in CI/local
jest.setTimeout(10000);

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
  let httpClient: HttpClient;
  const baseURL = 'https://api.example.com';

  beforeEach(() => {
    // Make axios.create return the mocked axios instance so instance.get/post are mocked
    mockedAxios.create.mockReturnValue(mockedAxios as any);
    httpClient = new HttpClient(baseURL);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should successfully fetch data', async () => {
      const mockData = { success: true, data: [] };
      mockedAxios.create.mockReturnThis();
      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await httpClient.get('/test');
      expect(result).toEqual(mockData);
    });

    it('should retry on network error', async () => {
      const mockError = new Error('Network error');
      mockedAxios.create.mockReturnThis();
      mockedAxios.get
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await httpClient.get('/test');
      expect(result).toEqual({ success: true });
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('should retry on 500 error', async () => {
      const mockError = {
        response: { status: 500 },
        message: 'Server error',
      };

      mockedAxios.create.mockReturnThis();
      mockedAxios.get
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ data: { success: true } });

      const result = await httpClient.get('/test');
      expect(result).toEqual({ success: true });
    });

    it('should not retry on 404 error', async () => {
      const mockError = {
        response: { status: 404 },
        message: 'Not found',
      };

      mockedAxios.create.mockReturnThis();
      mockedAxios.get.mockRejectedValue(mockError);

      await expect(httpClient.get('/test')).rejects.toEqual(mockError);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});

import axios, { AxiosInstance } from "axios";
import { getLogger } from "../utils/logger";
import config from ".";

const logger = getLogger();

type HttpClientOptions = {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
};

const DEFAULT_TIMEOUT = Number(process.env.HTTP_CLIENT_TIMEOUT ?? 5000);

export const createHttpClient = ({
  baseURL,
  timeout = DEFAULT_TIMEOUT,
  headers = {},
}: HttpClientOptions): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      logger.error(
        {
          err: error,
          ctx: {
            service: "HttpClient",
            baseURL,
          },
        },
        "HTTP request failed"
      );
      return Promise.reject(error);
    }
  );

  return instance;
};

const chatServiceBaseUrl = config.chatServiceUrl;

if (!chatServiceBaseUrl) {
  logger.warn(
    "CHAT_SERVICE_URL is not defined; chat service replication calls will fail."
  );
}

export const chatHttpClient = createHttpClient({
  baseURL: chatServiceBaseUrl,
  headers: {
    "x-internal-api-key": process.env.INBOUND_API_KEY ?? "",
  },
});


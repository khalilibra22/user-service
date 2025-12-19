import { chatHttpClient } from "../config/http";
import { getLogger } from "../utils/logger";

const log = getLogger();

export type ChatUserPayload = {
  userId: string;
  fullname?: string;
  email?: string;
  profileImage?: string;
};

export class ChatService {
  async createLightUser(payload: ChatUserPayload): Promise<void> {
    if (!chatHttpClient.defaults.baseURL) {
      log.warn(
        {
          ctx: {
            service: "ChatService",
            op: "createLightUser",
          },
        },
        "CHAT_SERVICE_URL is not configured; skipping chat sync."
      );
      return;
    }

    try {
      await chatHttpClient.post("/users", payload);
    } catch (error) {
      log.error(
        {
          err: error,
          ctx: {
            service: "ChatService",
            op: "createLightUser",
            payload,
          },
        },
        "Failed to sync user with chat service"
      );
      throw error;
    }
  }

  async updateLightUser(
    userId: string,
    payload: Omit<ChatUserPayload, "userId">
  ): Promise<void> {
    if (!chatHttpClient.defaults.baseURL) {
      log.warn(
        {
          ctx: {
            service: "ChatService",
            op: "updateLightUser",
          },
        },
        "CHAT_SERVICE_URL is not configured; skipping chat sync."
      );
      return;
    }

    try {
      await chatHttpClient.put(`/users/${userId}`, payload);
    } catch (error) {
      log.error(
        {
          err: error,
          ctx: {
            service: "ChatService",
            op: "updateLightUser",
            userId,
            payload,
          },
        },
        "Failed to update user in chat service"
      );
      throw error;
    }
  }

  async getOnlineStatusBulk(userIds: string[]): Promise<string[]> {
    if (!chatHttpClient.defaults.baseURL) {
      log.warn(
        {
          ctx: {
            service: "ChatService",
            op: "getOnlineStatusBulk",
          },
        },
        "CHAT_SERVICE_URL is not configured; returning empty list."
      );
      return [];
    }

    try {
      const response = await chatHttpClient.post<{ userId: string; isOnline: boolean }[]>("users/status/bulk", {
        userIds,
      });
      // Filter the response to return only IDs that are online
      // Assuming the API returns a list of objects like { userId: '...', isOnline: true }
      // Adjust if the API returns just a list of IDs directly
      if (Array.isArray(response.data)) {
        return response.data
          .filter((status: any) => status.isOnline)
          .map((status: any) => status.userId);
      }
      return [];

    } catch (error) {
      log.error(
        {
          err: error,
          ctx: {
            service: "ChatService",
            op: "getOnlineStatusBulk",
            userIds,
          },
        },
        "Failed to fetch bulk online status"
      );
      // For a filter, returning empty list (none online) is safer than crashing the search.
      return [];
    }
  }

  async getOnlineStatus(userId: string): Promise<boolean> {
    if (!chatHttpClient.defaults.baseURL) {
      log.warn(
        {
          ctx: {
            service: "ChatService",
            op: "getOnlineStatus",
            userId,
          },
        },
        "CHAT_SERVICE_URL is not configured; returning offline."
      );
      return false;
    }

    try {
      const response = await chatHttpClient.get<{ isOnline: boolean }>(`/users/${userId}/status`, { timeout: 1500 });
      return response.data.isOnline;
    } catch (error) {
      log.error(
        {
          err: error,
          ctx: {
            service: "ChatService",
            op: "getOnlineStatus",
            userId,
          },
        },
        "Failed to fetch online status"
      );
      return false;
    }
  }
}


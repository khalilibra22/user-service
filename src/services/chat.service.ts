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
}


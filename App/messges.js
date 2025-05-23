import { ApiClient } from '../client';

export const messagesService = {
  /**
   * Get messages for a conversation
   * @param {string} conversationId
   * @returns Promise<Array>
   */
  /*getMessages: async (contactUUID) => {
    // TODO: Implement this using the API endpoint https://docs.callbell.eu/api/reference/contacts_api/get_contact_messages
    throw new Error("Not implemented");
  },
*/

  /**
   * Get messages for a conversation
   * @param {string} contactUUID
   * @returns Promise<Array>
   */
  // getMessages: async (contactUUID) => {
  //   const client = ApiClient.getInstance();
  //   return client.get(`/contacts/${contactUUID}/messages`);
  // },

  getMessages: async (contactUUID) => {
    const client = ApiClient.getInstance();
    const response = await client.get(`/contacts/${contactUUID}/messages`, {
      params: { limit: 100 } // Adjust based on API requirements
    });
    return response; // Ensure response.messages contains all messages
  },

  /**
   * Send a message to a contact
   * @param {string} contactUUID
   * @param {string} text
   * @returns Promise<Object>
   */
  sendMessage: async (contactUUID, text) => {
    const client = ApiClient.getInstance();
    return client.post(`/contacts/${contactUUID}/conversation/note`, { text });
  },

  /**
   * Delete a message
   * @param {string}
   * @returns Promise<Object>
   */
  // deleteMessage: async (messageUUID) => {
  //   const data = { uuid: messageUUID };
  //   console.log('Deleting message with UUID:', messageUUID);
  //   const client = ApiClient.getInstance();
  //   return client.delete(`/messages`, { data });
  // }

  deleteMessage: async (messageUUID) => {
    const client = ApiClient.getInstance();
    console.log('Deleting message with UUID:', messageUUID);
    return client.delete(`/messages/${messageUUID}`);
  }
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { conversationsService } from '../api/services/conversations';
import { messagesService } from '../api/services/messages';
import { contactsService } from '../api/services/contacts';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Define types ---
type Conversation = {
  uuid: string;
  [key: string]: any;
};

type Contact = {
  uuid: string;
  [key: string]: any;
};

type Message = {
  id: string;
  [key: string]: any;
};

interface AppContextType {
  conversations: Conversation[];
  currentContact: Contact | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadContactDetails: (contactUUID: string) => Promise<Contact | null>;
  loadMessages: (contactUUID: string) => Promise<Message[]>;
  sendMessage: (contactUUID: string, text: string) => Promise<Message | null>;
  updateContact: (
    contactUUID: string,
    data: Partial<Contact>
  ) => Promise<Contact | null>;
  deleteConversation: (contactUUID: string) => Promise<boolean>;
  deleteMessage: (messageUUID: string) => Promise<boolean>;
  clearError: () => void;
}

// --- Create context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Hook to use context ---
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// --- Provider props ---
interface AppProviderProps {
  children: ReactNode;
}

// --- App Provider ---
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await conversationsService.getConversations();

      setConversations(response.contacts);
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadContactDetails = async (
    contactUUID: string
  ): Promise<Contact | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactsService.getContact(contactUUID);
      setCurrentContact(response.contact);
      return response.contact;
    } catch (err) {
      setError('Failed to load contact details');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // In AppProvider
  const sendMessage = async (
    contactUUID: string,
    text: string
  ): Promise<Message | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagesService.sendMessage(contactUUID, text);
      console.log('Send message response:', response);
      const newMessage = response.message || {
        uuid: response.uuid || Date.now().toString(),
        text,
        createdAt: new Date().toISOString(),
        outgoing: true
      };
      setMessages((prev) => [...prev, newMessage]);

      // Save to AsyncStorage
      const storedMessages = await AsyncStorage.getItem(
        `messages_${contactUUID}`
      );
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      await AsyncStorage.setItem(
        `messages_${contactUUID}`,
        JSON.stringify([...messages, newMessage])
      );

      return newMessage;
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contactUUID: string): Promise<Message[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagesService.getMessages(contactUUID);
      let fetchedMessages = response.messages || [];

      // Merge with locally stored messages
      const storedMessages = await AsyncStorage.getItem(
        `messages_${contactUUID}`
      );
      if (storedMessages) {
        const localMessages = JSON.parse(storedMessages);
        // Merge and deduplicate by uuid
        fetchedMessages = [
          ...fetchedMessages,
          ...localMessages.filter(
            (localMsg) =>
              !fetchedMessages.some((msg) => msg.uuid === localMsg.uuid)
          )
        ];
      }
      setMessages(fetchedMessages);
      return fetchedMessages;
    } catch (err) {
      setError('Failed to load messages');
      console.error('Load messages error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const _loadMessages = async (contactUUID: string): Promise<Message[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagesService.getMessages(contactUUID);
      setMessages(response.messages);
      return response.messages;
    } catch (err) {
      setError('Failed to load messages');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessages = async (
    contactUUID: string,
    text: string
  ): Promise<Message | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagesService.sendMessage(contactUUID, text);
      console.log('Send message response:', response); // Log full response
      const newMessage = response.message ||
        response.data || {
          uuid: Date.now().toString(),
          text,
          createdAt: new Date().toISOString(),
          outgoing: true
        };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const _sendMessage = async (
    contactUUID: string,
    text: string
  ): Promise<Message | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await messagesService.sendMessage(contactUUID, text);
      console.error({ contactUUID, text });
      console.error({ response });
      // setMessages((prev) => [...prev, response.data]);
      //  return response.message;
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (
    contactUUID: string,
    data: Partial<Contact>
  ): Promise<Contact | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await contactsService.updateContact(contactUUID, data);
      setCurrentContact(response.contact);

      setConversations((prev) =>
        prev.map((conv) =>
          conv.uuid === contactUUID ? { ...conv, ...response.contact } : conv
        )
      );

      return response.contact;
    } catch (err) {
      setError('Failed to update contact');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (contactUUID: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await conversationsService.deleteConversation(contactUUID);
      setConversations((prev) =>
        prev.filter((conv) => conv.uuid !== contactUUID)
      );
      return true;
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageUUID: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await messagesService.deleteMessage(messageUUID);
      setMessages((prev) => prev.filter((msg) => msg.uuid !== messageUUID));
      return true;
    } catch (err) {
      setError('Failed to delete message');
      console.error('Delete message error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // In AppContext.tsx
  const __deleteMessage = async (messageUUID: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await messagesService.deleteMessage(messageUUID);
      setMessages((prev) => prev.filter((msg) => msg.uuid !== messageUUID));
      return true;
    } catch (err) {
      setError('Failed to delete message');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const _deleteMessage = async (messageId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await messagesService.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      return true;
    } catch (err) {
      setError('Failed to delete message');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: AppContextType = {
    conversations,
    currentContact,
    messages,
    loading,
    error,
    loadConversations,
    loadContactDetails,
    loadMessages,
    sendMessage,
    updateContact,
    deleteConversation,
    deleteMessage,
    clearError
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

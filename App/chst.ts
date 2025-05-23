// app/chat.jsx
import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useAppContext } from '../src/context/AppContext';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { ErrorMessage } from '../src/components/ErrorMessage';
import { Avatar } from '../src/components/Avatar';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';

export default function ChatScreen() {
  const { contactUUID } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const flatListRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const {
    currentContact,
    messages,
    loading,
    error,
    loadContactDetails,
    loadMessages,
    sendMessage,
    deleteMessage
  } = useAppContext();

  useEffect(() => {
    if (contactUUID) {
      loadContactDetails(contactUUID);
      loadMessages(contactUUID);
    }
  }, [contactUUID]);

  useEffect(() => {
    if (currentContact) {
      router.setParams({
        title: currentContact.name || `+${currentContact.phone_number}`
      });
    }
  }, [currentContact]);

  const navigateToContactDetails = () => {
    router.push({
      pathname: '/contact',
      params: { contactUUID }
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await sendMessage(contactUUID, messageText.trim());
    setMessageText('');

    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  const handleDeleteMessage = (messageUUID) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const success = await deleteMessage(messageUUID);
              if (!success) {
                Alert.alert('Error', 'Failed to delete the message.');
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'Something went wrong while deleting the message.'
              );
              console.error('Delete error:', error);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const renderRightActions = (message) => {
    return (
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: 'red' }]}
        onPress={() => handleDeleteMessage(message.uuid)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }) => {
    const isOutgoing = item.uuid;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        enabled={!loading}
      >
        <View
          style={[
            styles.messageContainer,
            isOutgoing ? styles.outgoingMessage : styles.incomingMessage
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOutgoing
                ? [
                    styles.outgoingBubble,
                    { backgroundColor: Colors[colorScheme || 'light'].tint }
                  ]
                : [
                    styles.incomingBubble,
                    {
                      backgroundColor:
                        Colors[colorScheme || 'light'].icon + '30'
                    }
                  ]
            ]}
          >
            <Text
              style={[
                styles.messageText,
                {
                  color: isOutgoing
                    ? 'white'
                    : Colors[colorScheme || 'light'].text
                }
              ]}
            >
              {item.text}
            </Text>
            <Text
              style={[
                styles.timeText,
                {
                  color: isOutgoing
                    ? 'rgba(255,255,255,0.7)'
                    : Colors[colorScheme || 'light'].icon
                }
              ]}
            >
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
      </Swipeable>
    );
  };

  if (loading && messages && messages.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={() => loadMessages(contactUUID)} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        { backgroundColor: Colors[colorScheme || 'light'].background }
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {currentContact && (
        <TouchableOpacity
          style={styles.contactHeader}
          onPress={navigateToContactDetails}
        >
          <Avatar source={currentContact.profile_pic_url} size={40} />
          <View style={styles.contactInfo}>
            <Text
              style={[
                styles.contactName,
                { color: Colors[colorScheme || 'light'].text }
              ]}
            >
              {currentContact.name || `+${currentContact.phone_number}`}
            </Text>
            <Text
              style={[
                styles.contactDetails,
                { color: Colors[colorScheme || 'light'].icon }
              ]}
            >
              {currentContact.channel_type}
            </Text>
          </View>
          <Ionicons
            name='chevron-forward'
            size={24}
            color={Colors[colorScheme || 'light'].icon}
          />
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.uuid || item.createdAt + item.text}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <Text
            style={[
              styles.emptyText,
              { color: Colors[colorScheme || 'light'].text }
            ]}
          >
            No messages yet. Start the conversation!
          </Text>
        }
      />

      <View
        style={[
          styles.inputContainer,
          { borderTopColor: Colors[colorScheme || 'light'].icon + '30' }
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              color: Colors[colorScheme || 'light'].text,
              backgroundColor: Colors[colorScheme || 'light'].icon + '15'
            }
          ]}
          placeholder='Type a message...'
          placeholderTextColor={Colors[colorScheme || 'light'].icon}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: Colors[colorScheme || 'light'].tint }
          ]}
          onPress={handleSendMessage}
          disabled={!messageText.trim() || loading}
        >
          <Ionicons name='send' size={20} color='white' />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1'
  },
  contactInfo: {
    flex: 1,
    marginLeft: 10
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  contactDetails: {
    fontSize: 12
  },
  messagesList: {
    flexGrow: 1,
    padding: 10
  },
  messageContainer: {
    marginVertical: 5,
    flexDirection: 'row'
  },
  outgoingMessage: {
    justifyContent: 'flex-end'
  },
  incomingMessage: {
    justifyContent: 'flex-start'
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20
  },
  outgoingBubble: {
    borderTopRightRadius: 5
  },
  incomingBubble: {
    borderTopLeftRadius: 5
  },
  messageText: {
    fontSize: 16
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 25,
    borderTopWidth: 1,
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});

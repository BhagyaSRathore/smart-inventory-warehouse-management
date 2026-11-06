import React, {useState, useRef, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  Menu,
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react-native';
import API from '../../services/api';
import apis from '../../services/endpoint';
import {useDrawer} from '../../context/DrawerContext';
import {useAppTheme, ThemeColors} from '../../context/ThemeContext';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp?: string;
  isError?: boolean;
};

const SAMPLE_QUESTIONS = [
  'Which products are low in stock?',
  'What should I restock today?',
  'Which warehouse has the most stock?',
  'Which products may run out next week?',
  'What is the current stock of Laptop?',
];

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome-msg',
  role: 'assistant',
  content:
    "Hello! I'm your AI Warehouse & Inventory Assistant. I have live access to your products, stock levels, warehouse racks, and predictive data. How can I assist you today?",
};

const AIAssistantScreen = (_props: any) => {
  const {openDrawer} = useDrawer();
  const {theme, isDark} = useAppTheme();
  const styles = useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState('');

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const isNearBottomRef = useRef<boolean>(true);

  const scrollToBottom = useCallback((animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated});
    }, 100);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {layoutMeasurement, contentOffset, contentSize} = event.nativeEvent;
    const paddingToBottom = 60;
    const isClose =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    isNearBottomRef.current = isClose;
  };

  const handleContentSizeChange = () => {
    if (isNearBottomRef.current) {
      flatListRef.current?.scrollToEnd({animated: true});
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => {
        console.log('[AI Assistant] keyboardDidShow height:', e.endCoordinates.height);
        setKeyboardHeight(e.endCoordinates.height);
        if (isNearBottomRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 80);
        }
      },
    );

    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('[AI Assistant] keyboardDidHide');
        setKeyboardHeight(0);
      },
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : input).trim();

    if (!messageContent || isLoading) {
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setInputHeight(40);
    setErrorBanner('');
    setIsLoading(true);
    isNearBottomRef.current = true;
    scrollToBottom(true);

    try {
      const response = await API.post(apis.aiChat, {
        message: messageContent,
      });

      const reply =
        response?.data?.response ||
        response?.data?.message ||
        'I received the data, but no descriptive answer was returned.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: reply,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.log('AI Chat error:', err?.response?.data || err?.message);

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.message?.includes('Network')
          ? 'Network error. Please verify backend connection and try again.'
          : 'Unable to connect to AI Assistant. Please check if the backend is running.');

      setErrorBanner(errorMessage);

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        isError: true,
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_WELCOME,
        id: `welcome-${Date.now()}`,
      },
    ]);
    setInput('');
    setInputHeight(40);
    setErrorBanner('');
    isNearBottomRef.current = true;
    scrollToBottom(false);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return <View key={`empty-${idx}`} style={styles.lineBreak} />;
      }

      const isBullet =
        trimmed.startsWith('* ') ||
        trimmed.startsWith('- ') ||
        trimmed.startsWith('• ');

      const bulletText = isBullet ? trimmed.slice(2).trim() : trimmed;

      // Clean bold markdown markers **text** into readable text
      const cleanText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');

      if (isBullet) {
        return (
          <View key={`bullet-${idx}`} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={styles.botMessageText}>{cleanText}</Text>
          </View>
        );
      }

      return (
        <Text key={`line-${idx}`} style={styles.botMessageText}>
          {cleanText}
        </Text>
      );
    });
  };

  const renderListHeader = () => (
    <View style={styles.headerComponentContainer}>
      {/* Welcome / Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconBox}>
          <Bot size={22} color="#1769E0" />
        </View>
        <View style={styles.infoTextBox}>
          <Text style={styles.infoTitle}>Smart Warehouse Intelligence</Text>
          <Text style={styles.infoDesc}>
            Ask natural questions about low stock, predictions, warehouse
            locations, or restock suggestions.
          </Text>
        </View>
      </View>

      {/* Quick Prompts Suggestions */}
      <View style={styles.suggestionsContainer}>
        <View style={styles.suggestionsHeader}>
          <HelpCircle size={14} color={theme.textSecondary} />
          <Text style={styles.suggestionsTitle}>Suggested Inquiries</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {SAMPLE_QUESTIONS.map((question, index) => (
            <TouchableOpacity
              key={`chip-${index}`}
              style={styles.promptChip}
              onPress={() => handleSendMessage(question)}
              disabled={isLoading}
              activeOpacity={0.7}>
              <Text style={styles.promptChipText}>{question}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderListFooter = () => {
    if (!isLoading) {
      return null;
    }

    return (
      <View style={[styles.messageRow, styles.botRow, styles.thinkingRow]}>
        <View style={styles.avatarBot}>
          <Bot size={16} color="#FFFFFF" strokeWidth={2.2} />
        </View>
        <View style={[styles.messageBubble, styles.thinkingBubble]}>
          <ActivityIndicator size="small" color="#1769E0" />
          <Text style={styles.thinkingText}>
            AI is analyzing warehouse data...
          </Text>
        </View>
      </View>
    );
  };

  const renderMessageItem = ({item}: {item: ChatMessage}) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.botRow,
        ]}>
        {!isUser && (
          <View style={styles.avatarBot}>
            <Bot size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser
              ? styles.userBubble
              : item.isError
              ? styles.errorBubble
              : styles.botBubble,
          ]}>
          {isUser ? (
            <Text style={styles.userMessageText}>{item.content}</Text>
          ) : (
            <View style={styles.botContentContainer}>
              {renderFormattedContent(item.content)}
            </View>
          )}
        </View>

        {isUser && (
          <View style={styles.avatarUser}>
            <User size={16} color="#FFFFFF" strokeWidth={2.2} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={openDrawer}
          activeOpacity={0.7}>
          <Menu size={22} color="#1769E0" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.titleRow}>
            <Sparkles size={18} color="#1769E0" strokeWidth={2.2} />
            <Text style={styles.headerTitle}>AI Assistant</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Live Warehouse DB</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleResetChat}
          activeOpacity={0.7}>
          <RotateCcw size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        style={[
          styles.flexOne,
          Platform.OS === 'android' && {paddingBottom: keyboardHeight},
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessageItem}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderListFooter}
          ItemSeparatorComponent={MessageSeparator}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
        />

        {/* Error Banner */}
        {errorBanner ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#D64545" />
            <Text style={styles.errorBannerText}>{errorBanner}</Text>
          </View>
        ) : null}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {height: Math.max(40, Math.min(inputHeight, 110))},
            ]}
            value={input}
            onChangeText={txt => {
              setInput(txt);
              if (errorBanner) {
                setErrorBanner('');
              }
            }}
            onContentSizeChange={e => {
              setInputHeight(e.nativeEvent.contentSize.height);
            }}
            placeholder="Ask about inventory, stock, or restocks..."
            placeholderTextColor={theme.placeholderText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const MessageSeparator = () => <View style={{height: 12}} />;

export default AIAssistantScreen;

const getStyles = (theme: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    flexOne: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.headerBorder,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.headerButtonBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleContainer: {
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textPrimary,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DEF7EC',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginTop: 3,
      gap: 4,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#0E9F6E',
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      color: isDark ? '#34D399' : '#03543F',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 16,
    },
    headerComponentContainer: {
      marginBottom: 8,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(23, 105, 224, 0.12)' : '#EAF2FD',
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(23, 105, 224, 0.25)' : '#C6DCFB',
      alignItems: 'center',
      gap: 12,
    },
    infoIconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTextBox: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1769E0',
      marginBottom: 2,
    },
    infoDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
    },
    suggestionsContainer: {
      marginBottom: 12,
    },
    suggestionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    suggestionsTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chipsRow: {
      gap: 8,
      paddingVertical: 2,
    },
    promptChip: {
      backgroundColor: theme.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    promptChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textPrimary,
    },
    messageSeparator: {
      height: 12,
    },
    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    userRow: {
      justifyContent: 'flex-end',
    },
    botRow: {
      justifyContent: 'flex-start',
    },
    thinkingRow: {
      marginTop: 12,
    },
    avatarBot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    avatarUser: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? '#334155' : '#334E68',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    messageBubble: {
      maxWidth: '78%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 16,
    },
    userBubble: {
      backgroundColor: '#1769E0',
      borderBottomRightRadius: 4,
    },
    botBubble: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 4,
      shadowColor: theme.shadowColor,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    errorBubble: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
      borderBottomLeftRadius: 4,
    },
    thinkingBubble: {
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    thinkingText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
    userMessageText: {
      fontSize: 14,
      color: '#FFFFFF',
      lineHeight: 20,
      fontWeight: '500',
    },
    botContentContainer: {
      gap: 4,
    },
    botMessageText: {
      fontSize: 14,
      color: theme.textPrimary,
      lineHeight: 20,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingLeft: 4,
    },
    bulletDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: '#1769E0',
      marginTop: 8,
    },
    lineBreak: {
      height: 6,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
    },
    errorBannerText: {
      fontSize: 12,
      color: '#D64545',
      flex: 1,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.cardBg,
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: Platform.OS === 'ios' ? 12 : 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: 8,
    },
    textInput: {
      flex: 1,
      minHeight: 42,
      maxHeight: 110,
      backgroundColor: theme.inputBg,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: Platform.OS === 'ios' ? 10 : 8,
      paddingBottom: Platform.OS === 'ios' ? 10 : 8,
      fontSize: 14,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      textAlignVertical: 'top',
      includeFontPadding: true,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#1769E0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
      shadowColor: '#1769E0',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    sendButtonDisabled: {
      backgroundColor: isDark ? '#334155' : '#BCCCDC',
      shadowOpacity: 0,
      elevation: 0,
    },
  });

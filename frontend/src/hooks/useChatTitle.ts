import { useChat } from '../context/ChatContext';
import { DEFAULT_PAGE_TITLE, useTitle } from './useTitle';

const MAX_CHAT_TITLE_LENGTH = 60;

function cleanTitle(value: string | null | undefined) {
  if (!value) return '';

  return value
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHAT_TITLE_LENGTH)
    .trim();
}

/**
 * Hook to manage dynamic browser tab titles for chat sessions
 * Updates document.title based on chat state similar to ChatGPT behavior
 */
export function useChatTitle() {
  const {
    chatId,
    history,
    chats,
  } = useChat();

  const savedChatTitle = cleanTitle(chats.find((chat) => chat.id === chatId)?.title);
  const firstUserMessageTitle = cleanTitle(
    history.find((message) => message.role === 'user')?.content
  );
  const pageTitle = chatId ? savedChatTitle || firstUserMessageTitle || DEFAULT_PAGE_TITLE : DEFAULT_PAGE_TITLE;

  useTitle(pageTitle, { restoreTitle: 'New Chat | Career Aid' });
}

export default useChatTitle;

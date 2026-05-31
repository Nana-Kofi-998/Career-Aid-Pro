import { useEffect } from 'react';

/**
 * Default application name
 */
export const DEFAULT_APP_NAME = 'Career Aid';
export const DEFAULT_PAGE_TITLE = 'New Chat';

/**
 * Options for title configuration
 */
export interface TitleOptions {
  /** Loading state indicator (boolean or custom string) */
  loading?: boolean | string;
  /** Unread notification count */
  unreadCount?: number;
  /** Typing status indicator (boolean or custom string) */
  isTyping?: boolean | string;
  /** Separator between page title and app name */
  separator?: string;
  /** Application name (overrides default) */
  appName?: string;
  /** Title to restore when the component controlling the title unmounts */
  restoreTitle?: string;
}

/**
 * Builds a consistent browser tab title for the application.
 */
export function formatDocumentTitle(pageTitle: string, options: TitleOptions = {}) {
  const {
    loading = false,
    unreadCount,
    isTyping = false,
    separator = ' | ',
    appName = DEFAULT_APP_NAME,
  } = options;

  const titleParts: string[] = [];

  if (loading) {
    titleParts.push(typeof loading === 'string' ? loading : 'Loading...');
  }

  titleParts.push(pageTitle.trim() || DEFAULT_PAGE_TITLE);

  if (unreadCount && unreadCount > 0) {
    titleParts.push(`(${unreadCount})`);
  }

  if (isTyping) {
    titleParts.push(typeof isTyping === 'string' ? isTyping : 'typing...');
  }

  return `${titleParts.join(' ')}${separator}${appName}`;
}

/**
 * Custom hook to manage document title dynamically
 * @param pageTitle - The base title for the current page
 * @param options - Configuration options for title appearance
 */
export function useDocumentTitle(pageTitle: string, options: TitleOptions = {}) {
  useEffect(() => {
    document.title = formatDocumentTitle(pageTitle, options);

    return () => {
      if (options.restoreTitle) {
        document.title = options.restoreTitle;
      }
    };
  }, [
    pageTitle,
    options.loading,
    options.unreadCount,
    options.isTyping,
    options.separator,
    options.appName,
    options.restoreTitle,
  ]);
}

export const useTitle = useDocumentTitle;

/**
 * Imperative function to set document title from anywhere in the application
 * @param pageTitle - The base title for the current page
 * @param options - Configuration options for title appearance
 */
export function setTitle(pageTitle: string, options: TitleOptions = {}) {
  document.title = formatDocumentTitle(pageTitle, options);
}

export default useDocumentTitle;

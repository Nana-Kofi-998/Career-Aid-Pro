import { useLocation } from 'react-router-dom';
import { useTitle, TitleOptions } from './useTitle';

/**
 * Route-based title configuration
 * Maps route paths to their default titles
 */
const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/guidance': 'Guidance Hub',
  '/chat': 'Chat',
  '/cv-tools': 'CV Tools',
  '/cv-tools/cv-analyzer': 'CV Analyzer',
  '/cv-tools/cv-builder': 'CV Builder',
  '/personality': 'Personality',
  '/settings': 'Settings',
  '/about': 'About',
  '/faq': 'FAQ',
  '/login': 'Login',
  '/register': 'Register',
};

/**
 * Hook that automatically sets the document title based on the current route
 * Can be used at the app root level to handle all navigation title updates
 * 
 * @param options - Optional additional title configuration
 */
export function useRouteTitle(options: TitleOptions = {}) {
  const location = useLocation();
  
  // Find the best matching route title
  const getTitleForPath = (pathname: string): string => {
    // Exact match first
    if (ROUTE_TITLES[pathname]) {
      return ROUTE_TITLES[pathname];
    }
    
    // Check for partial matches (for nested routes like /chat?id=123)
    const pathWithoutQuery = pathname.split('?')[0];
    if (ROUTE_TITLES[pathWithoutQuery]) {
      return ROUTE_TITLES[pathWithoutQuery];
    }
    
    // Check parent paths
    const segments = pathWithoutQuery.split('/').filter(Boolean);
    for (let i = segments.length; i > 0; i--) {
      const parentPath = '/' + segments.slice(0, i).join('/');
      if (ROUTE_TITLES[parentPath]) {
        return ROUTE_TITLES[parentPath];
      }
    }
    
    // Default fallback
    return 'New Chat';
  };

  const pageTitle = getTitleForPath(location.pathname);
  
  useTitle(pageTitle, options);
}

export default useRouteTitle;

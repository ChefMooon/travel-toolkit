export const NON_DESKTOP_MAX_WIDTH = 767;

export function shouldShowFooter(pathname: string, viewportWidth: number) {
  const isTripRoute = pathname === '/trip' || pathname.startsWith('/trip/');
  const isNonDesktopViewport = viewportWidth <= NON_DESKTOP_MAX_WIDTH;

  return !(isTripRoute && isNonDesktopViewport);
}
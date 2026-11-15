export type BoardTheme = 'classic' | 'slate' | 'wood';

export interface BoardPalette {
  id: BoardTheme;
  label: string;
  light: string;
  dark: string;
  swatch: string;
}

export const BOARD_THEMES: Record<BoardTheme, BoardPalette> = {
  classic: {
    id: 'classic',
    label: 'Tournament Classic',
    light: '#EBECD0',
    dark: '#739552',
    swatch: '#739552',
  },
  slate: {
    id: 'slate',
    label: 'Ocean Slate',
    light: '#DEE3E6',
    dark: '#4B7399',
    swatch: '#4B7399',
  },
  wood: {
    id: 'wood',
    label: 'Midnight Wood',
    light: '#D4C4A8',
    dark: '#8B5A2B',
    swatch: '#8B5A2B',
  },
};

const THEME_ORDER: readonly BoardTheme[] = ['classic', 'slate', 'wood'];
const THEME_STORAGE_KEY = 'daily_chess_tactics_board_theme';

export function cycleBoardTheme(current: BoardTheme): BoardTheme {
  const idx = THEME_ORDER.indexOf(current);
  return THEME_ORDER[(idx + 1) % THEME_ORDER.length] ?? 'classic';
}

export function loadSavedBoardTheme(): BoardTheme {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'classic' || raw === 'slate' || raw === 'wood') {
      return raw;
    }
  } catch {
    // localStorage unavailable in sandboxed context
  }
  return 'classic';
}

export function saveBoardTheme(theme: BoardTheme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable in sandboxed context
  }
}

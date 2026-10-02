interface TelegramWebApp {
  expand(): void;
  ready(): void;
  close(): void;
  initData: string;
  initDataUnsafe: Record<string, any>;
  colorScheme: string;
  themeParams: Record<string, string>;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(cb: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: string): void;
    notificationOccurred(type: string): void;
    selectionChanged(): void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const tg = () => {
  return window.Telegram?.WebApp;
};

export const initTelegramApp = () => {
  const webApp = tg();
  if (webApp) {
    try {
      webApp.ready();
      webApp.expand();
      // Disable vertical swipe to prevent accidentally closing app on Android/iOS when scrolling
      if (webApp.disableVerticalSwipes) {
        webApp.disableVerticalSwipes();
      }
      if (webApp.setHeaderColor) {
        webApp.setHeaderColor('#E31E24');
      }
      if (webApp.setBackgroundColor) {
        webApp.setBackgroundColor('#F9FAFB');
      }
      webApp.enableClosingConfirmation?.();
    } catch (e) {
      console.warn("Telegram WebApp init error:", e);
    }
  }
};

export const hapticImpact = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
  try {
    tg()?.HapticFeedback?.impactOccurred(style);
  } catch (e) {
    // fallback
  }
};

export const hapticNotification = (type: 'error' | 'success' | 'warning' = 'success') => {
  try {
    tg()?.HapticFeedback?.notificationOccurred(type);
  } catch (e) {
    // fallback
  }
};

export const getTelegramUser = () => {
  const user = tg()?.initDataUnsafe?.user;
  if (user) {
    return {
      id: String(user.id),
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      username: user.username || '',
      fullName: [user.first_name, user.last_name].filter(Boolean).join(' ')
    };
  }
  return null;
};

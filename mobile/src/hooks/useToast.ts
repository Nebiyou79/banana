import Toast from 'react-native-toast-message';

export const useToast = () => ({
  showSuccess: (message: string, title = 'Success') =>
    Toast.show({ type: 'success', text1: title, text2: message }),

  showError: (message: string, title = 'Error') =>
    Toast.show({ type: 'error', text1: title, text2: message }),

  showInfo: (message: string, title = 'Info') =>
    Toast.show({ type: 'info', text1: title, text2: message }),
});
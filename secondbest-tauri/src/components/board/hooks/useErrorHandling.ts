import { useState, useCallback } from 'react';

/**
 * エラー処理（エラーメッセージ管理、エラー状態制御）を管理するhook
 */
export const useErrorHandling = () => {
  // エラー状態
  const [errorMessage, setErrorMessage] = useState<string>('');

  // エラーハンドリング関数
  const showErrorMessage = useCallback((message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  }, []);

  const clearErrorMessage = useCallback(() => {
    setErrorMessage('');
  }, []);

  return {
    // 状態
    errorMessage,
    
    // エラー処理関数
    showErrorMessage,
    clearErrorMessage,
  };
}; 
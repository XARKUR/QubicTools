/**
 * 通用错误处理函数
 */
interface ErrorResponse {
  success: boolean;
  message: string;
}

interface CustomError {
  message?: string;
  [key: string]: unknown;
}

export const handleError = (error: CustomError, context: string = ''): ErrorResponse => {
  console.error(`Error in ${context}:`, error);
  return {
    success: false,
    message: error.message || '操作失败，请重试'
  };
};

/**
 * API错误处理函数
 */
export const handleApiError = (error: CustomError): ErrorResponse => {
  console.error('API Error:', error);
  return {
    success: false,
    message: error.message || 'API请求失败，请重试'
  };
};

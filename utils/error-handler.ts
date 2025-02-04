import { toast } from 'sonner';
import { APIError } from '@/types/api';

export const handleAPIError = (error: unknown, fallbackMessage = '操作失败') => {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    toast.error(`请求失败: ${error.message}`);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  toast.error(fallbackMessage);
};

import { toast } from 'react-toastify';

export function popAuthInfo(content: string) {
  toast(content);
}

export function popAuthImportantInfo(content: string) {
  toast(content, { autoClose: 3000 });
}

export function popAuthError(content: string) {
  toast.error(content, { autoClose: 3000 });
}

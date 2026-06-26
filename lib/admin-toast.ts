import { toast, type ToastOptions } from "react-toastify";

export const darkToast: ToastOptions = { theme: "dark" };

export function toastError(message: string) {
  toast.error(message, darkToast);
}

export function toastSuccess(message: string) {
  toast.success(message, darkToast);
}

export function toastInfo(message: string) {
  toast.info(message, darkToast);
}

export type ToastPromiseMessages = {
  pending: string;
  success: string;
  error?: string;
};

export function toastPromise<T>(promise: Promise<T>, messages: ToastPromiseMessages): Promise<T> {
  return toast.promise(
    promise,
    {
      pending: messages.pending,
      success: messages.success,
      error: {
        render({ data }: { data: unknown }) {
          if (data instanceof Error) return data.message;
          return messages.error ?? "Erreur";
        },
      },
    },
    darkToast
  );
}

export function assertSuccess<T extends { success: boolean; message?: string }>(data: T): T {
  if (!data.success) throw new Error(data.message ?? "Erreur");
  return data;
}

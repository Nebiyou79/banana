// frontend/lib/error-handler.ts
import { toast } from "@/hooks/use-toast";

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const handleError = (error: unknown, defaultMessage?: string): void => {
  let errorMessage = defaultMessage || "Something went wrong";
  
  // Handle different error types
  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    errorMessage = 
      apiError?.response?.data?.message ||
      apiError?.message ||
      defaultMessage ||
      "Something went wrong";
  }
  
  toast({
    variant: "destructive",
    title: "Error",
    description: errorMessage,
  });
  
  console.error("Application Error:", error);
};

export const handleSuccess = (message: string): void => {
  toast({
    variant: "default",
    title: "Success",
    description: message,
  });
};

export const handleInfo = (message: string): void => {
  toast({
    variant: "default", 
    title: "Info",
    description: message,
  });
};
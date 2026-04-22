const UNKNOWN_ERROR_MESSAGE = "Something went wrong. Please try again.";

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error) {
    return error;
  }

  return UNKNOWN_ERROR_MESSAGE;
};

export const getDatabaseErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  const message = getErrorMessage(error);

  if (
    /row-level security|permission denied|not authorized|jwt/i.test(message)
  ) {
    return "You do not have permission to perform this action.";
  }

  if (/invalid input|violates|null value|constraint/i.test(message)) {
    return "The submitted data is invalid. Review the form and try again.";
  }

  return fallbackMessage;
};

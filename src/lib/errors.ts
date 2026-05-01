/**
 * Extracts a human-readable error message from any error type.
 * Works with standard Error objects, Supabase PostgrestError, AuthError, and plain objects.
 */
export function getErrorMessage(err: unknown): string {
  if (!err) return 'An unknown error occurred';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null) {
    // Supabase errors have .message
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    // Some errors have .error_description
    if ('error_description' in err && typeof (err as { error_description: unknown }).error_description === 'string') {
      return (err as { error_description: string }).error_description;
    }
  }
  return 'An unexpected error occurred';
}

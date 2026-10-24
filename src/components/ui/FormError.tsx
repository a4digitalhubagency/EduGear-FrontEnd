/** Server-error banner, same style as the login form's. Renders nothing without a message. */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{message}</p>;
}

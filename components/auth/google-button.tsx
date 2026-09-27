import { Button } from "@/components/ui/button";
import { googleSignInUrl } from "@/lib/auth";

export function GoogleButton() {
  return (
    <Button variant="outline" className="h-10 w-full" asChild>
      <a href={googleSignInUrl()}>
        <GoogleMark />
        Continue with Google
      </a>
    </Button>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
    >
      <path
        d="M12 4.8c1.7 0 3.2.6 4.4 1.6l2.6-2.6C17.2 2.2 14.8 1.2 12 1.2 7.7 1.2 3.9 3.7 2.2 7.4l3.1 2.4C6.2 6.8 8.9 4.8 12 4.8Z"
        fill="currentColor"
      />
      <path
        d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1.1 2.6-2.3 3.4l3 2.3c1.8-1.6 2.9-4 2.9-7.7Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M5.3 14.2A7.2 7.2 0 0 1 4.8 12c0-.8.1-1.5.4-2.2L2.1 7.4A10.8 10.8 0 0 0 1.2 12c0 1.7.4 3.3 1.1 4.7l3-2.5Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M12 22.8c2.8 0 5.2-.9 6.9-2.5l-3-2.3c-.9.6-2.1 1-3.9 1-3.1 0-5.8-2-6.7-4.8l-3.1 2.4c1.8 3.8 5.6 6.2 9.8 6.2Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

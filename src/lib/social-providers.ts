/**
 * Which social login providers are configured (server-only secrets present).
 * Used to hide buttons for providers that are not set up yet.
 */
export function getEnabledSocialProviders(): Array<
  "google" | "facebook" | "apple"
> {
  const enabled: Array<"google" | "facebook" | "apple"> = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    enabled.push("google");
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    enabled.push("facebook");
  }
  if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
    enabled.push("apple");
  }

  return enabled;
}

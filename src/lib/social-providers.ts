/**
 * Which social login providers are configured (server-only secrets present).
 * Used to hide buttons for providers that are not set up yet.
 */
export type SocialProvider = "google" | "facebook";

export function getEnabledSocialProviders(): SocialProvider[] {
  const enabled: SocialProvider[] = [];

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    enabled.push("google");
  }
  if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
    enabled.push("facebook");
  }

  return enabled;
}

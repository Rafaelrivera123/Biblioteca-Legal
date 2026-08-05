import { supersendtx } from "@/lib/supersendtx";

/** SuperSend TX automation trigger for the Welcome email flow. */
const WELCOME_EVENT = "user.created";

/**
 * Fire the SuperSend TX event that starts the Welcome email automation.
 * The dashboard automation owns the template and send — no local HTML.
 */
export async function triggerWelcomeAutomation(params: {
  userId: string;
  email: string;
  firstName: string;
}) {
  await supersendtx.events.trigger({
    name: WELCOME_EVENT,
    userId: params.userId,
    email: params.email,
    data: {
      name: params.firstName || "amigo/a",
    },
    idempotencyKey: `${WELCOME_EVENT}:${params.userId}`,
  });
}

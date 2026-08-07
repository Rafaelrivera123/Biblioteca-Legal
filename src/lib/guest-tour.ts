export const GUEST_TOUR_EVENT = "blhn-start-guest-tour";
export const DEMO_DOCUMENT_SLUG = "codigo-civil-honduras";

export function requestGuestTour() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(GUEST_TOUR_EVENT));
}

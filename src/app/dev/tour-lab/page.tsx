import TourLabClient from "./tour-lab-client";

export const metadata = {
  title: "Tour Lab · Biblioteca Legal HN",
  robots: { index: false, follow: false },
};

export default function TourLabPage() {
  return <TourLabClient />;
}

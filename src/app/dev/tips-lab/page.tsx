import TipsLabClient from "./tips-lab-client";

export const metadata = {
  title: "Tips Lab · Biblioteca Legal HN",
  robots: { index: false, follow: false },
};

export default function TipsLabPage() {
  return <TipsLabClient />;
}

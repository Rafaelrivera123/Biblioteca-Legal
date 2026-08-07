import HighlightContainer from "@/app/(website)/account/highlights/_components/highlights-container";

const Page = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E2A38]">Destacados</h2>
        <p className="text-sm text-gray-600 mt-1">
          Artículos que resaltaste con color
        </p>
      </div>
      <HighlightContainer />
    </div>
  );
};

export default Page;

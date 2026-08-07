import BookmarkContainer from "@/app/(website)/account/markers/_components/bookmark-container";

const Page = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E2A38]">Marcadores</h2>
        <p className="text-sm text-gray-600 mt-1">
          Artículos que guardaste para consultar después
        </p>
      </div>
      <BookmarkContainer />
    </div>
  );
};

export default Page;

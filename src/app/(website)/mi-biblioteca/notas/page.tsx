import NotesContainer from "@/app/(website)/account/notes/_components/notes-container";

const Page = () => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E2A38]">Notas</h2>
        <p className="text-sm text-gray-600 mt-1">
          Comentarios privados que dejaste en artículos
        </p>
      </div>
      <NotesContainer />
    </div>
  );
};

export default Page;

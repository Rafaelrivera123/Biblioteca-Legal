// src/app/(dashboard)/dashboard/documents/import/page.tsx
import DocumentImporter from "./_components/document-importer";

const Page = () => {
  return (
    <div className="space-y-[40px]">
      <h1 className="text-primary font-semibold text-[32px] leading-[120%]">
        Import Document from Word
      </h1>
      <DocumentImporter />
    </div>
  );
};
export default Page;

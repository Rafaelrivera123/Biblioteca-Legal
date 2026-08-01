import { Button } from "@/components/ui/button";
import Link from "next/link";
import ManageDocumentContainer from "./_components/manage-document-container";
const Page = async () => {
  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Documents
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="min-h-[45px] w-full sm:w-auto" variant="outline">
            <Link href="/dashboard/documents/import">Import</Link>
          </Button>
          <Button asChild className="min-h-[45px] w-full sm:w-auto">
            <Link href="/dashboard/documents/new">Add Document</Link>
          </Button>
        </div>
      </div>
      <ManageDocumentContainer />
    </div>
  );
};
export default Page;

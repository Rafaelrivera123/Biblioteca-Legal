import AddCompanyModal from "@/components/shared/modals/add-company-modal";
import { Button } from "@/components/ui/button";
import CompanyCardsContainer from "./_components/company-cards-container";

const Page = () => {
  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Manage Company
        </h1>

        <AddCompanyModal
          trigger={
            <Button className="h-[45px] w-full sm:w-auto">Add Company</Button>
          }
        />
      </div>

      <CompanyCardsContainer />
    </div>
  );
};

export default Page;

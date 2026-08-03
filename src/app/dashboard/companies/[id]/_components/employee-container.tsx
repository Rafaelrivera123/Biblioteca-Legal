import { siteAssets } from "@/helper/assets";
import AddEmployeeModal from "@/components/shared/modals/add-company-employee-modal";
import { Button } from "@/components/ui/button";
import { User } from "@prisma/client";
import EmployeeCard from "./employee-card";

interface Props {
  users: User[] | [];
  companyId: string;
}
const EmployeeContainer = ({ users, companyId }: Props) => {
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-semibold text-[20px] leading-[120%]">
          Employee Lists ({users.length})
        </h1>

        <AddEmployeeModal
          trigger={<Button className="w-full sm:w-auto">Add Employee</Button>}
          companyId={companyId}
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
        {users.map((item) => (
          <EmployeeCard
            key={item.id}
            profileImage={item.image ?? siteAssets.employeePlaceholder}
            firstName={item.first_name}
            email={item.email}
            lastName={item.last_name}
            emailVerified={!!item.emailVerified}
            userId={item.id}
            companyId={companyId}
          />
        ))}
      </div>
    </div>
  );
};

export default EmployeeContainer;

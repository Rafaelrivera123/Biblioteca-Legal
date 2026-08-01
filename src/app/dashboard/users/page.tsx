import ManageUserContainer from "./_components/manage-user-container";
import ManageUserHeader from "./_components/manage-user-header";

const Page = async () => {
  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Manage User
        </h1>

        <ManageUserHeader />
      </div>

      <ManageUserContainer />
    </div>
  );
};

export default Page;

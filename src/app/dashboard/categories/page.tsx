import CategoryCard from "@/components/shared/cards/category-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import dynamic from "next/dynamic";
const AddCategoryDialog = dynamic(
  () => import("@/components/shared/modals/add-category-modal"),
  {
    ssr: false,
  }
);

const Page = async () => {
  const allCategories = await prisma.category.findMany();
  return (
    <div>
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h1 className="text-primary font-semibold text-[26px] sm:text-[32px] leading-[120%]">
          Manage Category
        </h1>

        <AddCategoryDialog
          trigger={
            <Button className="h-[45px] w-full sm:w-auto">Add Category</Button>
          }
        />
      </div>

      <div className="flex flex-wrap gap-3 sm:gap-x-8 sm:gap-y-6 mt-10 sm:mt-[80px]">
        {allCategories.map((item) => (
          <CategoryCard key={item.id} data={item} />
        ))}
      </div>
    </div>
  );
};

export default Page;

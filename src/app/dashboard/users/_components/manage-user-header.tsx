"use client";

import { Input } from "@/components/ui/input";
import { useManageUserSearchStore } from "@/store/dashboard/users";
import { Search } from "lucide-react";

const ManageUserHeader = () => {
  const { query, setQuery } = useManageUserSearchStore();
  return (
    <div>
      <Input
        className="min-w-[400px]"
        placeholder="Search by name, email..."
        endIcon={Search}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default ManageUserHeader;

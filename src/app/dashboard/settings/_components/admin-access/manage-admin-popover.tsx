"use client";

import { makeAdmin } from "@/actions/auth/admin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useDebounce from "@/hooks/useDebounce";
import { User } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Shield, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export interface UserPaginationResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  } | null;
}

const ManageAdminPopover = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pending, startTransition] = useTransition();

  const searchQuery = useDebounce(input, 500);

  const { data, isLoading, isError, error, refetch } =
    useQuery<UserPaginationResponse>({
      queryKey: ["users", searchQuery],
      queryFn: () =>
        fetch(`/api/users?query=${searchQuery}&page=${1}&limit=10`).then(
          (res) => res.json()
        ),
    });

  const handleMakeAdmin = (id: string) => {
    startTransition(() => {
      makeAdmin(id).then((res) => {
        if (!res.success) {
          toast.error(res.message);
        }

        // handle success
        refetch();
        setOpen(false);
        toast.success(res.message);
      });
    });
  };

  let content;

  if (isLoading) {
    content = (
      <div className="h-[150px] w-full flex justify-center items-center">
        <Loader2 className="animate-spin " />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="h-[150px] w-full flex justify-center items-center">
        <p className="text-red-500">{error.message}</p>
      </div>
    );
  } else {
    content = (
      <CommandGroup heading="Users">
        {data?.data?.users.map((user) => (
          <CommandItem
            key={user.id}
            className="flex items-center justify-between"
            disabled={pending}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.image || "/placeholder.svg"}
                  alt={user.first_name}
                />
                <AvatarFallback>
                  {user.first_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user.first_name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.role === "admin" ? (
              <Badge
                variant="secondary"
                className="ml-auto text-primary hover:text-primary/80"
              >
                Admin
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto text-primary hover:text-primary/80"
                disabled={pending}
                onClick={() => handleMakeAdmin(user.id)}
              >
                <Shield className="mr-1 h-3 w-3" />
                Make Admin
              </Button>
            )}
          </CommandItem>
        ))}
      </CommandGroup>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
     <PopoverTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Manage Admin Access
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="end"
        side="bottom"
        sideOffset={5}
        style={{ width: 400 }}
      >
      >
        <Command>
          <CommandInput
            placeholder="Search users..."
            value={input}
            onValueChange={(v) => setInput(v)}
            disabled={pending}
          />
          <CommandList>
            {!isLoading ||
              (!isError && <CommandEmpty>No users found.</CommandEmpty>)}
            {content}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ManageAdminPopover;

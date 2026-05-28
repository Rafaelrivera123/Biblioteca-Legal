"use client";

import { removeWatchLater, watchLater } from "@/actions/watch-later";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useDebounce from "@/hooks/useDebounce";
import { extractNumber } from "@/lib/utils";
import { useArticleSearchStore } from "@/store/collections";
import { Document, WatchLists } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface apiProps {
  success: boolean;
  message: string;
  data: WatchLists;
}

interface Props {
  document: Document;
  hasFullAccess: boolean;
}

const CollectionHeader = ({ document, hasFullAccess }: Props) => {
  const [value, setvalue] = useState("");
  const [pending, startTransition] = useTransition();
  const { setQuery } = useArticleSearchStore();

  const { data, isLoading, refetch } = useQuery<apiProps>({
  queryKey: ["watchlist", document.id],
  queryFn: () =>
    fetch(`/api/watch-later/${document.id}`).then((res) => res.json()),
  enabled: isLoggedin,
});
  });

  const isWatched = data?.success;
  const loading = pending || isLoading;

  const watchListHandle = () => {
    if (!data?.success) {
      startTransition(() => {
        watchLater(document.id).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          else if (res.success) {
            refetch();
          }
        });
      });
    } else {
      startTransition(() => {
        removeWatchLater(document.id).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          }

          // handle success
          refetch();
        });
      });
    }
  };

  const debouncesvalue = useDebounce(value, 1000);

  useEffect(() => {
    if (debouncesvalue) {
      const number = extractNumber(debouncesvalue);
      setQuery(number?.toString() ?? "");
    }
  }, [debouncesvalue, setQuery]);

  return (
    <div className=" mt-28 container flex flex-col justify-center items-center gap-y-6">
      <h1 className="font-bold text-[30px] md:text-[35px] lg:text-[40px] leading-[120%] text-center">
        {document.name}
      </h1>

      {hasFullAccess && (
        <>
          <Input
            placeholder="Search by article number..."
            className="max-w-[600px] mx-auto"
            value={value}
            onChange={(e) => {
              setvalue(e.target.value);
            }}
          />

          <Button
            variant="outline"
            className="text-primary hover:text-primary/80"
            disabled={loading}
            onClick={watchListHandle}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isWatched ? (
              <Check />
            ) : (
              <Clock />
            )}{" "}
            {isWatched ? "Eliminar la lista de seguimiento" : "Guardar"}
          </Button>
        </>
      )}
    </div>
  );
};

export default CollectionHeader;

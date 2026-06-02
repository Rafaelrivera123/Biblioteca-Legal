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
  isLoggedin: boolean;
}

const CollectionHeader = ({ document, hasFullAccess, isLoggedin }: Props) => {
  const [value, setvalue] = useState("");
  const [pending, startTransition] = useTransition();
  const [isScrolled, setIsScrolled] = useState(false);
  const { setQuery } = useArticleSearchStore();

  const { data, isLoading, refetch } = useQuery<apiProps>({
    queryKey: ["watchlist", document.id],
    queryFn: () =>
      fetch(`/api/watch-later/${document.id}`).then((res) => res.json()),
    enabled: isLoggedin,
  });

  const isWatched = data?.success;
  const loading = pending || isLoading;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const watchListHandle = () => {
    if (!data?.success) {
      startTransition(() => {
        watchLater(document.id).then((res) => {
          if (!res.success) {
            toast.error(res.message);
            return;
          } else if (res.success) {
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
    } else {
      setQuery("");
    }
  }, [debouncesvalue, setQuery]);

  return (
    <>
      {/* Header estático con título */}
      <div className="mt-28 container flex flex-col justify-center items-center gap-y-6">
        <h1 className="font-bold text-[30px] md:text-[35px] lg:text-[40px] leading-[120%] text-center">
          {document.name}
        </h1>
        {hasFullAccess && !isScrolled && (
          <div className="w-full max-w-[600px] mx-auto flex flex-col items-center gap-y-3">
            <Input
              placeholder="Buscar por número de artículo..."
              className="w-full"
              value={value}
              onChange={(e) => setvalue(e.target.value)}
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
          </div>
        )}
      </div>

      {/* Barra sticky que aparece al hacer scroll */}
      {hasFullAccess && isScrolled && (
        <div className="fixed top-[64px] left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10 shadow-sm py-3 px-4">
          <div className="container mx-auto flex items-center gap-3 max-w-[800px]">
            <Input
              placeholder="Buscar por número de artículo..."
              className="flex-1"
              value={value}
              onChange={(e) => setvalue(e.target.value)}
            />
            {value && (
              <Button
                variant="outline"
                className="text-primary hover:text-primary/80 shrink-0"
                onClick={() => {
                  setvalue("");
                  setQuery("");
                }}
              >
                Limpiar
              </Button>
            )}
            <Button
              variant="outline"
              className="text-primary hover:text-primary/80 shrink-0"
              disabled={loading}
              onClick={watchListHandle}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : isWatched ? (
                <Check size={16} />
              ) : (
                <Clock size={16} />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default CollectionHeader;

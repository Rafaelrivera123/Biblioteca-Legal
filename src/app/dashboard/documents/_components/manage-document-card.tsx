"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document } from "@prisma/client";
import {
  Calendar,
  ClipboardList,
  ExternalLink,
  FileText,
  Pencil,
  Settings,
} from "lucide-react";
import moment from "moment";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";

const ArticleReviewModal = dynamic(() => import("./article-review-modal"), { ssr: false });

interface Props {
  document?: Document;
}

const ManageDocumentCard = ({ document }: Props) => {
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
      {document && (
        <ArticleReviewModal
          documentId={document.id}
          documentName={document.name}
          documentData={{
            name: document.name,
            slug: document.slug ?? null,
            short_description: document.short_description,
            law_number: document.law_number,
          }}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
        />
      )}
      <Card className="w-full bg-white max-w-[422px] rounded-[8px] border-[1px] p-[20px] border-[#000000]/20">
        <div className="flex justify-between">
          <h2 className="text-primary font-bold text-[24px] leading-[120%]">
            {document?.name}
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-10">
              <Button
                size="icon"
                variant="outline"
                className="text-primary hover:text-primary/80"
              >
                <Settings />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/dashboard/documents/edit/${document?.id}`}
                    className="flex items-center cursor-pointer hover:bg-gray-100"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/collections/${document?.id}`}
                    className="flex items-center cursor-pointer hover:bg-gray-100"
                  >
                    <ExternalLink className="h-4 w-4" /> View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center cursor-pointer hover:bg-gray-100"
                  onClick={() => setReviewOpen(true)}
                >
                  <ClipboardList className="h-4 w-4" /> Revisar artículos
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="mt-[15px] text-primary font-semibold text-[14px] leading-[120%] tracking-[0%]">
          {document?.short_description}
        </p>
        <CardContent className="p-0">
          <div className="mt-[20px] flex items-center gap-x-[13px] text-[#0D99FF]">
            <FileText className="h-5 w-5" />
            <span className="font-poppins">Law No. {document?.law_number}</span>
          </div>
          <div className="mt-[20px] flex items-center gap-x-[13px] text-black">
            <Calendar className="h-5 w-5" />
            <span className="font-poppins text-[12px]">
              Published: {moment(document?.publishedAt).format("MMMM D, YYYY")}
            </span>
          </div>
          <div className="mt-[20px] flex items-center gap-x-[13px] text-black">
            <Calendar className="h-5 w-5" />
            <span className="font-poppins text-[12px]">
              Created At: {moment(document?.createdAt).fromNow()}
            </span>
          </div>
          <div className="mt-[20px] flex flex-wrap gap-[10px] font-poppins font-normal">
            {document?.categories.map(({ name, id }) => (
              <Badge className="font-light" key={id}>
                {name}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="p-0">
          {document && (
            <Button className="w-full mt-[30px]" asChild>
              <Link
                className="w-full"
                href={`/dashboard/documents/${document.id}`}
              >
                Manage Document
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
};

export default ManageDocumentCard;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Document } from "@prisma/client";
import { Calendar, FileText } from "lucide-react";
import moment from "moment";
import Link from "next/link";

interface Props {
  document?: Document;
}

const DocumentCard = ({ document }: Props) => {
  return (
    <div className="w-full bg-white max-w-[422px] rounded-[8px] border-[1px] p-[20px] border-[#000000]/20">
      <div className="flex justify-between">
        <h2 className="text-primary font-bold text-[24px] leading-[120%]">
          {document?.name}
        </h2>
      </div>
      <p className="mt-[15px] text-primary font-semibold text-[14px] leading-[120%] tracking-[0%]">
        {document?.short_description}
      </p>

      <div className="mt-[20px] flex items-center gap-x-[13px] text-[#0D99FF]">
        <FileText className="h-5 w-5" />
        <span className="font-poppins">{document?.law_number}</span>
      </div>
      <div className="mt-[20px] flex items-center gap-x-[13px] text-black">
        <Calendar className="h-5 w-5" />
        <span className="font-poppins text-[12px]">
          Actualizado: {moment(document?.createdAt).format("MMMM D, YYYY")}
        </span>
      </div>

      <div className="mt-[20px] flex flex-wrap gap-[10px] font-poppins font-normal">
        {document?.categories.map(({ name, id }) => (
          <Badge className="font-light" key={id}>
            {name}
          </Badge>
        ))}
      </div>

      {document && (
        <Button className="w-full mt-[30px] " asChild>
          <Link className="w-full" href={`/collections/${document.id}`}>
            Ver documento
          </Link>
        </Button>
      )}
    </div>
  );
};

export default DocumentCard;

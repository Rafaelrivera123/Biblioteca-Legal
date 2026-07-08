"use client";
import xss from "xss";
interface Props {
  content: string;
}
const ContentViewer = ({ content }: Props) => {
  const cleanHTML = xss(content, {
    whiteList: {
      p: [],
      b: [],
      strong: [],
      em: [],
      i: [],
      u: [],
      ol: ["type", "start"],
      ul: [],
      li: [],
      br: [],
      span: ["style"],
      table: ["border", "cellpadding", "cellspacing", "width"],
      thead: [],
      tbody: [],
      tfoot: [],
      tr: [],
      td: ["colspan", "rowspan", "width", "align", "valign"],
      th: ["colspan", "rowspan", "width", "align", "valign"],
      caption: [],
    },
  });
  return (
    <div
      className="text-[14px] leading-[200%] space-y-2
        [&_ol]:pl-8 [&_ol]:my-2 [&_ol]:space-y-1
        [&_ol[type='a']]:list-[lower-alpha]
        [&_ol[type='A']]:list-[upper-alpha]
        [&_ol[type='i']]:list-[lower-roman]
        [&_ol[type='I']]:list-[upper-roman]
        [&_ol:not([type])]:list-decimal
        [&_ol_ol:not([type])]:list-[lower-alpha]
        [&_ol_ol_ol:not([type])]:list-[lower-roman]
        [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:my-2 [&_ul]:space-y-1
        [&_li]:leading-[180%] [&_li]:pl-1
        [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_table]:whitespace-normal
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-[13px]
        [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-medium [&_th]:bg-muted
        [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top
        [&_tr:nth-child(even)_td]:bg-muted/30"
      dangerouslySetInnerHTML={{
        __html: cleanHTML,
      }}
    />
  );
};
export default ContentViewer;

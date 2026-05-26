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
        [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:my-2 [&_ul]:space-y-1
        [&_li]:leading-[180%] [&_li]:pl-1"
      dangerouslySetInnerHTML={{
        __html: cleanHTML,
      }}
    />
  );
};

export default ContentViewer;

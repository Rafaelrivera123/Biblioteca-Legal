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
      ol: [],
      ul: [],
      li: [],
      br: [],
      span: ["style"],
    },
  });

  return (
    <div
      className="text-[14px] leading-[200%] space-y-2 
        [&_ol]:list-decimal [&_ol]:pl-8 [&_ol]:my-2 [&_ol]:space-y-1
        [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:my-2 [&_ul]:space-y-1
        [&_li]:leading-[180%] [&_li]:pl-1"
      dangerouslySetInnerHTML={{
        __html: cleanHTML,
      }}
    />
  );
};

export default ContentViewer;

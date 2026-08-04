import { memo } from "react";

interface Props {
  sectionTitle: string;
  chapterTitle: string;
}

const ArticleHeader = ({ sectionTitle, chapterTitle }: Props) => {
  return (
    <div className="container space-y-4 sm:space-y-[20px] py-8 sm:py-[50px] px-4">
      {sectionTitle ? (
        <h1 className="text-black font-bold leading-[120%] text-[22px] sm:text-[25px] md:text-[30px] lg:text-[40px] text-center break-words">
          {sectionTitle}
        </h1>
      ) : null}

      <h3 className="text-[20px] sm:text-[22px] md:text-[25px] lg:text-[32px] text-center leading-[120%] font-semibold break-words">
        {chapterTitle}
      </h3>
    </div>
  );
};

export default memo(ArticleHeader);

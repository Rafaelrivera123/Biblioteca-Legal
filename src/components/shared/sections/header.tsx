// components/HeaderSection.tsx

import Image from "next/image";

interface HeaderSectionProps {
  imageUrl: string;
  title: string;
  description: string;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  imageUrl,
  title,
  description,
}) => {
  return (
    <div className="relative min-h-[320px] sm:min-h-[400px] md:h-[547px] w-full overflow-hidden">
      {/* Background image */}
      <Image src={imageUrl} fill alt={title} className="object-cover" sizes="100vw" />

      {/* Black transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />

      {/* Content Layer */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4 pt-[60px]">
        <h1 className="text-[26px] sm:text-[30px] md:text-[40px] lg:text-[60px] font-bold leading-[120%] break-words">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 md:mt-[25px] text-[12px] md:text-[16px] font-normal leading-[120%] lg:text-[18px] max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default HeaderSection;

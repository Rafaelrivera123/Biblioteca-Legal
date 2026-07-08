// components/ColorPicker.tsx

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Bookmark, Check, Mail } from "lucide-react";

interface ColorOption {
  name: string;
  bgClass: string;
  hoverClass: string;
}

interface Props {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  onOpenComment: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
}

const colorOptions: ColorOption[] = [
  {
    name: "yellow",
    bgClass: "bg-yellow-100",
    hoverClass: "hover:bg-yellow-200",
  },
  {
    name: "green",
    bgClass: "bg-green-100",
    hoverClass: "hover:bg-green-200",
  },
  {
    name: "blue",
    bgClass: "bg-blue-100",
    hoverClass: "hover:bg-blue-200",
  },
  {
    name: "pink",
    bgClass: "bg-pink-100",
    hoverClass: "hover:bg-pink-200",
  },
  {
    name: "orange",
    bgClass: "bg-orange-100",
    hoverClass: "hover:bg-orange-200",
  },
  {
    name: "white",
    bgClass: "bg-white",
    hoverClass: "hover:bg-gray-100",
  },
];

const ColorPicker = ({
  selectedColor,
  onColorSelect,
  onOpenComment,
  onBookmark,
  isBookmarked,
}: Props) => (
  <motion.div
    className="absolute left-0 sm:left-24 top-full sm:top-0 mt-2 sm:mt-0 max-w-[calc(100vw-2.5rem)] bg-white rounded-lg shadow-lg p-2 z-20 flex items-center gap-1.5 sm:gap-2 border flex-wrap"
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.2 }}
  >
    {colorOptions.map((color) => (
      <motion.button
        key={color.name}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
          color.bgClass,
          color.hoverClass
        )}
        onClick={() => {
          const currentColor = color.name;

          if (currentColor === selectedColor) {
            onColorSelect("bg-white");
          } else {
            onColorSelect(color.name);
          }
        }}
      >
        {selectedColor === color.name && <Check size={14} />}
      </motion.button>
    ))}
    <motion.button
      className="p-1.5 rounded-full hover:bg-gray-200 ml-3"
      onClick={onOpenComment}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Mail size={16} />
    </motion.button>
    <motion.button
      className="p-1.5 rounded-full hover:bg-gray-200"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onBookmark}
    >
      <Bookmark size={16} className={cn(isBookmarked && "fill-[#1E2A38] ")} />
    </motion.button>
  </motion.div>
);

export default ColorPicker;

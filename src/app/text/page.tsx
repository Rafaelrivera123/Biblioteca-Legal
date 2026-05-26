"use client";
import RichTextEditor from "@/components/shared/sections/RichTextEditor";
import { useState } from "react";

const TestEditor = () => {
  const [content, setContent] = useState(
    "<p>Hello <strong>world</strong>!</p>"
  );
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <RichTextEditor content={content} onChange={setContent} />
      <h2 className="mt-6 font-bold">Output HTML</h2>
      <pre className="bg-gray-100 p-2 rounded">{content}</pre>
    </div>
  );
};
export default TestEditor;

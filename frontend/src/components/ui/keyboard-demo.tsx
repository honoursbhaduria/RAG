"use client";
import { Keyboard } from "@/components/ui/keyboard";

export default function KeyboardDemo() {
  return (
    <div className="flex min-h-[220px] sm:min-h-96 w-full max-w-full flex-col items-center justify-center py-2 sm:py-6 md:min-h-160 overflow-visible">
      <Keyboard
        enableSound
        showPreview
        autoTypeText="Welcome to Cognivault"
        showTypedDisplay
      />
    </div>
  );
}

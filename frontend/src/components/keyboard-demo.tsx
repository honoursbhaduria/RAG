"use client";
import { Keyboard } from "@/components/ui/keyboard";

export default function KeyboardDemo() {
  return (
    <div className="flex min-h-96 w-full flex-col items-center justify-center py-6 md:min-h-160">
      <Keyboard
        enableSound
        showPreview
        autoTypeText='rag_agent.invoke({"q": "explain SR-IOV architecture"})'
        showTypedDisplay
      />
    </div>
  );
}

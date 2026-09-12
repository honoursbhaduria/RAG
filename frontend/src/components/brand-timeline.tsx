"use client";

import { Timeline, type TimelineEntry } from "@/components/ui/timeline";
import { CodeBlock } from "@/components/ui/code-block";

export default function BrandTimeline() {
  const brandData: TimelineEntry[] = [
    {
      title: "Centralized Knowledge",
      content: (
        <div className="w-full max-w-2xl">
          <p className="mb-6 font-body-md text-base text-neutral-400 leading-relaxed">
            Bring all your disparate assets, guidelines, and strategic documents into one cohesive, searchable environment.
          </p>

          <CodeBlock
            language="typescript"
            filename="brand.config.ts"
            highlightLines={[4, 8, 9, 10, 15, 16]}
            tabs={[
              {
                name: "brand.config.ts",
                language: "typescript",
                highlightLines: [4, 8, 9, 10, 15, 16],
                code: `import { defineBrandConfig } from "@lumio/core";

export default defineBrandConfig({
  name: "Northline Enterprise",
  version: "2.4.1",
  tokens: {
    palette: {
      primary: "#1B1B1B",
      background: "#FAF9F5",
      accent: "#10B981"
    },
    typography: "Inter, sans-serif"
  },
  rules: {
    strictToneCheck: true,
    autoVerifyAssets: true
  }
});`,
              },
              {
                name: "tokens.json",
                language: "json",
                highlightLines: [3, 4, 5],
                code: `{
  "brand": "Northline",
  "status": "synchronized",
  "totalAssets": 128,
  "syncLatency": "18ms",
  "complianceScore": "99.8%",
  "lockedVersion": "v2.4.1"
}`,
              },
            ]}
            className="w-full max-w-[500px] aspect-square rounded-[24px] bg-[#181818] border border-neutral-800/90 shadow-2xl"
          />
        </div>
      ),
    },
    {
      title: "Contextual Intelligence",
      content: (
        <div className="w-full max-w-2xl">
          <p className="mb-6 font-body-md text-base text-neutral-400 leading-relaxed">
            Our AI understands the nuances of your brand, providing contextual recommendations and surfacing relevant assets.
          </p>

          <CodeBlock
            language="typescript"
            filename="ai-context.ts"
            highlightLines={[5, 6, 7, 8, 9, 12]}
            tabs={[
              {
                name: "ai-context.ts",
                language: "typescript",
                highlightLines: [5, 6, 7, 8, 9, 12],
                code: `import { LumioAI } from "@lumio/engine";

// AI understands the nuances of your brand DNA
const engine = new LumioAI({ apiKey: process.env.LUMIO_KEY });

const result = await engine.generate({
  task: "enterprise-announcement",
  tone: "Direct & Confident",
  format: "Swiss-Grid",
  targetAudience: "Enterprise Leaders"
});

console.log(result.compliance); // 99.4% On-Brand Verified`,
              },
              {
                name: "output.md",
                language: "markdown",
                highlightLines: [1, 3],
                code: `# Introducing Lumio Pro — Startup Velocity at Scale.

Over the past year, enterprise leaders told us they needed
more than asset storage. They needed an operating system
that thinks in their brand voice. Today, we deliver.`,
              },
            ]}
            className="w-full max-w-[500px] aspect-square rounded-[24px] bg-[#181818] border border-neutral-800/90 shadow-2xl"
          />
        </div>
      ),
    },
    {
      title: "Seamless Distribution",
      content: (
        <div className="w-full max-w-2xl">
          <p className="mb-6 font-body-md text-base text-neutral-400 leading-relaxed">
            Ensure every team member and external partner has access to the latest, approved brand materials instantly.
          </p>

          <CodeBlock
            language="typescript"
            filename="distribution.ts"
            highlightLines={[4, 5, 6, 7, 8, 11]}
            tabs={[
              {
                name: "distribution.ts",
                language: "typescript",
                highlightLines: [4, 5, 6, 7, 8, 11],
                code: `import { syncMesh } from "@lumio/sync";

// Global 18ms distribution across all ecosystem targets
export async function broadcastUpdate() {
  const mesh = await syncMesh.broadcast({
    version: "v2.4.1",
    targets: ["figma", "github", "webflow", "slack"],
    enforceLock: true
  });

  return mesh.status; // "ALL_PLATFORMS_SYNCED"
}`,
              },
              {
                name: "webhooks.json",
                language: "json",
                highlightLines: [2, 4],
                code: `{
  "event": "brand.version.published",
  "version": "v2.4.1",
  "targets": ["Figma", "GitHub", "Webflow", "Slack"],
  "deliveryTime": "18ms",
  "status": 200
}`,
              },
            ]}
            className="w-full max-w-[500px] aspect-square rounded-[24px] bg-[#181818] border border-neutral-800/90 shadow-2xl"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-transparent">
      <Timeline
        data={brandData}
        title="The intelligent foundation for your brand."
      />
    </div>
  );
}

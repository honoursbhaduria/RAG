"use client";
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IconCheck, IconCopy } from "@tabler/icons-react";

type CodeBlockProps = {
  language: string;
  filename: string;
  highlightLines?: number[];
  className?: string;
  theme?: "light" | "dark";
} & (
  | {
      code: string;
      tabs?: never;
    }
  | {
      code?: never;
      tabs: Array<{
        name: string;
        code: string;
        language?: string;
        highlightLines?: number[];
      }>;
    }
);

export const CodeBlock = ({
  language,
  filename,
  code,
  highlightLines = [],
  tabs = [],
  className = "",
  theme = "dark",
}: CodeBlockProps) => {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(0);

  const isLight = theme === "light";
  const tabsExist = tabs.length > 0;

  const copyToClipboard = async () => {
    const textToCopy = tabsExist ? tabs[activeTab].code : code;
    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeCode = tabsExist ? tabs[activeTab].code : code;
  const activeLanguage = tabsExist
    ? tabs[activeTab].language || language
    : language;
  const activeHighlightLines = tabsExist
    ? tabs[activeTab].highlightLines || []
    : highlightLines;

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between rounded-[18px] sm:rounded-[20px] p-3 sm:p-5 font-mono text-xs sm:text-sm overflow-hidden ${
        isLight
          ? "bg-white text-neutral-800 border border-neutral-200/90 shadow-sm"
          : "bg-[#1a1a1a] text-white border border-white/5 shadow-2xl"
      } ${className}`}
    >
      <div
        className={`flex items-center justify-between pb-2.5 sm:pb-3 mb-2 gap-2 shrink-0 border-b ${
          isLight ? "border-neutral-200/80" : "border-white/10"
        }`}
      >
        {tabsExist ? (
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-[calc(100%-68px)] sm:max-w-none">
            {tabs.map((tab, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveTab(index)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs transition-colors font-sans cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === index
                    ? isLight
                      ? "bg-neutral-900 text-white font-medium shadow-xs"
                      : "bg-white/10 text-white font-medium shadow-xs"
                    : isLight
                    ? "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        ) : (
          filename && (
            <div
              className={`text-[11px] sm:text-xs font-mono truncate max-w-[calc(100%-68px)] ${
                isLight ? "text-neutral-500" : "text-zinc-400"
              }`}
            >
              {filename}
            </div>
          )
        )}

        <button
          type="button"
          onClick={copyToClipboard}
          className={`flex items-center gap-1 sm:gap-1.5 text-xs transition-colors font-sans px-2 sm:px-2.5 py-1 rounded-md shrink-0 cursor-pointer ml-auto ${
            isLight
              ? "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
          title="Copy code"
        >
          {copied ? (
            <>
              <IconCheck size={14} className="text-emerald-600" />
              <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">Copied</span>
            </>
          ) : (
            <>
              <IconCopy size={14} />
              <span className="text-[10px] sm:text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="flex-1 w-full min-w-0 overflow-auto rounded-xl pr-1">
        <SyntaxHighlighter
          language={activeLanguage}
          style={isLight ? oneLight : atomDark}
          customStyle={{
            margin: 0,
            padding: "6px 0",
            background: "transparent",
            fontSize: "0.75rem", // 12px for crisp mobile and desktop code
            lineHeight: "1.55",
            width: "100%",
            minWidth: "100%",
          }}
          codeTagProps={{
            style: {
              display: "block",
              width: "100%",
              minWidth: "100%",
            },
          }}
          wrapLines={true}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: isLight ? "#9CA3AF" : "#6b7280",
            textAlign: "right",
            userSelect: "none",
          }}
          lineProps={(lineNumber) => ({
            style: {
              backgroundColor: activeHighlightLines.includes(lineNumber)
                ? isLight
                  ? "rgba(16, 185, 129, 0.08)"
                  : "rgba(255,255,255,0.08)"
                : "transparent",
              display: "block",
              width: "100%",
            },
          })}
          PreTag="div"
        >
          {String(activeCode)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;

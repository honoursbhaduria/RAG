"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { cn } from "../../lib/utils";

const FLAP_CHARS = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$()-+&=;:'\"%,./?°";

const BOARD_ROWS = 6;
const BOARD_COLS = 22;

const BASE_COL_DELAY = 14;
const BASE_ROW_DELAY = 10;
const BASE_STEP_MS = 28;
const BASE_FLIP_S = 0.16;
const BASE_TOTAL_S = 0.65;

type AccentColor = {
  top: string;
  bottom: string;
  text: string;
};

const ACCENT_COLORS: AccentColor[] = [
  { top: "bg-red-600", bottom: "bg-red-700", text: "text-white" },
  { top: "bg-orange-500", bottom: "bg-orange-600", text: "text-white" },
  { top: "bg-yellow-400", bottom: "bg-yellow-500", text: "text-neutral-900" },
  { top: "bg-green-600", bottom: "bg-green-700", text: "text-white" },
  { top: "bg-blue-600", bottom: "bg-blue-700", text: "text-white" },
  { top: "bg-violet-600", bottom: "bg-violet-700", text: "text-white" },
  { top: "bg-white", bottom: "bg-neutral-100", text: "text-neutral-900" },
];

const CELL_TEXT_STYLE: React.CSSProperties = {
  fontSize: "clamp(9px, 2.5vw, 30px)",
  lineHeight: 1,
};

// ── Individual Split-Flap Character ───────────────────────────────────

interface CellState {
  current: string;
  prev: string;
  isFlipping: boolean;
  accent: AccentColor | null;
  prevAccent: AccentColor | null;
}

const FlapCell = React.memo(
  function FlapCell({
    target,
    delay,
    stepMs,
    flipDuration,
  }: {
    target: string;
    delay: number;
    stepMs: number;
    flipDuration: number;
  }) {
    const [state, setState] = useState<CellState>({
      current: " ",
      prev: " ",
      isFlipping: false,
      accent: null,
      prevAccent: null,
    });

    const curRef = useRef(" ");
    const tgtRef = useRef<string | null>(null);
    const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (startTimer.current) clearTimeout(startTimer.current);
      if (stepTimer.current) clearTimeout(stepTimer.current);
      startTimer.current = null;
      stepTimer.current = null;

      const normalized = FLAP_CHARS.includes(target.toUpperCase())
        ? target.toUpperCase()
        : " ";

      if (normalized === tgtRef.current) return;
      tgtRef.current = normalized;

      // Skip identical characters (e.g. empty spaces that stay empty)
      if (normalized === curRef.current) return;

      const scrambleCount = normalized === " " ? 2 : 3 + Math.floor(Math.random() * 2);

      const runStep = (i: number) => {
        const isLast = i >= scrambleCount;
        const nextChar = isLast
          ? normalized
          : FLAP_CHARS[1 + Math.floor(Math.random() * (FLAP_CHARS.length - 1))];

        const nextAccent = isLast
          ? null
          : Math.random() < 0.12
            ? ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)]
            : null;

        setState((prev) => ({
          prev: prev.current,
          prevAccent: prev.accent,
          current: nextChar,
          accent: nextAccent,
          isFlipping: true,
        }));

        curRef.current = nextChar;

        if (!isLast) {
          stepTimer.current = setTimeout(() => runStep(i + 1), stepMs);
        } else {
          stepTimer.current = setTimeout(() => {
            setState((prev) => ({ ...prev, isFlipping: false }));
          }, Math.round(flipDuration * 1000));
        }
      };

      startTimer.current = setTimeout(() => runStep(1), delay);

      return () => {
        if (startTimer.current) clearTimeout(startTimer.current);
        if (stepTimer.current) clearTimeout(stepTimer.current);
        startTimer.current = null;
        stepTimer.current = null;
        tgtRef.current = null;
      };
    }, [target, delay, stepMs, flipDuration]);

    const show = state.current === " " ? "\u00A0" : state.current;
    const showPrev = state.prev === " " ? "\u00A0" : state.prev;

    const textCx =
      "absolute inset-x-0 flex select-none items-center justify-center font-mono font-bold tracking-wide";
    const topBg = state.accent?.top ?? "bg-page-bg";
    const bottomBg = state.accent?.bottom ?? "bg-page-bg";
    const textColor = state.accent?.text ?? "text-text";

    const flapTopBg = state.prevAccent?.top ?? "bg-page-bg";
    const flapTextColor = state.prevAccent?.text ?? "text-text";

    return (
      <div className="relative flex aspect-3/4.5 flex-col overflow-hidden rounded-[2px] border border-line/60 md:rounded-[3px] bg-page-bg">
        {/* Flap content area */}
        <div className="relative flex-1 h-full w-full perspective-dramatic transform-3d">
          <div className="absolute inset-0 z-40 hidden flex-row items-center justify-center md:flex pointer-events-none">
            <div className="h-1/2 w-px rounded-tr-sm rounded-br-sm bg-line/60" />
            <div className="flex h-px flex-1 bg-line/60" />
            <div className="h-1/2 w-px rounded-tl-sm rounded-bl-sm bg-line/60" />
          </div>

          {/* Static top – new character top half */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-[calc(50%-0.5px)] overflow-hidden rounded-t-[2px] md:rounded-t-[3px]",
              topBg,
            )}
          >
            <div
              className={cn(textCx, textColor, "top-0 h-[200%]")}
              style={CELL_TEXT_STYLE}
            >
              {show}
            </div>
          </div>

          {/* Static bottom – new character bottom half */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 h-[calc(50%-0.5px)] overflow-hidden rounded-b-[2px] md:rounded-b-[3px]",
              bottomBg,
            )}
          >
            <div
              className={cn(textCx, textColor, "bottom-0 h-[200%]")}
              style={CELL_TEXT_STYLE}
            >
              {show}
            </div>
          </div>

          {/* Flipping top flap */}
          {state.isFlipping && (
            <div
              key={`t-${state.current}`}
              className={cn(
                "absolute inset-x-0 top-0 z-10 h-[calc(50%-0.5px)] origin-bottom overflow-hidden rounded-t-[2px] md:rounded-t-[3px] backface-hidden animate-flap-top",
                flapTopBg,
              )}
              style={{ animationDuration: `${flipDuration}s` }}
            >
              <div
                className={cn(textCx, flapTextColor, "top-0 h-[200%]")}
                style={CELL_TEXT_STYLE}
              >
                {showPrev}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent to-black/5" />
            </div>
          )}

          {/* Flipping bottom flap */}
          {state.isFlipping && (
            <div
              key={`b-${state.current}`}
              className={cn(
                "absolute inset-x-0 bottom-0 z-10 h-[calc(50%-0.5px)] origin-top overflow-hidden rounded-b-[2px] md:rounded-b-[3px] backface-hidden animate-flap-bottom",
                bottomBg,
              )}
              style={{
                animationDuration: `${flipDuration * 0.9}s`,
                animationDelay: `${flipDuration * 0.35}s`,
              }}
            >
              <div
                className={cn(textCx, textColor, "bottom-0 h-[200%]")}
                style={CELL_TEXT_STYLE}
              >
                {show}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-transparent to-black/5" />
            </div>
          )}

          {/* Split line */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 h-px -translate-y-[0.5px] bg-line/60" />
        </div>
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.target === nextProps.target &&
    prevProps.delay === nextProps.delay &&
    prevProps.stepMs === nextProps.stepMs &&
    prevProps.flipDuration === nextProps.flipDuration,
);

// ── Color Tile ────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  "{R}": "#D32F2F",
  "{O}": "#F57C00",
  "{Y}": "#FBC02D",
  "{G}": "#43A047",
  "{B}": "#1E88E5",
  "{V}": "#8E24AA",
  "{W}": "#FAFAFA",
};

const ColorCell = React.memo(function ColorCell({ color }: { color: string }) {
  return (
    <div
      className="aspect-3/4.5 rounded-[2px] md:rounded-[3px] border border-line/60"
      style={{ backgroundColor: color }}
    />
  );
});

// ── Row Parser ────────────────────────────────────────────────────────

type ParsedCell =
  | { type: "char"; value: string }
  | { type: "color"; hex: string };

function parseRow(row: string): ParsedCell[] {
  const cells: ParsedCell[] = [];
  let i = 0;
  while (i < row.length) {
    if (row[i] === "{" && i + 2 < row.length && row[i + 2] === "}") {
      const code = row.substring(i, i + 3);
      if (COLOR_MAP[code]) {
        cells.push({ type: "color", hex: COLOR_MAP[code] });
        i += 3;
        continue;
      }
    }
    cells.push({ type: "char", value: row[i] });
    i++;
  }
  return cells;
}

// ── Word Wrap ─────────────────────────────────────────────────────────

function wrapParagraph(paragraph: string, maxCols: number): string[] {
  const lines: string[] = [];
  const words = paragraph.split(/[ \t]+/).filter(Boolean);
  let currentLine = "";

  for (const word of words) {
    if (word.length > maxCols) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      lines.push(word.slice(0, maxCols));
      continue;
    }

    if (!currentLine) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxCols) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function wrapText(input: string, maxCols: number): string[] {
  return input
    .split("\n")
    .flatMap((paragraph) =>
      paragraph.trim() === "" ? [""] : wrapParagraph(paragraph, maxCols),
    );
}

// ── Main TextFlippingBoard Component ──────────────────────────────────

export interface TextFlippingBoardProps {
  rows?: string[];
  text?: string;
  className?: string;
  /** Total animation duration in seconds. Defaults to ~0.65s. */
  duration?: number;
}

export function TextFlippingBoard({
  rows,
  text,
  className,
  duration = BASE_TOTAL_S,
}: TextFlippingBoardProps) {
  const scale = duration / BASE_TOTAL_S;
  const colDelay = BASE_COL_DELAY * scale;
  const rowDelay = BASE_ROW_DELAY * scale;
  const stepMs = BASE_STEP_MS * scale;
  const flipDur = Math.min(0.3, Math.max(0.12, BASE_FLIP_S * scale));

  const board = useMemo(() => {
    const grid: ParsedCell[][] = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => ({
        type: "char" as const,
        value: " ",
      })),
    );

    if (text) {
      const lines = wrapText(text, BOARD_COLS).slice(0, BOARD_ROWS);
      const startRow = Math.max(0, Math.floor((BOARD_ROWS - lines.length) / 2));
      lines.forEach((line, i) => {
        const row = startRow + i;
        if (row >= BOARD_ROWS) return;
        const parsed = parseRow(line);
        const startCol = Math.max(
          0,
          Math.floor((BOARD_COLS - parsed.length) / 2),
        );
        parsed.forEach((cell, c) => {
          if (startCol + c < BOARD_COLS) {
            grid[row][startCol + c] = cell;
          }
        });
      });
    } else if (rows) {
      rows.forEach((row, r) => {
        if (r >= BOARD_ROWS) return;
        const parsed = parseRow(row);
        parsed.forEach((cell, c) => {
          if (c < BOARD_COLS) {
            grid[r][c] = cell;
          }
        });
      });
    }

    return grid;
  }, [rows, text]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-5xl bg-transparent p-0",
        className,
      )}
    >
      <div
        className="grid gap-[2px] md:gap-1"
        style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)` }}
      >
        {board.map((row, r) =>
          row.map((cell, c) =>
            cell.type === "color" ? (
              <ColorCell key={`${r}-${c}`} color={cell.hex} />
            ) : (
              <FlapCell
                key={`${r}-${c}`}
                target={cell.value}
                delay={c * colDelay + r * rowDelay}
                stepMs={stepMs}
                flipDuration={flipDur}
              />
            ),
          ),
        )}
      </div>
    </div>
  );
}

export default TextFlippingBoard;

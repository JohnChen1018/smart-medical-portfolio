"use client";

import { useState, type ReactNode } from "react";
import { wsiUi } from "@/lib/wsiUiLabels";

export function WsiStatBox({
  value,
  label,
  onClick,
  variant = "default",
}: {
  value: string;
  label: string;
  onClick?: () => void;
  variant?: "default" | "best";
}) {
  const valueColor = variant === "best" ? "text-emerald-300" : "text-[#22D3EE]";
  const border =
    variant === "best"
      ? "border-emerald-400/40 bg-emerald-400/10 hover:border-emerald-400/70 hover:bg-emerald-400/15"
      : "border-[#1F2937] bg-[#111827]";
  const className = `rounded-2xl border ${border} p-6 text-center w-full transition`;
  const inner = (
    <>
      <div className={`text-2xl font-black md:text-3xl ${valueColor}`}>{value}</div>
      <div className="mt-1 text-sm text-[#9CA3AF]">{label}</div>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} cursor-pointer`}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function ExpAccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-xl border border-[#1F2937] bg-[#0F172A]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-base font-bold text-[#E6EDF3] transition hover:bg-[#1F2937]/40"
      >
        <span>{title}</span>
        <span className="shrink-0 text-sm font-normal text-[#9CA3AF]">
          {open ? wsiUi.simulation.collapse : wsiUi.simulation.expand}
        </span>
      </button>
      {open && <div className="border-t border-[#1F2937] p-4">{children}</div>}
    </div>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827]/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-[#1F2937]/40"
      >
        <h3 className="text-lg font-black text-[#E6EDF3] md:text-xl">{title}</h3>
        <span className="text-sm text-[#9CA3AF]">{open ? wsiUi.simulation.collapse : wsiUi.simulation.expand}</span>
      </button>
      {open && <div className="border-t border-[#1F2937] px-5 pb-5 pt-4">{children}</div>}
    </section>
  );
}

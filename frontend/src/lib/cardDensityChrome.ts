import type { CardDensity } from "../hooks/useCardDensityBand";

export type DensityChrome = {
  rootPad: string;
  identity: string;
  provider: string;
  title: string;
  statusCol: string;
  statusPill: string;
  panelsGap: string;
  metaGap: string;
  metaPad: string;
  briefHead: string;
  footer: string;
};

/**
 * LaunchCard spacing/type tokens by density band.
 * lg sizes are for the narrow desktop inspector, not the old full-width card.
 */
export const densityChrome: Record<CardDensity, DensityChrome> = {
  roomy: {
    rootPad: "p-2.5 sm:p-3 lg:p-3.5",
    identity: "mb-1 sm:mb-1.5 lg:mb-3",
    provider:
      "text-[10px] sm:text-[11px] tracking-[0.04em] sm:tracking-[0.06em] leading-snug",
    title:
      "text-[15px] lg:text-[15px] xl:text-[15px] tracking-normal lg:tracking-normal",
    statusCol: "gap-1.5 sm:gap-3 lg:gap-2",
    statusPill: "px-3 py-1.5 lg:px-2 lg:py-1.5 xl:px-3 lg:min-h-8",
    panelsGap: "gap-1.5 sm:gap-2 lg:gap-3",
    metaGap: "gap-1.5 sm:gap-2 lg:gap-2",
    metaPad: "p-2 sm:p-2.5 lg:p-2.5",
    briefHead: "mb-2 lg:mb-1.5 pb-2 lg:pb-1.5",
    footer: "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 lg:mt-2 lg:pt-2",
  },
  mid: {
    rootPad: "p-2.5 sm:p-3",
    identity: "mb-1",
    provider: "text-[10px] tracking-[0.04em] leading-snug",
    title: "text-[15px] tracking-normal",
    statusCol: "gap-1 sm:gap-2",
    statusPill: "px-3 py-1.5",
    panelsGap: "gap-1.5 sm:gap-2",
    metaGap: "gap-1.5 sm:gap-2",
    metaPad: "p-2 sm:p-2.5",
    briefHead: "mb-1.5 pb-1.5",
    footer: "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2",
  },
  dense: {
    rootPad: "p-2 sm:p-2.5",
    identity: "mb-1",
    provider: "text-[10px] tracking-[0.02em] leading-snug",
    title: "text-[14px] tracking-normal",
    statusCol: "gap-1",
    statusPill: "px-3 py-1.5",
    panelsGap: "gap-1.5",
    metaGap: "gap-1.5",
    metaPad: "p-2",
    briefHead: "mb-1.5 pb-1.5",
    footer: "mt-1.5 pt-1.5",
  },
};

export type LocationDensityChrome = {
  rootPad: string;
  identity: string;
  chip: string;
  title: string;
  place: string;
  close: string;
  bodyGap: string;
  imageMax: string;
  metricGap: string;
  metricPad: string;
  metricLabel: string;
  metricValue: string;
  sectionHead: string;
  listPad: string;
  listTitle: string;
  listMeta: string;
  briefBody: string;
};

/** LocationPanel spacing/type — same density bands as LaunchCard. */
export const locationDensityChrome: Record<CardDensity, LocationDensityChrome> = {
  roomy: {
    rootPad: "px-4 pb-3 pt-4 sm:px-5",
    identity: "gap-3 pb-2",
    chip: "text-[9px] tracking-[0.22em] px-1.5 py-0.5",
    title: "mt-2 text-base sm:text-lg tracking-[0.06em]",
    place: "mt-1 text-[10px] tracking-[0.14em]",
    close: "text-[9px] tracking-[0.18em]",
    bodyGap: "gap-3",
    imageMax: "max-h-36",
    metricGap: "gap-2",
    metricPad: "px-2.5 py-2",
    metricLabel: "text-[9px] tracking-[0.16em]",
    metricValue: "mt-1 text-sm",
    sectionHead: "px-3 py-2 text-[9px] tracking-[0.16em]",
    listPad: "px-2.5 py-2 space-y-1.5",
    listTitle: "text-[11px] tracking-[0.08em]",
    listMeta: "mt-1 text-[9px] tracking-[0.14em]",
    briefBody: "px-3 py-2.5 text-[12px] leading-relaxed",
  },
  mid: {
    rootPad: "px-3.5 pb-2.5 pt-3.5 sm:px-4",
    identity: "gap-2.5 pb-1.5",
    chip: "text-[9px] tracking-[0.18em] px-1.5 py-0.5",
    title: "mt-1.5 text-[15px] tracking-[0.05em]",
    place: "mt-0.5 text-[10px] tracking-[0.12em]",
    close: "text-[9px] tracking-[0.16em]",
    bodyGap: "gap-2.5",
    imageMax: "max-h-28",
    metricGap: "gap-1.5",
    metricPad: "px-2 py-1.5",
    metricLabel: "text-[8px] tracking-[0.14em]",
    metricValue: "mt-0.5 text-[13px]",
    sectionHead: "px-2.5 py-1.5 text-[9px] tracking-[0.14em]",
    listPad: "px-2 py-1.5 space-y-1",
    listTitle: "text-[10px] tracking-[0.08em]",
    listMeta: "mt-0.5 text-[8px] tracking-[0.12em]",
    briefBody: "px-2.5 py-2 text-[11px] leading-relaxed",
  },
  dense: {
    rootPad: "px-3 pb-2 pt-3",
    identity: "gap-2 pb-1",
    chip: "text-[8px] tracking-[0.16em] px-1 py-0.5",
    title: "mt-1 text-[14px] tracking-[0.04em]",
    place: "mt-0.5 text-[9px] tracking-[0.12em]",
    close: "text-[8px] tracking-[0.14em]",
    bodyGap: "gap-2",
    imageMax: "max-h-24",
    metricGap: "gap-1.5",
    metricPad: "px-2 py-1.5",
    metricLabel: "text-[8px] tracking-[0.12em]",
    metricValue: "mt-0.5 text-[12px]",
    sectionHead: "px-2 py-1 text-[8px] tracking-[0.14em]",
    listPad: "px-1.5 py-1.5 space-y-1",
    listTitle: "text-[10px] tracking-[0.06em]",
    listMeta: "mt-0.5 text-[8px] tracking-[0.1em]",
    briefBody: "px-2 py-1.5 text-[11px] leading-snug",
  },
};

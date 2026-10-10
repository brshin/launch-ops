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
    rootPad: "p-3 sm:p-4 lg:p-3.5",
    identity: "mb-2.5 sm:mb-3 lg:mb-3",
    provider:
      "text-[10px] sm:text-[11px] tracking-[0.04em] sm:tracking-[0.06em] leading-snug",
    title:
      "text-lg sm:text-xl lg:text-lg tracking-normal sm:tracking-[0.12em] lg:tracking-[0.1em]",
    statusCol: "gap-1.5 sm:gap-3 lg:gap-2",
    statusPill: "px-3 py-2 sm:px-5 sm:py-2.5 lg:px-2 lg:py-1.5 xl:px-3 min-h-9 lg:min-h-8",
    panelsGap: "gap-3 sm:gap-4 lg:gap-3",
    metaGap: "gap-2 sm:gap-3 lg:gap-2",
    metaPad: "p-2.5 sm:p-3 lg:p-2.5",
    briefHead: "mb-2 lg:mb-1.5 pb-2 lg:pb-1.5",
    footer: "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 lg:mt-2 lg:pt-2",
  },
  mid: {
    rootPad: "p-2.5 sm:p-3",
    identity: "mb-2",
    provider: "text-[10px] tracking-[0.04em] leading-snug",
    title: "text-[17px] sm:text-lg tracking-normal sm:tracking-[0.11em]",
    statusCol: "gap-1 sm:gap-2",
    statusPill: "px-2.5 py-1.5 sm:px-4 sm:py-2 min-h-8 sm:min-h-9",
    panelsGap: "gap-2.5 sm:gap-3.5",
    metaGap: "gap-1.5 sm:gap-2.5",
    metaPad: "p-2 sm:p-2.5",
    briefHead: "mb-1.5 pb-1.5",
    footer: "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2",
  },
  dense: {
    rootPad: "p-2 sm:p-2.5",
    identity: "mb-1.5",
    provider: "text-[10px] tracking-[0.02em] leading-snug",
    title: "text-base tracking-[0.08em]",
    statusCol: "gap-1",
    statusPill: "px-2.5 py-1 min-h-8",
    panelsGap: "gap-2",
    metaGap: "gap-1.5",
    metaPad: "p-2",
    briefHead: "mb-1.5 pb-1.5",
    footer: "mt-1.5 pt-1.5",
  },
};

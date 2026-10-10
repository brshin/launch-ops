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

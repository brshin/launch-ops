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
 * Bands only apply below lg (`useCardDensityBand` forces roomy on desktop width).
 */
export const densityChrome: Record<CardDensity, DensityChrome> = {
  roomy: {
    rootPad: "p-3 sm:p-4 lg:p-5",
    identity: "mb-2.5 sm:mb-3 lg:mb-5 gap-2 sm:gap-3",
    provider:
      "text-[9px] sm:text-[10px] tracking-[0.2em] sm:tracking-[0.3em] lg:tracking-[0.35em] xl:tracking-[0.4em] mb-1 sm:mb-2",
    title:
      "text-lg sm:text-xl lg:text-xl xl:text-2xl tracking-[0.1em] sm:tracking-[0.12em] lg:tracking-[0.15em] xl:tracking-[0.2em]",
    statusCol: "gap-1.5 sm:gap-3",
    statusPill: "px-3 py-2 sm:px-5 sm:py-2.5 min-h-9",
    panelsGap: "gap-3 sm:gap-4 lg:gap-5",
    metaGap: "gap-2 sm:gap-3 lg:gap-3",
    metaPad: "p-2.5 sm:p-3 lg:p-3.5",
    briefHead: "mb-2 lg:mb-2.5 pb-2",
    footer: "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2 lg:mt-4 lg:pt-3",
  },
  mid: {
    rootPad: "p-2.5 sm:p-3",
    identity: "mb-2 gap-1.5 sm:gap-2",
    provider:
      "text-[9px] tracking-[0.17em] sm:tracking-[0.22em] mb-0.5 sm:mb-1",
    title: "text-[17px] sm:text-lg tracking-[0.09em] sm:tracking-[0.11em]",
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
    identity: "mb-1.5 gap-1.5",
    provider: "text-[8px] tracking-[0.15em] mb-0.5",
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

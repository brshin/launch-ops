import { describe, expect, it } from "vitest";
import { formatPadPlace } from "./padPlace";

describe("formatPadPlace", () => {
  it("expands a US state and keeps the spaceport as the site", () => {
    expect(formatPadPlace("Vandenberg SFB, CA, USA")).toEqual({
      place: "California, USA",
      site: "Vandenberg SFB",
    });
    expect(formatPadPlace("Cape Canaveral SFS, FL, USA")).toEqual({
      place: "Florida, USA",
      site: "Cape Canaveral SFS",
    });
  });

  it("leaves a non-US place as written", () => {
    expect(formatPadPlace("Tanegashima Space Center, Japan")).toEqual({
      place: "Japan",
      site: "Tanegashima Space Center",
    });
    expect(formatPadPlace("Guiana Space Centre, French Guiana")).toEqual({
      place: "French Guiana",
      site: "Guiana Space Centre",
    });
  });

  it("keeps a location with no comma as the place", () => {
    expect(formatPadPlace("LOCATION DATA UNAVAILABLE")).toEqual({
      place: "LOCATION DATA UNAVAILABLE",
      site: null,
    });
  });
});

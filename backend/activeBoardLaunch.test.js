const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { isActiveBoardLaunch } = require("./activeBoardLaunch");

const NOW = Date.parse("2026-11-07T12:00:00.000Z");

describe("isActiveBoardLaunch", () => {
  it("keeps hour/min/day precision TBD rows", () => {
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-11-29T16:00:00Z",
          net_precision: { abbrev: "HR" },
          status: { abbrev: "TBD" },
        },
        NOW,
      ),
      true,
    );
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-11-13T22:45:00Z",
          net_precision: { abbrev: "MIN" },
          status: { abbrev: "TBC" },
        },
        NOW,
      ),
      true,
    );
  });

  it("drops year and quarter catalog stubs", () => {
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-12-31T00:00:00Z",
          net_precision: { abbrev: "Y" },
          status: { abbrev: "TBD" },
        },
        NOW,
      ),
      false,
    );
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-12-31T00:00:00Z",
          net_precision: { abbrev: "Q4" },
          status: { abbrev: "TBD" },
        },
        NOW,
      ),
      false,
    );
  });

  it("keeps month precision only in the current UTC month", () => {
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-11-30T00:00:00Z",
          net_precision: { abbrev: "M" },
          status: { abbrev: "TBD" },
        },
        NOW,
      ),
      true,
    );
    assert.equal(
      isActiveBoardLaunch(
        {
          net: "2026-12-31T00:00:00Z",
          net_precision: { abbrev: "M" },
          status: { abbrev: "TBD" },
        },
        NOW,
      ),
      false,
    );
  });

  it("keeps rows with unknown precision", () => {
    assert.equal(
      isActiveBoardLaunch({ net: "2026-11-20T00:00:00Z" }, NOW),
      true,
    );
  });
});

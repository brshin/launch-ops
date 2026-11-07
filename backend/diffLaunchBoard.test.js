const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { diffLaunchBoard } = require("./diffLaunchBoard");

const NOW = Date.parse("2026-08-19T12:00:00.000Z");

function makeLaunch(overrides) {
  return {
    apiId: overrides.apiId,
    name: overrides.name || `Mission ${overrides.apiId}`,
    status: overrides.status || { abbrev: "Go" },
    net: overrides.net,
    mission: overrides.mission || {
      name: `Mission ${overrides.apiId}`,
    },
    rocket: {
      configuration: { name: "Falcon 9" },
    },
    webcast_live: overrides.webcast_live ?? false,
    vid_urls: overrides.vid_urls,
  };
}

describe("diffLaunchBoard", () => {
  it("detects new, slipped, live, status, and removed launches", () => {
    const prev = [
      makeLaunch({ apiId: "keep", net: "2026-08-20T00:00:00.000Z" }),
      makeLaunch({ apiId: "slip", net: "2026-08-21T00:00:00.000Z" }),
      makeLaunch({
        apiId: "stream",
        net: "2026-08-20T12:00:00.000Z",
        webcast_live: false,
      }),
      makeLaunch({
        apiId: "status",
        net: "2026-08-22T00:00:00.000Z",
        status: { abbrev: "TBD" },
      }),
      makeLaunch({ apiId: "gone", net: "2026-08-23T00:00:00.000Z" }),
    ];

    const next = [
      makeLaunch({ apiId: "keep", net: "2026-08-20T00:00:00.000Z" }),
      makeLaunch({ apiId: "slip", net: "2026-08-24T00:00:00.000Z" }),
      makeLaunch({
        apiId: "stream",
        net: "2026-08-20T12:00:00.000Z",
        webcast_live: true,
      }),
      makeLaunch({
        apiId: "status",
        net: "2026-08-22T00:00:00.000Z",
        status: { abbrev: "Go" },
      }),
      makeLaunch({ apiId: "fresh", net: "2026-08-25T00:00:00.000Z" }),
    ];

    const updates = diffLaunchBoard(prev, next, NOW);
    const kinds = updates.map((update) => update.kind);

    assert.ok(kinds.includes("webcast"));
    assert.ok(kinds.includes("scheduled"));
    assert.ok(kinds.includes("rescheduled"));
    assert.ok(kinds.includes("status"));
    assert.ok(kinds.includes("removed"));
    assert.equal(updates[0].kind, "webcast");
  });
});

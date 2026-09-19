const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mapUpcomingLaunches } = require('./mapLaunch');

describe('mapUpcomingLaunches', () => {
    it('returns [] when results is missing or not an array', () => {
        assert.deepEqual(mapUpcomingLaunches(undefined), []);
        assert.deepEqual(mapUpcomingLaunches({}), []);
        assert.deepEqual(mapUpcomingLaunches({ results: null }), []);
    });

    it('maps Launch Library id to apiId and keeps nested fields', () => {
        const status = { abbrev: 'Go' };
        const rocket = { configuration: { name: 'Falcon 9' } };
        const mapped = mapUpcomingLaunches({
            results: [
                {
                    id: 'abc-123',
                    name: 'Starlink Group 6-1',
                    status,
                    last_updated: '2026-08-19T00:00:00Z',
                    net: '2026-08-20T00:00:00Z',
                    net_precision: { abbrev: 'MIN' },
                    window_start: '2026-08-20T00:00:00Z',
                    window_end: '2026-08-20T01:00:00Z',
                    image: { image_url: 'https://example.test/pad.jpg' },
                    launch_service_provider: { abbrev: 'SpX' },
                    rocket,
                    mission: { name: 'Starlink' },
                    pad: { name: 'SLC-40' },
                    webcast_live: true,
                    vid_urls: [
                        {
                            url: 'https://www.youtube.com/watch?v=abc',
                            live: true,
                        },
                    ],
                    timeline: [{ type: 'T-0' }],
                    extra_api_field: 'drop-me',
                },
            ],
        });

        assert.equal(mapped.length, 1);
        assert.equal(mapped[0].apiId, 'abc-123');
        assert.equal(mapped[0].id, undefined);
        assert.equal(mapped[0].extra_api_field, undefined);
        assert.equal(mapped[0].timeline, undefined);
        assert.equal(mapped[0].name, 'Starlink Group 6-1');
        assert.equal(mapped[0].status, status);
        assert.equal(mapped[0].rocket, rocket);
        assert.equal(mapped[0].pad.name, 'SLC-40');
        assert.equal(mapped[0].webcast_live, true);
        assert.equal(mapped[0].vid_urls.length, 1);
        assert.equal(mapped[0].vid_urls[0].url, 'https://www.youtube.com/watch?v=abc');
    });

    it('defaults webcast_live and vid_urls when detailed fields are missing', () => {
        const mapped = mapUpcomingLaunches({
            results: [{ id: 'no-vids', name: 'Test' }],
        });

        assert.equal(mapped[0].webcast_live, false);
        assert.deepEqual(mapped[0].vid_urls, []);
    });

    it('maps an empty results array to []', () => {
        assert.deepEqual(mapUpcomingLaunches({ results: [] }), []);
    });
});

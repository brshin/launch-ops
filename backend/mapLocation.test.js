const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mapLocations } = require('./mapLocation');

describe('mapLocations', () => {
    it('returns [] when results is missing or not an array', () => {
        assert.deepEqual(mapLocations(undefined), []);
        assert.deepEqual(mapLocations({}), []);
        assert.deepEqual(mapLocations({ results: null }), []);
    });

    it('maps Launch Library id to apiId and keeps useful fields', () => {
        const country = { name: 'USA', alpha_2_code: 'US' };
        const mapped = mapLocations({
            results: [
                {
                    id: 12,
                    name: 'Cape Canaveral, FL, USA',
                    active: true,
                    country,
                    description: 'Florida spaceport',
                    image: { image_url: 'https://example.test/cape.jpg' },
                    map_image: 'https://example.test/map.jpg',
                    longitude: -80.6,
                    latitude: 28.5,
                    timezone_name: 'America/New_York',
                    total_launch_count: 100,
                    total_landing_count: 10,
                    celestial_body: {
                        id: 1,
                        name: 'Earth',
                        diameter: 12742000,
                    },
                    extra_api_field: 'drop-me',
                },
            ],
        });

        assert.equal(mapped.length, 1);
        assert.equal(mapped[0].apiId, 12);
        assert.equal(mapped[0].id, undefined);
        assert.equal(mapped[0].extra_api_field, undefined);
        assert.equal(mapped[0].name, 'Cape Canaveral, FL, USA');
        assert.equal(mapped[0].active, true);
        assert.equal(mapped[0].country, country);
        assert.equal(mapped[0].latitude, 28.5);
        assert.equal(mapped[0].longitude, -80.6);
        assert.equal(mapped[0].total_launch_count, 100);
        assert.equal(mapped[0].total_landing_count, 10);
        assert.deepEqual(mapped[0].celestial_body, { id: 1, name: 'Earth' });
    });

    it('defaults counts and nullables when fields are missing', () => {
        const mapped = mapLocations({
            results: [{ id: 1, name: 'Test Site' }],
        });

        assert.equal(mapped[0].active, false);
        assert.equal(mapped[0].country, null);
        assert.equal(mapped[0].latitude, null);
        assert.equal(mapped[0].total_launch_count, 0);
        assert.equal(mapped[0].total_landing_count, 0);
        assert.equal(mapped[0].celestial_body, null);
    });

    it('maps an empty results array to []', () => {
        assert.deepEqual(mapLocations({ results: [] }), []);
    });
});

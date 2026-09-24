import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HOME_FOCUS, ROUTES, focusAngles, wrapAngle } from './globe.ts';

const isLatLng = ([lat, lng]: readonly [number, number]) =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

describe('focusAngles', () => {
  it('turns the prime meridian on the equator to face the viewer at phi = 3π/2', () => {
    const { phi, theta } = focusAngles([0, 0]);
    assert.ok(Math.abs(phi - (3 * Math.PI) / 2) < 1e-9);
    assert.equal(theta, 0);
  });

  it('tilts towards northern latitudes and away from southern ones', () => {
    assert.ok(focusAngles([40, 0]).theta > 0);
    assert.ok(focusAngles([-34, 0]).theta < 0);
  });

  it('always returns phi in [0, 2π), whichever side of the date line the point is', () => {
    for (const lng of [-180, -120, -62, 0, 62, 120, 180]) {
      const { phi } = focusAngles([0, lng]);
      assert.ok(phi >= 0 && phi < Math.PI * 2, `lng ${lng} gave phi ${phi}`);
    }
  });

  it('moves phi against longitude: 40° further west is 40° more phi', () => {
    const west = focusAngles([0, -80]).phi;
    const east = focusAngles([0, -40]).phi;
    assert.ok(Math.abs(wrapAngle(west - east) - (40 * Math.PI) / 180) < 1e-9);
  });
});

describe('ROUTES', () => {
  it('only holds real coordinates', () => {
    for (const route of ROUTES) {
      assert.ok(isLatLng(route.from), `bad sponsor end ${route.from}`);
      assert.ok(isLatLng(route.to), `bad saver end ${route.to}`);
    }
    assert.ok(isLatLng(HOME_FOCUS));
  });
});

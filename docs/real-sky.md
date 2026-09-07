# The real sky

The viewpoint is fixed at **Fairbanks, Alaska: 64.84° N, 147.72° W, 136 m**.
The camera faces geographic north at **50° altitude**, with an **80° vertical
field of view**. A rectilinear projection preserves the constellations; wider
screens reveal more of the same sky horizontally. The visitor's location and
browser time zone are never used as an observer position.

`CataloguedStars.tsx` draws a transparent, persistent WebGL point layer over
the existing aurora painting. These distant stars have one fixed camera, so
an arbitrarily long article cannot stretch or repeat a constellation. The
aurora, sky colours, native iOS in-flow background and navigation camera keep
their existing behaviour. There is no added JavaScript scroll follower.

## Astronomy and visual treatment

- The computer's actual UTC date/time drives Astronomy Engine's
  `Rotation_EQJ_HOR`, including precession, nutation and Earth rotation. The
  horizon matrix refreshes once per second; moving a star by that interval is
  much less than one screen pixel. Returning from a background tab immediately
  catches up to the current sky. Date/time does not come from animation time.
- HYG J2000 positions and Cartesian velocities retain catalog space motion.
  Both are divided by the same initial distance, then the direction is
  normalized at the date being rendered.
- Apparent visual magnitude supplies relative flux, `10^(-0.4 × magnitude)`.
  A clear-air extinction approximation dims stars near the horizon. Screen
  tone mapping intentionally compresses the physical range while retaining
  a noticeable hierarchy of bright landmarks and faint background stars.
- All stars have enlarged, crisp circular cores with a pixel-adaptive
  antialiased rim. Only the outside has a small halo; the brighter stars
  receive short diffraction glints. These are artistic
  apparent sizes, not resolved physical stellar diameters.
- The star buffer follows device pixel density (including 3x phones and
  browser zoom), up to 4x and within actual GPU buffer limits. The far more
  expensive aurora keeps its original resolution budget.
- B−V colour index supplies an approximate black-body temperature using
  [Ballesteros (2012)](https://arxiv.org/abs/1201.1809). Three Planck samples at
  650/550/450 nm, normalized against 6500 K and subdued, supply the display
  tint. This is not calibrated stellar colour photometry. Missing B−V uses
  neutral white; dim stars are less saturated.
- Gentle, independent scintillation changes apparent intensity by roughly
  14–22% at most, strongest near the horizon. It does not move the stars or
  replace catalog magnitudes. Reduced motion disables scintillation and the
  initial reveal while keeping the real-date sky current.

The scene keeps its night palette even during Fairbanks daylight. Aurora,
atmospheric haze and weather are artistic; the Moon, Sun, planets, light
pollution and variable-star light curves are not simulated. It is a personal
website with real stars, not an observing forecast.

## Catalog and reproduction

The source is [HYG v4.1 by David Nash / Astronexus](https://github.com/astronexus/HYG-Database/blob/main/hyg/README.md),
licensed **CC BY-SA 4.0**. The derived binary and metadata retain that license;
the original notice and modifications are recorded in `THIRD_PARTY_NOTICES.md`.
Visible attribution is in the footer's sky explanation. The full notices
also ship at `/third-party-notices.txt` in the static distribution.

Pinned commit: `c7f7f883fe678cc7680169a50ccd7dcc49b060ce`.

[Download the pinned CSV](https://raw.githubusercontent.com/astronexus/HYG-Database/c7f7f883fe678cc7680169a50ccd7dcc49b060ce/hyg/CURRENT/hygdata_v41.csv),
then run:

```sh
python3 scripts/generate-stars.py /path/to/hygdata_v41.csv
```

The generator checks source SHA-256
`d9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd`.
It excludes the Sun, keeps V magnitude ≤ 6.5 and declination ≥ −26° (the
Fairbanks horizon with a margin), producing 6,054 records / 217,944 bytes.
`src/data/bright-stars.meta.json` records the resulting checksum, exact
format, selection and named landmarks for verification.

The data is a build asset with a content-hashed local URL. The website does
not contact HYG or any external astronomy service at runtime or build time.

## Verification

`bun test scripts/astronomy.test.ts` checks the asset checksum and source
coordinates, Polaris's altitude over 24 hours, daily sky rotation, magnitude
ratios and warm/cool colour ordering. Browser coverage samples the actual
WebGL star pixels, checks apparent size, scintillation/reduced motion, real
time changes, persistence across navigation and context restoration.

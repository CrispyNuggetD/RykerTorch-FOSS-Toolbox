# Event Horizon · Campus HQ space scene

A cursor-reactive HTML5 canvas, a quietly accreting black hole and a student
astronaut moving closer as a supplied deadline approaches. The astronaut looks
at the pointer and links to an Intra profile. The horizon itself has hover/focus
information and a native expandable explanation. **MIT licensed**, no framework,
fonts, external assets, telemetry or browser API credentials.

## Copy it into a website

Copy `event-horizon.css`, `event-horizon.js`, `LICENSE`, and the markup in
`scene.html`. Include the stylesheet in `<head>` and the script with `defer`:

```html
<link rel="stylesheet" href="event-horizon.css">
<script defer src="event-horizon.js"></script>
<!-- Paste scene.html where the visual belongs. -->
```

Supply your own values on the scene’s outer element:

```html
<section class="event-horizon" data-event-horizon
  data-deadline="2027-01-18T02:42:00Z"
  data-start="2025-11-17T02:42:00Z"
  data-observed-at="2026-10-27T07:00:00+08:00"
  data-login="yourlogin" data-profile-url="https://profile.intra.42.fr/users/yourlogin"
  data-gender="neutral" data-storage-key="my-site.horizon.motion">
  <!-- Copy the inner markup from scene.html. -->
</section>
```

Dates accept ISO 8601 with timezone, Unix seconds or Unix milliseconds. As an
alternative, set the numeric CSS variable `--event-horizon-deadline` on the root
when `data-deadline` is absent. A supplied start defines the visual timeline;
without it, the final 90 days are the display window. Dates are compared with
local Unix time (`Date.now`), not frame counts. Wrong device clocks affect the
visual; it is not an official eligibility check or physical simulation.

Gender is optional: `neutral` by default; `male` and `female` select an explicit
avatar badge/identity label. It is never inferred from a name or API data. The
underlying astronaut is deliberately stylized rather than a gender stereotype.
Set the anchor href and visible fallback date in the HTML too, so the no-JS scene
still has correct information. The supplied demo uses hnah as a replaceable example.

## JSON and API-enabled route (optional)

No API is necessary. You can supply `data-config-url="/horizon.json"` for a
same-origin JSON file or read-only service returning only:

```json
{"login":"yourlogin","profileUrl":"https://profile.intra.42.fr/users/yourlogin",
 "deadline":"2027-01-18T02:42:00Z","start":"2025-11-17T02:42:00Z",
 "observedAt":"2026-10-27T07:00:00+08:00","gender":"neutral"}
```

This fetch happens once, without cookies, and redirects/cross-origin config URLs
are refused. Failed fetches retain the authored scene. For a programmatic update:
`EventHorizon.mount(element).update(configuration)`. For an inline JSON script,
parse its text with JSON.parse and pass that object; do not interpolate untrusted
HTML. The profile link accepts HTTPS only.

An API-enabled server can fetch the consenting owner’s profile through its own
authorized/scoped client, then publish just this small JSON. **Never embed client
secrets/tokens or the full profile in the page.** `profile_to_scene.py` is an
optional stdin-to-JSON adapter for an already-authorized own Singapore profile:

```sh
python3 profile_to_scene.py --login yourlogin --gender neutral < /private/own-profile.json > horizon.json
```

The adapter makes no API calls, stores no raw input and checks the expected owner
and Singapore campus. Review the minimal output before publishing. Do not use it
to publish another student’s dates without permission. Changing the configured
horizon affects the picture, never anyone’s actual 42 standing.

## Accessibility, interaction and performance

- The astronaut is a real keyboard-focusable link; horizon info is native
  details/summary. Optional [Adaptive Pointer](../adaptive-pointer/README.md)
  handles these controls like ordinary links/buttons. A halo provides hover feedback.
- Pointer movement affects eyes/parallax. The student arrives from the left, then
  floats gently with bounded scroll drift. Deadline time sets the underlying
  distance; scrolling never changes the countdown. Hover/focus holds the link still.
- A classic flip-card countdown shows days, hours, minutes and seconds. Only
  changed values animate; accessible timer text avoids per-second announcements.
  Motion off/reduced motion leaves a static astronaut and plain updating numbers.
- Motion can be disabled and that browser-local preference persists. Reduced
  motion and forced colours disable it. Canvas is decorative and aria-hidden.
- Rendering is capped near 30 fps and stops in hidden tabs/offscreen scenes;
  pixel density is capped at 2. A static scene remains without JavaScript.
- A passed recorded date produces explanatory text, not a disappearance/death
  effect. Snapshot age is shown when supplied; freeze/deadline changes need new data.

Serve `example.html` locally with `python3 -m http.server 8080`. Test valid/missing/
past dates, Unix formats, source updates, links, horizon disclosure, keyboard,
mobile, JS-off, motion opt-out, reduced motion and offscreen pause. The illustrated
space treatment belongs to the **Campus HQ** visual family, not an official 42 UI.

More from Christopher Nah (hnah), 42 Singapore:
[42 portfolio](https://crispynuggetd.github.io/42_Singapore_SUTD/) · [Main 42 repository & README](https://github.com/CrispyNuggetD/42_Singapore_SUTD).

## Optional space backdrop

Include `space-backdrop.css` and deferred `space-backdrop.js` after the scene
script, and add `data-space-background` to one scene. The original starfield,
diffuse galaxies/clouds and occasional comet use canvas; no game artwork is
copied. It expects a `.wrap` reading surface, which remains opaque light grey.
Scroll/cursor parallax is visible in the margins, keeping text contrast stable.
A fixed Space motion toggle shares the scene’s saved motion choice. Reduced
motion/forced colours and hidden tabs are respected. No-JS retains the original
page background. Omit these two files for the standalone scene alone.
The astronaut now looks at window-wide mouse input; stars have stronger depth.

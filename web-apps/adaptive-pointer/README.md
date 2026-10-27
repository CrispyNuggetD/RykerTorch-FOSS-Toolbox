# Adaptive pointer — a small, reusable website interaction

[Campus HQ toolkit: compare tools & start here](https://crispynuggetd.github.io/42_Singapore_SUTD/#toolkit)


An iPadOS-inspired circle that smoothly grows around links/buttons and forms an
I-beam over text. Originally built for [LAN42](https://crispynuggetd.github.io/42sg-campus-lan/).
Plain JavaScript + CSS, no framework, package manager, tracking or external service.
**MIT licensed** in this directory; this does not relicense other toolbox projects.

## Copy it into your personal website

1. Copy `adaptive-pointer.css`, `adaptive-pointer.js` and `LICENSE` into your
   website (for example `assets/adaptive-pointer/`). Self-host these copies;
   raw GitHub URLs are source downloads, not a production CDN.
2. Add the stylesheet in `<head>` and the deferred script:

```html
<link rel="stylesheet" href="assets/adaptive-pointer/adaptive-pointer.css">
<script defer src="assets/adaptive-pointer/adaptive-pointer.js"
        data-storage-key="my-site.pointer-effects" data-default="on"></script>
```

That is all. A **Pointer: On/Off** button and **Get this effect** source link appear in a compact fixed bottom-right
dock. It stays reachable while scrolling, with safe-area spacing and room at the
end of the document. Include it only once per page. For a quick preview,
open `example.html` through a local static server:

```sh
python3 -m http.server 8080
# Visit http://localhost:8080/web-apps/adaptive-pointer/example.html
```

The default is on for eligible desktop mouse/trackpad users. `data-default="off"`
changes the first-visit default. The local storage key is per website/browser;
a saved choice overrides the default. Storage failure keeps a session-only choice.
To change the tint, set `:root { --adaptive-pointer-rgb: 40, 83, 181; }` in your
own CSS (three comma-separated RGB channels). Keep text and focus readable.

## What it does—and does not do

- One visual shape interpolates position, size, corners and I-beam details.
- Links remain links; buttons remain buttons. No target is moved and no click
  is intercepted. The overlay uses `pointer-events: none` and is hidden from
  assistive technologies. Normal text selection and text entry still operate.
- Keyboard interaction restores the native cursor. Touch, reduced motion and
  forced-colour modes use native behaviour and disable the effect toggle.
- Special native controls (file inputs, media, select menus, embedded frames)
  fall back to their native pointer. Browser/OS integration is not identical to
  an iPad pointer, and assistive-tool/browser combinations still need testing.
- With JavaScript disabled, your site stays unchanged: no custom pointer or
  non-functional toggle is added. This is progressive enhancement, not a UI kit.
- Only the on/off preference is stored. It does not record movement or clicks.

## Before publishing your adaptation

Check actual navigation, selecting/copying text, editable fields, keyboard focus,
scroll/resize, browser zoom, mobile/touch, reduced motion and forced colours.
Check that the off setting survives reloads and that your no-JavaScript page
remains useful. Do not make information depend on this effect. A dark background
may need a different tint. Fullscreen/top-layer dialogs and unusual embedded
widgets may need native-pointer exclusions in the selector in `update()`.

## Origin and maintenance

By Christopher Nah (hnah), developed with AI assistance; extracted from LAN42’s
website interaction code on 27 October 2026. This is an independent reusable copy,
not an external runtime dependency for LAN42. Keep the MIT notice with copies.
The repository owner’s original code is offered under this directory’s licence;
no Apple assets/code are included and no Apple endorsement is implied.

Bug reports and contributions: use this repository’s Issues. When changing the
shared behaviour, compare LAN42, this toolbox copy and the portfolio’s vendored
copy; explain deliberate differences. Test the behaviours above, not just syntax.

The visual family used by LAN42 and the 42 portfolio is called **Campus HQ**.
This package provides its pointer interaction, not the entire theme/layout.
Adopters may restyle the dock; keep the off switch readily discoverable and
retain the MIT notice in redistributed code. A visible source link is provided
by default, not an additional licence restriction.

For circular controls or illustrated profile links, add
`data-pointer-shape="circle"` to the actual link/button/summary. The visual
morph uses a circle while leaving the real click target unchanged.

More from Christopher Nah (hnah), 42 Singapore:
[42 portfolio](https://crispynuggetd.github.io/42_Singapore_SUTD/) · [Main 42 repository & README](https://github.com/CrispyNuggetD/42_Singapore_SUTD).

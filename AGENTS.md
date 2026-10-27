# Toolbox maintenance

Subprojects carry their own licensing. Do not assume a root-wide licence.
`web-apps/adaptive-pointer` is MIT licensed and extracted from the owner’s LAN42
site. Keep its README copy/paste instructions, demo and no-JavaScript/media-query
fallbacks current. Do not add cursor/click tracking. Compare deliberate changes
with LAN42 website/pointer.* and the public 42 portfolio’s vendored copy.

`web-apps/event-horizon` is an independent MIT component: preserve semantic
profile links, native horizon disclosure, explicit neutral/male/female selection,
local time input, reduced-motion/forced-colour fallback and offscreen/hidden-tab
pause. API integration publishes only a consented owner’s small scene config,
never keys/raw profiles. Test the stdin adapter and JS/no-JS desktop/mobile
scenes. Compare the portfolio’s vendored copy when changing this component.

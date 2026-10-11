# UI design guide

## Direction

The calculator should feel related to Stoneshard while remaining practical as a
web application.

The game is the main visual inspiration. Its interface is designed for a fixed
game viewport and uses dense textures, patterns, and ornament. The calculator
adopts these details selectively to protect readability and usability.

The official Stoneshard wiki is a useful bridge between the game and the
calculator. It adapts the same visual identity to pages, forms, navigation, and
other web content. Draw practical web patterns from the official wiki.

New work should interpret both references through three priorities:

1. The calculator must remain clear and usable.
2. It should feel consistent with the rest of the calculator.
3. It should resemble the visual language of Stoneshard.

## Visual language

The interface uses dark purple surfaces, hard edges, and restrained highlights.
Distinct surfaces and hard-edged highlights create depth.

Use brighter surfaces for controls and darker surfaces for recessed content.
Adjacent areas should have enough contrast to show their relationship while
remaining part of the same composition.

The character sheet can be denser than the rest of the interface. Its nested
sections resemble the compact character panels found in the game. Controls and
ability trees should remain calmer so their content is easy to scan.

The CSS is the source of truth for exact colors. When choosing a new color,
prefer one already used by the game or official wiki and apply it according to
its existing role. Any adjustment or new value should provide a clear benefit to
readability, hierarchy, or visual fit.

Use the game mainly as a reference for text colors, especially semantic text in
tooltips. Use the official wiki mainly as a reference for borders and background
colors because it shows how the Stoneshard palette can work across web surfaces.

## Borders

Use ornate border artwork sparingly. It works best around major surfaces, such
as the whole calculator, the home panel, tooltips, and modals. Applying it to
every component creates visual noise and consumes too much space on mobile.

Functional panels use simple solid borders with hard inset highlights and
shadows. This restrained treatment suggests the game's raised panels. Recessed
fields and simple groups can use a plain dark border.

CSS `ridge` and `groove` borders are excluded from the visual system. Browsers
derive their colors, and their appearance can vary between browser engines and
versions. Explicit borders and shadows keep the result predictable.

Buttons use solid edges and hard inset shadows to create a small raised surface.
Hover and active states change the apparent depth as well as the background
color. Keep buttons free of textured game artwork so their labels and states
remain clear.

## Layout and responsive design

Desktop panels can have different widths when those widths reflect their
content. On mobile, retain the natural widths of the narrower home, character,
and selector panels and center them within the viewport. Their distinct widths
preserve the separation between sections.

Change component dimensions as a deliberate layout decision. Border width,
padding, and box sizing can alter wrapping even when the content width appears
unchanged.

When changing layout, check a desktop view with multiple ability trees and a
representative narrow mobile viewport. Also check tooltips near both horizontal
edges.

## Implementation notes

`ability-tree` and `ability-tree-selector` use shadow DOM stylesheets. A visual
change may need matching edits in:

- `main.css`
- `components/ability-tree/ability-tree.css`
- `components/ability-tree-selector/ability-tree-selector.css`

`main.css` can style custom element hosts. Style elements inside a shadow root
through the component stylesheet.

Ability tree artwork contains transparent areas and expects a dark background.

Border artwork lives in:

- `img/borders/Content_border.jpg`
- `img/borders/Navigation_border.png`
- `img/tooltip/Tooltip_Border.png`

Border image slice and width values depend on the artwork. Treat them as part of
the asset's rendering requirements.

## Reviewing a visual change

Before keeping a change, ask:

- Does it make the interface clearer or establish useful hierarchy?
- Does it fit the existing balance between game atmosphere and web usability?
- Is the decoration appropriate for the importance of the element?
- Do hover, active, focus, selected, and disabled states remain clear?
- Does it work on desktop and mobile?
- Does it render consistently in current Chrome, Firefox, and Safari?
- Does text remain readable against its background?

Favor small, consistent rules that work across supported browsers and screen
sizes.

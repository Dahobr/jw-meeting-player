# App Icon Design Specification (2026-05-05)

## 1. Introduction
This document specifies the design for the new application icon for the JW Media Downloader application. This icon will be used primarily on the desktop and taskbar.

## 2. Design Requirements
- **Purpose:** Application branding/identification on desktop and taskbar.
- **Style:** Minimal and flat.
- **Shape:** Rounded square.
- **Content:** The text "JW" on the top line and "MP" on the bottom line.
- **Color:** Deep blue (lower saturation).

## 3. Visual Description
The icon is a rounded square with a distinct outline in deep blue (desaturated). Inside the square, the text "JW" is centrally placed on the upper half, and "MP" is centrally placed on the lower half. Both text elements are in a bold, sans-serif font and use the same deep blue color as the outline. The design emphasizes clarity, simplicity, and brand recognition in a minimalist aesthetic.

## 4. Technical Details (SVG)
The icon is implemented as an SVG (Scalable Vector Graphics) to ensure scalability and crisp rendering across various resolutions and display sizes. The file name is `jwmp-icon.svg`.

\`\`\`xml
<svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="none" stroke="#445588" stroke-width="6"/>
  <text x="50%" y="75" font-family="sans-serif" font-size="55" font-weight="bold" fill="#445588" text-anchor="middle" dominant-baseline="central">JW</text>
  <text x="50%" y="135" font-family="sans-serif" font-size="55" font-weight="bold" fill="#445588" text-anchor="middle" dominant-baseline="central">MP</text>
</svg>
\`\`\`

- **`width` and `height`**: Set to 200px for initial display, but scalable due to SVG nature.
- **`viewBox`**: `0 0 200 200` ensures proper scaling.
- **`rect`**:
    - `x="10" y="10"`: Positioned to leave a 10px margin from the edge.
    - `width="180" height="180"`: Defines the size of the square.
    - `rx="40" ry="40"`: Defines the rounded corners, making it a "squircle".
    - `fill="none"`: The interior of the square is transparent.
    - `stroke="#445588"`: The outline color (Desaturated Deep Blue).
    - `stroke-width="6"`: The thickness of the outline.
- **`text` elements**:
    - `x="50%"`: Centers the text horizontally.
    - `y="70"` (for JW) and `y="130"` (for MP): Vertical positioning adjusted to reduce the gap between the lines, with `dominant-baseline="central"` helping with vertical alignment.
    - `font-family="sans-serif"`: A generic, clean font.
    - `font-size="75"`: Appropriate size for the text within the icon.
    - `font-weight="bold"`: Bold text for emphasis.
    - `fill="#445588"`: Text color matching the outline.
    - `text-anchor="middle"`: Centers the text horizontally from its `x` coordinate.

## 5. Mockups / Examples
(Not applicable for this text-based specification, but the generated SVG can be rendered to visualize.)

---

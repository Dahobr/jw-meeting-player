# Spec: Header Navigation Buttons Redesign

## Goal
Redesign the header navigation buttons (Reuniões, Cântico, Vídeos, Esboços, WhatsApp) from plain text buttons to a modern "Icon + Text" (bottom) layout. This will improve the visual appeal and consistency of the application's header.

## Components

### Header Buttons
The existing button group in `src/renderer/index.html` will be updated to include SVG icons and stylized text.

#### 1. Reuniões (Meetings)
- **Icon**: Front view close-up of a speaker at a podium with microphones.
- **Color**: `--primary-blue` (#0070c9).
- **Label**: "Reuniões".

#### 2. Cântico (Song)
- **Icon**: Double music notes.
- **Color**: `--primary-blue` (#0070c9).
- **Label**: "Cântico".

#### 3. Vídeos (Videos)
- **Icon**: Film reel/strip box.
- **Color**: `--primary-blue` (#0070c9).
- **Label**: "Vídeos".

#### 4. Esboços (Outlines)
- **Icon**: Document with lines.
- **Color**: `--primary-blue` (#0070c9).
- **Label**: "Esboços".

#### 5. WhatsApp
- **Icon**: Original WhatsApp bubble icon with a phone receiver inside.
- **Color**: `#25D366` (WhatsApp Brand Green).
- **Label**: "WhatsApp".

## Design & Layout

### Visual Style
- **Orientation**: Vertical (Icon on top, Text below).
- **Sizing**:
  - Icon size: ~24px - 28px.
  - Text size: ~10px - 11px.
- **Spacing**: Consistent gap between icon and text (~4px).
- **Interactivity**: 
  - Hover effect (background highlight or slight scale).
  - Active state (visual feedback when clicking).

### CSS Changes
- Update `.navigation-buttons` or the specific button containers to use `flex-direction: column`.
- Adjust padding and margins to ensure buttons fit comfortably in the header without excessive height increase.
- Style the WhatsApp button specifically with its brand color.

## Implementation Details

### HTML (`src/renderer/index.html`)
- Replace button text with a wrapper containing the SVG and a span for the label.
- Keep the existing IDs (`btn-reunioes`, `btn-cantico`, etc.) to preserve event listener functionality.

### CSS (`src/renderer/main.css`)
- Define styles for the new button structure.
- Ensure the header layout remains responsive and vertically centered.

## Testing
- Verify all buttons still trigger the correct site navigation in the `WebContentsView`.
- Ensure the header height remains acceptable on different window widths.
- Confirm icons are rendered correctly as vector graphics.

## Self-Review
- **Placeholders**: None.
- **Consistency**: Matches the "Approach B" approved by the user.
- **Scope**: Focused strictly on the header navigation buttons.
- **Ambiguity**: Icons are explicitly described based on final approved mockups.

# Header Navigation Buttons Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign header navigation buttons to an "Icon + Text" (bottom) layout for a modern look.

**Architecture:** Update `src/renderer/index.html` to replace text-only buttons with a structured wrapper containing SVG icons and labels. Use CSS Flexbox in `src/renderer/main.css` to achieve the vertical alignment and styling.

**Tech Stack:** HTML5, CSS3, Vanilla JS (Electron Renderer).

---

### Task 1: Define CSS for Icon Buttons

**Files:**
- Modify: `src/renderer/main.css`

- [ ] **Step 1: Add styles for the new button structure**

Add the following styles to `src/renderer/main.css`:

```css
/* Header Button Redesign */
.navigation-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
}

.nav-icon-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: background-color 0.2s, transform 0.1s;
    color: var(--primary-blue);
    min-width: 70px;
}

.nav-icon-btn:hover {
    background-color: rgba(0, 112, 201, 0.1);
}

.nav-icon-btn:active {
    transform: scale(0.95);
}

.nav-icon-btn svg {
    margin-bottom: 4px;
}

.nav-icon-btn span {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* WhatsApp specific color */
#btn-whatsapp {
    color: #25D366;
}

#btn-whatsapp:hover {
    background-color: rgba(37, 211, 102, 0.1);
}
```

- [ ] **Step 2: Commit CSS changes**

```bash
git add src/renderer/main.css
git commit -m "style: define CSS for new header icon buttons"
```

### Task 2: Update HTML with SVG Icons

**Files:**
- Modify: `src/renderer/index.html`

- [ ] **Step 1: Replace text-only buttons with Icon + Text structure**

Modify `src/renderer/index.html` around line 24:

```html
            <div class="navigation-buttons">
                <button id="btn-reunioes" class="nav-icon-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="6" r="3"></circle>
                        <path d="M7 14.5c0-2 2-3.5 5-3.5s5 1.5 5 3.5V18H7v-3.5z"></path>
                        <path d="M5 18h14"></path>
                        <rect x="6" y="18" width="12" height="4"></rect>
                        <path d="M12 11v1.5"></path>
                    </svg>
                    <span>Reuniões</span>
                </button>
                <button id="btn-cantico" class="nav-icon-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"></path>
                        <circle cx="6" cy="18" r="3"></circle>
                        <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                    <span>Cântico</span>
                </button>
                <button id="btn-videos" class="nav-icon-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <line x1="2" y1="7" x2="7" y2="7"></line>
                        <line x1="2" y1="17" x2="7" y2="17"></line>
                        <line x1="17" y1="17" x2="22" y2="17"></line>
                        <line x1="17" y1="7" x2="22" y2="7"></line>
                    </svg>
                    <span>Vídeos</span>
                </button>
                <button id="btn-esbocos" class="nav-icon-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <span>Esboços</span>
                </button>
                <button id="btn-whatsapp" class="nav-icon-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.13.57-.074 1.758-.717 2.006-1.412.248-.695.248-1.29.173-1.412-.074-.122-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.886 9.886m8.415-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.149-1.613a11.815 11.815 0 005.895 1.573h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                </button>
            </div>
```

- [ ] **Step 2: Verify existing button IDs are preserved**

Ensure that `btn-reunioes`, `btn-cantico`, `btn-videos`, `btn-esbocos`, and `btn-whatsapp` are still present so that `eventHandler.js` continues to work.

- [ ] **Step 3: Commit HTML changes**

```bash
git add src/renderer/index.html
git commit -m "feat: redesign header buttons with SVG icons and labels"
```

### Task 3: Final Verification

- [ ] **Step 1: Check header layout and responsiveness**

Launch the app and verify:
- Buttons are aligned vertically (Icon top, Text bottom).
- Hover effects work.
- Clicking each button still triggers the correct navigation in the `WebContentsView`.
- The header height is balanced.

- [ ] **Step 2: Adjust spacing if necessary**

If the header feels too cramped or too tall, adjust padding in `src/renderer/main.css`.

- [ ] **Step 3: Final Commit**

```bash
git add src/renderer/main.css
git commit -m "style: final adjustments to header button spacing"
```

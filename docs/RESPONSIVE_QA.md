# Responsive Quality Assurance Specification and Device Matrix
**Project:** oldrcesupport/my_website  

---

## 1. Viewport Testing Grid

| Category | Device Form Factor | Target Viewport (W×H) | Orientation | Primary Evaluation Focus |
|---|---|---|---|---|
| Mobile Small | iPhone SE / Older Compacts | 320 × 568 | Portrait | Header wrapping, hero buttons, purchase modal padding |
| Mobile Standard | Samsung Galaxy S20 / Android | 360 × 800 | Portrait | Persian font readability, input touch targets, QR card width |
| Mobile Standard | iPhone 12 / 13 / 14 | 390 × 844 | Portrait | Bottom sticky bar, mobile navigation drawer, receipt layout |
| Mobile Large | iPhone Plus / Pro Max | 430 × 932 | Portrait | Spacing balance, scanner container aspect ratio |
| Tablet Small | iPad Mini / 8-inch Android | 600 × 960 | Portrait | Grid column transitions, navbar layout |
| Tablet Medium | iPad Air / Pro 10.5" | 768 × 1024 | Portrait | Form column splitting, admin sidebar collapse |
| Tablet Landscape | iPad Air / Pro 10.5" | 1024 × 768 | Landscape | 2-column ticket grid, admin dashboard card flow |
| Laptop Small | HD Netbook / Ultrabook | 1280 × 720 | Landscape | Header menu visibility, scanner viewport centering |
| Laptop Standard | Full HD 14-15" Laptop | 1366 × 768 | Landscape | Editorial hero composition, footer layout |
| Desktop Full HD | 24-27" Standard Monitor | 1920 × 1080 | Landscape | Maximum container constraints, whitespace stability |

---

## 2. Responsive Invariants
1. **Zero Horizontal Overflow:** Body elements must never exceed `100vw`.
2. **Accessible Touch Targets:** Minimum interactive area of 44 × 44 CSS pixels.
3. **Readable Persian Typography:** Base font size never below 12px for body copy and 11px for secondary metadata.
4. **Adaptive Admin Tables:** Table overflow gracefully handled via horizontal scroll containers on mobile with sticky essential action columns.


# Design Themes - AI Hub

Diese Datei definiert die Design-Tokens und Theme-Konfigurationen für die AI Hub Applikation.

## Theme-Struktur Übersicht

Ein vollständiges Design Theme für AI Hub sollte folgende Kategorien umfassen:

### 1. **Color System**

#### 1.1 Brand Colors (Primäre Farben)
- **Primary Color**: Hauptfarbe der App (z.B. für Buttons, Links, Highlights)
  - Empfehlung: **10 Shades** (50, 100, 200, 300, 400, 500, 600, 700, 800, 900)
  - **Light Mode**: Nutze 500-700 als Hauptfarben
    - Buttons: 600
    - Hover: 700
    - Background: 50-100
  - **Dark Mode**: Nutze 300-500 als Hauptfarben (hellere Shades für besseren Kontrast)
    - Buttons: 400-500
    - Hover: 300
    - Background: 800-900

- **Secondary Color**: Sekundäre Akzentfarbe
  - Empfehlung: **10 Shades**
  - **Light Mode**: 500-600
  - **Dark Mode**: 400-500
  
- **Warning**: Warnungen, Vorsicht
  - Empfehlung: **10 Shades** (Orange/Amber-Palette)
  - **Light Mode**: 500-600
  - **Dark Mode**: 400-500

- **Error/Danger**: Fehler, kritische Actions
  - Empfehlung: **10 Shades** (Rot-Palette)
  - **Light Mode**: 500-600
  - **Dark Mode**: 400-500

- **Info**: Informative Meldungen
  - Empfehlung: **10 Shades** (Blau-Palette)
  - **Light Mode**: 500-600
  - **Dark Mode**: 400-50 Shades** (Rot-Palette)
  - Standard: 500-600

- **Info**: Informative Meldungen
  - Empfehlung: **10 Shades** (Blau-Palette)
  - Standard: 500-600

#### 1.3 Neutral Colors (Graustufen)
- **Gray Scale**: Für Backgrounds, Borders, Text
  - Empfehlung: **10 Shades** (0-900)
  - 0: Weiß / Fast-Weiß
  - 50-200: Light Backgrounds, Subtle Borders
  - 300-500: Borders, Disabled States
  - 600-900: Text Colors, Dark Backgrounds

#### 1.4 Background Colors
- **App Background**: Haupt-Hintergrundfarbe
  - Light Mode: gray.0 oder pure white
  - Dark Mode: gray.900 oder custom dark

- **Paper/Card Background**: Container-Hintergrund
  - Light Mode: white oder gray.50
  - Dark Mode: gray.800

- **Elevated Background**: Hervorgehobene Container (Modals, Dropdowns)
  - Light Mode: white + shadow
  - Dark Mode: gray.700

- **Overlay Background**: Für Modals/Dialogs
  - Semi-transparent black/gray
  - Empfehlung: rgba(0, 0, 0, 0.5) - rgba(0, 0, 0, 0.75)

#### 1.5 Text Colors
- **Primary Text**: Haupt-Textfarbe
  - Light Mode: gray.900 oder black
  - Dark Mode: gray.50 oder white

- **Secondary Text**: Sekundärer Text (weniger prominent)
  - Light Mode: gray.600-700
  - Dark Mode: gray.400

- **Disabled Text**: Deaktivierter Text
  - Light Mode: gray.400-500
  - Dark Mode: gray.600

- **Link Color**: Hyperlinks
  - Standard: primary.600 (Light), primary.400 (Dark)
  - Hover: primary.700 (Light), primary.300 (Dark)

#### 1.6 Border Colors
- **Default Border**: Standard-Rahmen
  - Light Mode: gray.200-300
  - Dark Mode: gray.700

- **Focus Border**: Fokus-Zustand
  - primary.500 mit opacity oder primary.400

- **Error Border**: Fehler-Zustand
  - error.500

---

### 2. **Spacing System**
Konsistente Abstände für Margins, Paddings, Gaps

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px

**Verwendung**:
- Kompakte UI: xs, sm
- Standard: md
- Großzügig: lg, xl
- Sections: 2xl, 3xl

---

### 3. **Typography**

#### 3.1 Font Families
- **Primary Font**: Für Text-Content
  - Empfehlung: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  
- **Heading Font**: Für Überschriften
  - Empfehlung: Gleiche wie Primary oder serifenlos (z.B. `Poppins, Inter`)

- **Monospace Font**: Für Code
  - Empfehlung: `'Fira Code', 'Monaco', 'Courier New', monospace`

#### 3.2 Font Sizes
- **xs**: 10px-12px (Labels, Captions)
- **sm**: 13px-14px (Small Text)
- **md**: 15px-16px (Body Text)
- **lg**: 17px-18px (Subheadings)
- **xl**: 20px-22px (Headings)
- **2xl**: 24px-28px (Page Titles)
- **3xl**: 32px-40px (Hero Headlines)

#### 3.3 Font Weights
- **light**: 300
- **regular**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

#### 3.4 Line Heights
- **tight**: 1.2 (Headlines)
- **normal**: 1.5 (Body Text)
- **relaxed**: 1.75 (Long-form Content)

---

### 4. **Shadows (Box Shadows)**
Konsistente Schatten für Elevation-Levels

- **xs**: Subtiler Schatten (Cards, leicht angehoben)
  - `0 1px 3px rgba(0, 0, 0, 0.05)`

- **sm**: Kleiner Schatten (Hover States)
  - `0 2px 8px rgba(0, 0, 0, 0.1)`

- **md**: Mittlerer Schatten (Dropdowns, Tooltips)
  - `0 4px 12px rgba(0, 0, 0, 0.15)`

- **lg**: Großer Schatten (Modals, Overlays)
  - `0 8px 24px rgba(0, 0, 0, 0.2)`

- **xl**: Sehr großer Schatten (Hero Elements)
  - `0 16px 48px rgba(0, 0, 0, 0.25)`

**Dark Mode**: Reduzierte Opacity oder hellere Schatten verwenden

---

### 5. **Border Radius**
Konsistente Rundungen für UI-Elemente

- **xs**: 2px (subtil)
- **sm**: 4px (Inputs, kleine Buttons)
- **md**: 8px (Cards, Standard-Buttons)
- **lg**: 12px (große Cards)
- **xl**: 16px (Modals, Hero Cards)
- **full**: 9999px (Pills, Avatars)

---

### 6. **Border Widths**

- **thin**: 1px (Standard)
- **medium**: 2px (Focus States)
- **thick**: 3px-4px (Emphasis)

---

### 7. **Transitions & Animations**

#### 7.1 Timing Functions
- **ease-in**: Beschleunigend
- **ease-out**: Abbremsend
- **ease-in-out**: Smooth (Standard)

#### 7.2 Duration
- **fast**: 150ms (Hover, kleine Änderungen)
- **normal**: 250ms (Standard)
- **slow**: 400ms (Modals, große Bewegungen)

---

### 8. **Z-Index System**
Layering-Hierarchie für überlappende Elemente

- **base**: 0 (Standard-Content)
- **dropdown**: 100 (Dropdowns, Tooltips)
- **sticky**: 200 (Sticky Headers)
- **overlay**: 300 (Modal Overlays)
- **modal**: 400 (Modal Content)
- **notification**: 500 (Toasts, Notifications)
- **max**: 9999 (Critical Overlays)

---

### 9. **Breakpoints (Responsive)**
Für responsive Design

- **xs**: 0px (Mobile)
- **sm**: 576px (Small Tablets)
- **md**: 768px (Tablets)
- **lg**: 992px (Small Desktops)
- **xl**: 1200px (Desktops)
- **2xl**: 1400px (Large Screens)

---

### 10. **Component-Specific Tokens**

#### 10.1 Buttons
- Padding: sm-md
- Border Radius: sm-md
- Font Weight: medium-semibold
- Sizes: xs, sm, md, lg, xl

#### 10.2 Inputs
- Height: 32px (sm), 40px (md), 48px (lg)
- Border Radius: sm
- Border: 1px solid border-color
- Focus: Ring (outline) in primary color

#### 10.3 Cards
- Padding: md-lg
- Border Radius: md-lg
- Shadow: xs-sm
- Background: paper-background

#### 10.4 Modals/Overlays
- Max Width: 400px (sm), 600px (md), 800px (lg)
- Padding: lg-xl
- Border Radius: lg
- Shadow: lg-xl

---

## Light vs. Dark Mode - Übersicht

Alle definierten Tokens müssen für **beide Modi** spezifiziert werden:

### Color Adaptations (Light → Dark)
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| **App Background** | white / gray.50 | gray.900 / #1a1a1a |
| **Paper Background** | white / gray.50 | gray.800 / #2a2a2a |
| **Primary Text** | gray.900 | gray.50 / white |
| **Secondary Text** | gray.600 | gray.400 |
| **Border Color** | gray.200 | gray.700 |
| **Primary Color** | Use 600 shade | Use 400 shade |
| **Shadows** | rgba(0,0,0,0.1-0.25) | rgba(0,0,0,0.3-0.5) or lighter colors |

### Component Adjustments
- **Cards**: Light: white bg + subtle shadow | Dark: dark bg + border statt shadow
- **Inputs**: Light: white bg + border | Dark: darker bg + lighter border
- **Buttons**: Primary bleibt ähnlich, aber hellere Shades in Dark Mode

---

## Empfohlene Theme-Varianten

### 1. Light Theme (Default)
- **App Background**: white oder gray.50
- **Paper/Cards**: white mit shadow
- **Text**: gray.900 (primary), gray.600 (secondary)
- **Borders**: gray.200-300
- **Shadows**: Subtil, opacity 0.05-0.2
- **Primary Color**: Nutze 500-600 shades

### 2. Dark Theme
- **App Background**: gray.900 oder #1a1a1a
- **Paper/Cards**: gray.800 mit border statt shadow
- **Text**: white/gray.50 (primary), gray.400 (secondary)
- **Borders**: gray.700
- **Shadows**: Stärker, opacity 0.3-0.5 oder ganz weglassen
- **Primary Color**: Nutze 400-500 shades (hellere Varianten)

### 3. Custom Themes (Optional)
- High Contrast (WCAG AAA)
- Colorblind-friendly
- Custom Brand Colors

---

## Nächste Schritte

1. ✅ **Default Light Theme** definieren mit konkreten Werten
2. ✅ **Dark Theme** ableiten
3. Theme in Mantine-Konfiguration implementieren
4. CSS Custom Properties für globale Verfügbarkeit
5. Theme-Switcher implementieren

---

# Theme Definitionen

## 1. Default Theme

Das **Default Theme** ist das Standard-Design der AI Hub Applikation mit modernem, professionellem Look.

### Design-Philosophie
- **Modern & Clean**: Klare Linien, ausreichend Whitespace
- **Professional**: Business-tauglich, seriös
- **Accessible**: WCAG AA konform, gute Kontraste
- **AI-fokussiert**: Tech-inspirierte Farbpalette (Blau/Lila)

---

### 1.1 Default Light Theme

#### Colors

##### Brand Colors
```typescript
primary: {
  50: '#e3f2fd',   // Sehr hell - für Backgrounds
  100: '#bbdefb',  // Hell - für Hover-Backgrounds
  200: '#90caf9',  // Light
  300: '#64b5f6',  // 
  400: '#42a5f5',  // Für Dark Mode Buttons
  500: '#2196f3',  // Standard Primary (Buttons, Links)
  600: '#1e88e5',  // Primary (Light Mode Default)
  700: '#1976d2',  // Hover, Active States
  800: '#1565c0',  // 
  900: '#0d47a1',  // Sehr dunkel - für Text on Light
}

secondary: {
  50: '#f3e5f5',   // Sehr hell
  100: '#e1bee7',  // Hell
  200: '#ce93d8',  // Light
  300: '#ba68c8',  //
  400: '#ab47bc',  // Für Dark Mode
  500: '#9c27b0',  // Standard Secondary
  600: '#8e24aa',  // Light Mode Default
  700: '#7b1fa2',  // Hover, Active
  800: '#6a1b9a',  //
  900: '#4a148c',  // Sehr dunkel
}
```

##### Semantic Colors
```typescript
success: {
  50: '#e8f5e9',
  100: '#c8e6c9',
  200: '#a5d6a7',
  300: '#81c784',
  400: '#66bb6a',
  500: '#4caf50',   // Standard Success
  600: '#43a047',   // Light Mode Default
  700: '#388e3c',   // Hover
  800: '#2e7d32',
  900: '#1b5e20',
}

warning: {
  50: '#fff3e0',
  100: '#ffe0b2',
  200: '#ffcc80',
  300: '#ffb74d',
  400: '#ffa726',
  500: '#ff9800',   // Standard Warning
  600: '#fb8c00',   // Light Mode Default
  700: '#f57c00',   // Hover
  800: '#ef6c00',
  900: '#e65100',
}

error: {
  50: '#ffebee',
  100: '#ffcdd2',
  200: '#ef9a9a',
  300: '#e57373',
  400: '#ef5350',
  500: '#f44336',   // Standard Error
  600: '#e53935',   // Light Mode Default
  700: '#d32f2f',   // Hover
  800: '#c62828',
  900: '#b71c1c',
}

info: {
  50: '#e1f5fe',
  100: '#b3e5fc',
  200: '#81d4fa',
  300: '#4fc3f7',
  400: '#29b6f6',
  500: '#03a9f4',   // Standard Info
  600: '#039be5',   // Light Mode Default
  700: '#0288d1',   // Hover
  800: '#0277bd',
  900: '#01579b',
}
```

##### Neutral Colors (Gray Scale)
```typescript
gray: {
  0: '#ffffff',     // Pure White
  50: '#fafafa',    // App Background
  100: '#f5f5f5',   // Card Background Alternative
  200: '#eeeeee',   // Borders, Dividers
  300: '#e0e0e0',   // Borders
  400: '#bdbdbd',   // Disabled Text
  500: '#9e9e9e',   // Disabled Elements
  600: '#757575',   // Secondary Text (Light Mode)
  700: '#616161',   // Secondary Text Dark
  800: '#424242',   // Dark Backgrounds
  900: '#212121',   // Primary Text (Light Mode), Dark BG
}
```

#### Background Colors
```typescript
backgrounds: {
  app: gray[50],              // #fafafa - Haupt-App-Hintergrund
  paper: '#ffffff',           // white - Cards, Containers
  elevated: '#ffffff',        // white - Modals, Dropdowns
  overlay: 'rgba(0, 0, 0, 0.5)', // Modal-Backdrop
}
```

#### Text Colors
```typescript
text: {
  primary: gray[900],         // #212121 - Haupt-Text
  secondary: gray[600],       // #757575 - Sekundärer Text
  disabled: gray[400],        // #bdbdbd - Deaktiviert
  link: primary[600],         // #1e88e5 - Links
  linkHover: primary[700],    // #1976d2 - Link Hover
}
```

#### Border Colors
```typescript
borders: {
  default: gray[200],         // #eeeeee - Standard-Border
  light: gray[100],           // #f5f5f5 - Sehr subtil
  medium: gray[300],          // #e0e0e0 - Deutlicher
  focus: primary[500],        // #2196f3 - Focus State
  error: error[500],          // #f44336 - Error State
}
```

#### Shadows
```typescript
shadows: {
  xs: '0 1px 3px rgba(0, 0, 0, 0.05)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 12px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.2)',
}
```

---

### 1.2 Default Dark Theme

#### Colors

##### Brand Colors
```typescript
// Gleiche Shades wie Light, aber andere Verwendung
primary: {
  // ... gleiche Werte wie Light Theme
  // Verwendung in Dark Mode:
  // - Buttons: 400-500 (#42a5f5, #2196f3)
  // - Hover: 300 (#64b5f6)
  // - Background: 900 (#0d47a1)
}

secondary: {
  // ... gleiche Werte wie Light Theme
  // Verwendung: 400-500 für Buttons, 300 für Hover
}
```

##### Semantic Colors
```typescript
// Gleiche Paletten, hellere Shades verwenden (400-500 statt 600-700)
success: { /* ... gleiche Werte, nutze 400-500 */ }
warning: { /* ... gleiche Werte, nutze 400-500 */ }
error: { /* ... gleiche Werte, nutze 400-500 */ }
info: { /* ... gleiche Werte, nutze 400-500 */ }
```

##### Neutral Colors
```typescript
gray: {
  // ... gleiche Werte wie Light Theme
  // Invertierte Verwendung:
  // - App Background: 900 (#212121)
  // - Card Background: 800 (#424242)
  // - Primary Text: 50 (#fafafa) oder 0 (#ffffff)
  // - Secondary Text: 400 (#bdbdbd)
}
```

#### Background Colors
```typescript
backgrounds: {
  app: '#121212',             // Sehr dunkler Hintergrund (besser als pure black)
  paper: gray[800],           // #424242 - Cards, Containers
  elevated: gray[700],        // #616161 - Modals, Dropdowns
  overlay: 'rgba(0, 0, 0, 0.7)', // Dunklerer Backdrop
}
```

#### Text Colors
```typescript
text: {
  primary: gray[50],          // #fafafa - Haupt-Text
  secondary: gray[400],       // #bdbdbd - Sekundärer Text
  disabled: gray[600],        // #757575 - Deaktiviert
  link: primary[400],         // #42a5f5 - Links (heller als Light Mode)
  linkHover: primary[300],    // #64b5f6 - Link Hover
}
```

#### Border Colors
```typescript
borders: {
  default: gray[700],         // #616161 - Standard-Border
  light: gray[800],           // #424242 - Sehr subtil
  medium: gray[600],          // #757575 - Deutlicher
  focus: primary[400],        // #42a5f5 - Focus State
  error: error[400],          // #ef5350 - Error State
}
```

#### Shadows
```typescript
shadows: {
  // Stärkere Schatten oder Borders bevorzugen
  xs: '0 1px 3px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 4px 12px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.6)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.7)',
  
  // Alternative: Borders statt Shadows
  // border: `1px solid ${gray[700]}`
}
```

---

### Gemeinsame Tokens (Light & Dark)

Diese Werte bleiben in beiden Modi gleich:

#### Spacing
```typescript
spacing: {
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 16,   // 16px
  lg: 24,   // 24px
  xl: 32,   // 32px
  '2xl': 48,  // 48px
  '3xl': 64,  // 64px
}
```

#### Typography
```typescript
fontFamily: {
  primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"Fira Code", Monaco, "Courier New", monospace',
}

fontSize: {
  xs: 12,   // 12px
  sm: 14,   // 14px
  md: 16,   // 16px (Base)
  lg: 18,   // 18px
  xl: 20,   // 20px
  '2xl': 24,  // 24px
  '3xl': 32,  // 32px
  '4xl': 40,  // 40px
}

fontWeight: {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
}

lineHeight: {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
}
```

#### Border Radius
```typescript
radius: {
  xs: 2,    // 2px
  sm: 4,    // 4px
  md: 8,    // 8px
  lg: 12,   // 12px
  xl: 16,   // 16px
  full: 9999, // Pill shape
}
```

#### Transitions
```typescript
transition: {
  duration: {
    fast: 150,    // 150ms
    normal: 250,  // 250ms
    slow: 400,    // 400ms
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}
```

#### Z-Index
```typescript
zIndex: {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  notification: 500,
  max: 9999,
}
```

---

## Theme Usage Guide

### Wann welches Shade verwenden?

#### Light Mode
- **Primary/Secondary Buttons**: 600
- **Hover States**: 700
- **Active/Pressed**: 800
- **Text on Light**: 900
- **Backgrounds**: 50-100
- **Borders**: 200-300

#### Dark Mode
- **Primary/Secondary Buttons**: 400-500
- **Hover States**: 300
- **Active/Pressed**: 600
- **Text on Dark**: 50-100
- **Backgrounds**: 800-900
- **Borders**: 600-700

### Accessibility
- **Kontrast-Verhältnis**: Mindestens 4.5:1 für Text, 3:1 für UI-Komponenten
- **Focus States**: Immer sichtbar (Primary Color + Outline)
- **Farbenblindheit**: Nicht nur auf Farbe verlassen (Icons, Text verwenden)

---

# Design System Documentation

## Philosophy

The News Dashboard follows a **reading-first** design philosophy inspired by Instapaper. Every design decision prioritizes content clarity, readability, and minimal distraction.

### Core Principles

1. **Typography is Interface** - Text is the primary UI element
2. **Neutral by Default** - No colors compete with content  
3. **Device Adaptive** - Optimizes for the viewing context
4. **Open Source Everything** - No proprietary dependencies
5. **Performance Conscious** - Zero external resources

## Typography

### Font Stack
```css
/* Primary: Open source serif fonts */
font-family: Georgia, 'Times New Roman', 'Liberation Serif', serif;
```

**Font Selection Rationale:**
- **Georgia**: Microsoft's web-optimized serif (widely available)
- **Times New Roman**: Universal fallback serif
- **Liberation Serif**: Red Hat's open source Times alternative
- **serif**: System serif fallback

### Font Sizing (Device Adaptive)

```css
/* Desktop (1200px+) */
body: 19px
headlines: 1.375rem (22px)

/* Laptop (992-1199px) */  
body: 18px
headlines: 1.25rem (20px)

/* Tablet Landscape (768-991px) */
body: 17px  
headlines: 1.25rem (20px)

/* Tablet Portrait (576-767px) */
body: 16px
headlines: 1.125rem (18px)

/* Mobile (<576px) */
body: 16px
headlines: 1.125rem (18px)
```

### Line Height
```css
body: 1.7          /* Generous for reading comfort */
headlines: 1.3     /* Tighter for visual hierarchy */
```

### Font Weights
```css
headlines: 400     /* Normal weight, not bold */
body: 400          /* Normal weight throughout */
meta: 400          /* Consistent weight hierarchy */
```

## Color Palette

### Light Theme
```css
--bg-primary: #ffffff      /* Pure white background */
--bg-secondary: #f8f9fa    /* Subtle content backgrounds */
--bg-tertiary: #e9ecef     /* Interactive element backgrounds */
--text-primary: #212529    /* High contrast body text */
--text-secondary: #6c757d  /* Meta information, labels */
--text-muted: #adb5bd      /* Disabled states, hints */
--border: #dee2e6          /* Subtle element separation */
--accent: #2c2c2c          /* Interactive elements */
--accent-hover: #1a1a1a    /* Hover states */
```

### Dark Theme  
```css
--bg-primary: #0f0f0f      /* Deep black background */
--bg-secondary: #1a1a1a    /* Content area backgrounds */
--bg-tertiary: #2a2a2a     /* Interactive backgrounds */
--text-primary: #e8e8e8    /* High contrast light text */
--text-secondary: #a0a0a0  /* Meta information */
--text-muted: #707070      /* Disabled, hints */
--border: #333333          /* Element separation */
--accent: #e8e8e8          /* Interactive elements */
--accent-hover: #ffffff    /* Hover states */
```

### Color Usage Rules

1. **No Brand Colors** - Only neutral grays and black/white
2. **High Contrast** - Meets WCAG AA standards minimum
3. **Consistent Hierarchy** - Primary > Secondary > Muted
4. **Theme Symmetry** - Dark theme mirrors light theme structure

## Spacing System

### Base Scale
```css
--space-xs: 0.25rem    /* 4px  - Micro spacing */
--space-sm: 0.5rem     /* 8px  - Element spacing */  
--space-md: 1rem       /* 16px - Component spacing */
--space-lg: 1.5rem     /* 24px - Section spacing */
--space-xl: 2rem       /* 32px - Page spacing */
--space-2xl: 3rem      /* 48px - Major breaks */
```

### Application
```css
/* Article spacing */
article-padding: var(--space-xl)           /* 32px comfortable reading */
article-gap: var(--space-lg)               /* 24px between articles */
meta-spacing: var(--space-md)              /* 16px between meta elements */

/* Header/navigation */
header-padding: var(--space-lg)            /* 24px header comfort */
filter-spacing: var(--space-md)            /* 16px between filters */
button-spacing: var(--space-sm)            /* 8px button padding */
```

## Layout System

### Content Width (Device Adaptive)
```css
/* Optimal reading line length */
Desktop (1200px+):    800px max-width    /* 70-80 characters per line */
Laptop (992-1199px):  min(750px, 90vw)   /* Responsive but limited */
Tablet (768-991px):   min(700px, 95vw)   /* More screen utilization */
Portrait (576-767px): 95vw               /* Near full-width */
Mobile (<576px):      98vw               /* Maximum utilization */
```

### Grid Structure
```css
/* Simple single-column layout */
.container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}

/* Article list - no grid, pure stacking */
.articles {
  display: flex;
  flex-direction: column;
  gap: 0;  /* Articles separated by borders only */
}
```

### Vertical Rhythm
```css
/* Consistent vertical spacing */
header-height: 80px           /* Fixed header space */
filter-height: 60px           /* Filter bar space */
article-separation: 1px       /* Border-based separation */
bottom-padding: var(--space-xl)  /* Reading completion space */
```

## Component Design

### Articles
```css
.article {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  padding: var(--space-xl);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.article:hover {
  background: var(--bg-secondary);
}

.article-title {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.3;
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

.article-summary {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}
```

### Navigation
```css
.header {
  background: var(--bg-primary);
  height: var(--header-height);
  position: sticky;
  top: 0;
  z-index: 100;
}

.filter-btn {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 400;
  cursor: pointer;
  padding: var(--space-sm) 0;
  margin-right: var(--space-lg);
  transition: color 0.2s ease;
}

.filter-btn:hover,
.filter-btn.active {
  color: var(--text-primary);
}
```

### Interactive Elements
```css
/* Text-based buttons */
.text-btn {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  padding: var(--space-sm) 0;
  transition: color 0.2s ease;
}

.text-btn:hover {
  color: var(--text-primary);
}

/* Links */
.read-link {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
}

.read-link:hover {
  text-decoration: underline;
}
```

## Visual Hierarchy

### Content Priority
1. **Article Headlines** - Largest, primary color
2. **Article Summaries** - Medium, secondary color  
3. **Meta Information** - Small, secondary color
4. **Actions** - Small, secondary color, hover to primary
5. **Navigation** - Small, muted, minimal presence

### Size Hierarchy
```css
/* Relative sizing for clear hierarchy */
h1 (page title): 1.25rem
h2 (article title): 1.25rem  
body text: 1rem
meta text: 0.875rem
small text: 0.75rem
```

### Color Hierarchy
```css
/* Attention order via color contrast */
Primary text: var(--text-primary)     /* Highest contrast */
Secondary text: var(--text-secondary) /* Medium contrast */
Muted text: var(--text-muted)        /* Lowest contrast */
```

## Motion Design

### Principles
- **Minimal Animation** - Only functional, never decorative
- **Fast Transitions** - 0.2s duration maximum
- **Ease Timing** - Natural CSS ease curves
- **Purposeful** - All motion serves usability

### Implemented Animations
```css
/* Hover transitions */
transition: color 0.2s ease;           /* Text color changes */
transition: background-color 0.2s ease; /* Background changes */

/* No transforms, fades, or complex animations */
/* Reading-focused = distraction-free */
```

## Accessibility

### Color Contrast
- **Light Theme**: 4.5:1 ratio minimum (WCAG AA)
- **Dark Theme**: 4.5:1 ratio minimum (WCAG AA)
- **Interactive Elements**: Clear hover states
- **Focus Indicators**: Keyboard navigation support

### Typography Accessibility
- **Font Size**: 16px minimum on all devices
- **Line Height**: 1.7 for comfortable reading
- **Line Length**: 45-75 characters optimal
- **Font Choice**: High-readability serif

### Keyboard Navigation
```css
/* Focus styles */
.btn:focus,
.filter-btn:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Screen Reader Support
- Semantic HTML structure
- Proper heading hierarchy
- Alt text for interactive elements
- ARIA labels where needed

## Performance

### CSS Strategy
- **Zero External Requests** - All CSS inline/bundled
- **Custom Properties** - Efficient theme switching
- **Minimal Selectors** - Simple, fast CSS
- **No Frameworks** - Reduced bundle size

### Font Loading
- **System Fonts** - No web font requests
- **Fallback Stack** - Graceful degradation
- **No FOIT/FOUT** - Immediate text rendering

### Image Strategy
- **No Images** - Pure text interface
- **No Icons** - Unicode characters only
- **No Graphics** - CSS-only design

## Browser Support

### Target Browsers
- **Chrome/Edge**: Current and previous major version
- **Firefox**: Current and previous major version  
- **Safari**: Current and previous major version
- **Mobile Safari**: iOS 13+
- **Chrome Mobile**: Android 8+

### CSS Features Used
```css
/* Modern CSS with fallbacks */
CSS Grid: No (uses flexbox)
Flexbox: Yes (IE11+ support)
Custom Properties: Yes (IE Edge+ support)
calc(): Yes (IE9+ support)
Media Queries: Yes (universal support)
```

### Progressive Enhancement
- **Base Experience**: Works without JavaScript
- **Enhanced Experience**: Interactive features with JS
- **Graceful Degradation**: All content accessible always

## Theme Implementation

### CSS Custom Properties
```css
:root {
  /* Light theme variables (default) */
}

[data-theme="dark"] {
  /* Dark theme variable overrides */
}
```

### JavaScript Theme Toggle
```javascript
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
}
```

### Theme Persistence
```javascript
// Load saved theme on page load
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
```

## Design Tokens

### Exported Tokens (for external use)
```css
/* Spacing */
--spacing-micro: 0.25rem;
--spacing-small: 0.5rem;
--spacing-medium: 1rem;
--spacing-large: 1.5rem;
--spacing-xlarge: 2rem;

/* Typography */
--font-family-primary: Georgia, 'Times New Roman', 'Liberation Serif', serif;
--font-size-body: clamp(16px, 2.5vw, 19px);
--line-height-body: 1.7;
--line-height-heading: 1.3;

/* Colors */
--color-text-primary: #212529;
--color-text-secondary: #6c757d;
--color-bg-primary: #ffffff;
--color-bg-secondary: #f8f9fa;
--color-border: #dee2e6;
```

## Component Library

### Reusable Components
```css
/* Base button */
.btn-base {
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.2s ease;
}

.btn-base:hover {
  color: var(--text-primary);
}

/* Article card */
.article-card {
  border-bottom: 1px solid var(--border);
  padding: var(--space-xl);
  transition: background-color 0.2s ease;
}

.article-card:hover {
  background: var(--bg-secondary);
}

/* Content container */
.content-container {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 var(--space-md);
}
```

## Design Guidelines

### Do's
✅ Use generous line-height for readability  
✅ Maintain high color contrast  
✅ Keep interactions minimal and purposeful  
✅ Use system fonts for performance  
✅ Design mobile-up, not mobile-first  
✅ Prioritize content over interface  

### Don'ts  
❌ Add decorative animations or transitions  
❌ Use colors that compete with content  
❌ Create complex component hierarchies  
❌ Load external fonts or icon libraries  
❌ Override browser default behaviors unnecessarily  
❌ Add visual elements that don't serve reading  

## Future Considerations

### Scalability
- Design system can support additional content types
- Color palette extensible for categorization (if needed)
- Typography scale can accommodate longer content
- Component system ready for new interface elements

### Accessibility Enhancements
- High contrast mode support
- Reduced motion preference support  
- Font size preference support
- Screen reader optimization

### International Support
- RTL language support ready
- Font stacks for non-Latin scripts
- Spacing adjustments for different writing systems
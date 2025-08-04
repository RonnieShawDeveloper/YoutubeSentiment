# Blue Theme Implementation Documentation

## Overview

This document describes the implementation of the blue theme with animated backgrounds for the YouTube Sentiment Analysis application. The theme is designed to create a futuristic, dynamic user interface with subtle animations that make the site feel alive and breathing.

## Color Palette

The theme uses a blue color palette defined in the Tailwind configuration:

- **Primary Colors (Blues)**:
  - Primary-50: #e6f1ff (Lightest blue, used for text on dark backgrounds)
  - Primary-100: #cce3ff
  - Primary-200: #99c7ff
  - Primary-300: #66abff
  - Primary-400: #338fff
  - Primary-500: #0073ff (Main blue)
  - Primary-600: #005ccc
  - Primary-700: #004599
  - Primary-800: #002e66
  - Primary-900: #001733 (Darkest blue)

- **Secondary Colors (Light Blues)**:
  - Secondary-50 to Secondary-900: Various shades of light blue

- **Accent Colors (Amber/Gold)**:
  - Accent-50 to Accent-900: Various shades of amber/gold

## Background Animations

### Grid Animation
A subtle grid-like background animation is implemented using CSS pseudo-elements. The grid lines slowly move across the screen to create a sense of depth and movement.

```css
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 45, 107, 0.8) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 45, 107, 0.8) 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: center center;
  z-index: -1;
  animation: gridMove 120s linear infinite;
}
```

### Pulsing Glow
A pulsing glow effect is added to create a breathing effect on the background.

```css
body::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 50% 50%, rgba(51, 143, 255, 0.15), transparent 60%);
  z-index: -1;
  animation: pulseGlow 8s ease-in-out infinite alternate;
}
```

## Animation Classes

Several animation classes are available for use throughout the application:

- **pulse-glow**: Creates a pulsing blue glow effect on elements
- **float**: Makes elements gently float up and down
- **shimmer**: Adds a subtle light shimmer effect across elements
- **slide-up**: Slides elements up into view with a fade-in effect

## Component Styling

### Cards
Cards use a semi-transparent dark blue background with blur effect, blue borders, and subtle glow effects.

```css
.mat-mdc-card {
  background-color: rgba(12, 45, 107, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(51, 143, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: #e6f1ff;
}
```

### Buttons
Buttons have a blue gradient background, glow shadow effect, and a rotating gradient overlay animation.

```css
button[mat-raised-button] {
  background: linear-gradient(45deg, #0073ff, #338fff);
  box-shadow: 0 4px 15px rgba(0, 115, 255, 0.4);
  position: relative;
  overflow: hidden;
}

button[mat-raised-button]::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  transform: rotate(45deg);
  animation: rotateGradient 3s linear infinite;
}
```

### Form Fields
Form fields use a semi-transparent dark blue background with blue borders and outlines.

```css
.mat-mdc-form-field-flex {
  background-color: rgba(0, 45, 107, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(51, 143, 255, 0.2);
}
```

## Page-Specific Styling

### Dashboard
The dashboard features a blue gradient header, animated report cards with 3D effects, and pulsing credit badges.

### Login/Signup
The login and signup pages have rotating background animations and glass-like card effects.

## Responsive Design

The theme is fully responsive and adapts to different screen sizes. Media queries are used to adjust the layout and styling for smaller screens.

## Future Enhancements

Potential future enhancements to the theme could include:

1. More interactive animations on user actions
2. Particle effects for background elements
3. Custom loading animations with the blue theme
4. Dark/light theme toggle option
5. Customizable accent colors

## Maintenance

When adding new components or pages to the application, ensure they follow the blue theme guidelines:

1. Use the defined color palette from the Tailwind configuration
2. Implement appropriate animations for interactive elements
3. Maintain the semi-transparent, glass-like aesthetic for cards and containers
4. Ensure text has sufficient contrast against backgrounds

# Extension Icons

This directory contains icon assets for the NeoApply Chrome extension.

## Required Sizes

The extension requires icons in the following sizes:
- 16x16 (toolbar icon, small)
- 32x32 (toolbar icon, retina)
- 48x48 (extension management page)
- 128x128 (Chrome Web Store, installation)

## Generating Icons

### Option 1: Using icon.svg

The `icon.svg` file contains a vector version of the logo. You can convert it to PNG using:

**Online Tools:**
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [Convertio](https://convertio.co/svg-png/)

**Command Line (requires ImageMagick or Inkscape):**

```bash
# Using Inkscape
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16
inkscape icon.svg --export-filename=icon32.png --export-width=32 --export-height=32
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128

# Using ImageMagick
convert -background none icon.svg -resize 16x16 icon16.png
convert -background none icon.svg -resize 32x32 icon32.png
convert -background none icon.svg -resize 48x48 icon48.png
convert -background none icon.svg -resize 128x128 icon128.png
```

### Option 2: Create Custom Icons

Design custom icons in your preferred tool (Figma, Sketch, Photoshop) and export as PNG in the required sizes.

## Placeholder Icons

For development purposes, you can create simple placeholder icons:

```bash
# Create placeholder directory if it doesn't exist
mkdir -p placeholder

# Create simple colored squares as placeholders (requires ImageMagick)
convert -size 16x16 xc:"#667eea" icon16.png
convert -size 32x32 xc:"#667eea" icon32.png
convert -size 48x48 xc:"#667eea" icon48.png
convert -size 128x128 xc:"#667eea" icon128.png
```

## Current Status

**TODO**: Generate actual PNG icons from the SVG file or create custom icon designs.

For now, the extension will use placeholder icons or default Chrome icons until proper PNG files are created.

## Design Guidelines

- **Colors**: Use the NeoApply brand gradient (#667eea to #764ba2)
- **Shape**: Rounded rectangle with 24px corner radius (for 128x128)
- **Logo**: Bold white "N" letter
- **Style**: Modern, clean, professional
- **Accessibility**: Ensure good contrast between logo and background

## Brand Colors

- Primary Gradient Start: `#667eea`
- Primary Gradient End: `#764ba2`
- Text/Logo: `#ffffff` (white)
- Accent: `#10b981` (green for success states)

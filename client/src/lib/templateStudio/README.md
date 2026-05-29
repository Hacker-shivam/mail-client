# Acolyte Template Studio

This folder is the internal editor library for the visual email builder.

## What It Owns

- Document schema and theme defaults
- Block id creation and safe block cloning
- Document operations: insert, duplicate, move, remove, theme update, prop update
- Component registry helpers for flexible custom blocks
- Variable interpolation for previews
- Local validation and document stats

## Why This Exists

The UI can stay focused on panels, canvas, selection, and user experience. The editor engine stays reusable and testable, so the product can grow toward Canva-style features without turning `TemplateForm.jsx` into the whole platform.

## Growth Path

- Add a layout engine for freeform positioning and constraints
- Add layer tree operations for groups, sections, and nested columns
- Add brand kit tokens for colors, fonts, logos, and approved assets
- Add asset manager adapters for uploads and stock media
- Add exporters for HTML, AMP, React Email, and hosted form pages
- Add collaboration metadata for presence, comments, and version branches

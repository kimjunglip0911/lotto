---
name: tailwind-component-architect
description: Analyzes UI requirements and generates responsive, accessible React/Next.js components using Tailwind CSS. Use when the user needs to build new UI components, refactor existing CSS into Tailwind utility classes, or ensure design consistency across frontend files.
allowed-tools: Read, Write, Grep, Glob
---

# Tailwind Component Architect

This Skill empowers Claude to act as a senior frontend engineer specialized in Tailwind CSS and React. It focuses on creating clean, performant, and accessible UI components.

## Instructions

1.  **Analyze Context**: Before generating code, use `Grep` or `Read` to check existing project patterns (e.g., `tailwind.config.js`, global styles, or existing component structures).
2.  **Design Tokens**: Strictly adhere to the project's defined Tailwind theme colors, spacing, and typography.
3.  **Component Structure**:
    * Use functional React components with TypeScript.
    * Implement "Mobile-First" responsive design using Tailwind prefixes (`sm:`, `md:`, `lg:`, etc.).
    * Ensure accessibility (ARIA labels, semantic HTML tags like `<main>`, `<nav>`, `<section>`).
4.  **Refactoring**: When asked to refactor, identify repetitive utility patterns and suggest extracts into reusable sub-components or `cva` (class-variance-authority) patterns if the project supports it.

## Best Practices

* **Logic Separation**: Keep UI logic (hooks) separate from pure presentational markup where possible.
* **Tree Shaking**: Avoid dynamic class names that Tailwind's JIT engine cannot find (e.g., use full class names instead of template literals with variable colors like text-dollar-sign-brace-color-brace-500).
* **Accessibility**: Always include `alt` text for images and ensure interactive elements are keyboard-navigable.

## Component Creation Guidelines

### Creating a Responsive Card Component

When building a product card component for an e-commerce site:

1. **Define TypeScript Interface**: Create an interface with required props such as title (string), price (string), and imageUrl (string).

2. **Structure the Component**:
   - Export a functional component using React.FC with the defined props interface
   - Use a wrapping div with Tailwind classes for the card container
   - Apply these utility patterns: group class for hover effects, relative positioning, overflow-hidden for image containment, rounded corners, border styling, background color, padding, and transition effects

3. **Image Container**:
   - Create a div with aspect-square for 1:1 ratio
   - Set full width, overflow-hidden, rounded corners, and background color
   - Add an img tag with proper src and alt attributes
   - Apply object-cover for proper image scaling
   - Use group-hover:scale-105 with transition-transform for zoom effect on hover

4. **Content Section**:
   - Add a div with top margin for spacing
   - Use flexbox with justify-between for title and price alignment
   - Style title with appropriate text size, font weight, and color
   - Style price with bold font and primary text color

5. **Action Button**:
   - Add a button element with full width
   - Apply rounded corners, background color (primary), vertical padding, text styling
   - Implement hover state color change
   - Add focus states with outline-none, ring styles, and ring-offset for accessibility
   - Use semantic button text like "Add to Cart"

## Troubleshooting

* If colors aren't appearing, check `tailwind.config.js` for custom color definitions.
* If components look broken on mobile, ensure the `viewport` meta tag is present in the root layout.

## Security Considerations

This skill reads existing project files to understand patterns and writes new component files. It does not execute code or modify build configurations. All generated components follow standard React and Tailwind CSS security practices, including proper attribute escaping and XSS prevention through React's default behavior.

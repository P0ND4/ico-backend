/**
 * Shared markdown formatting rules for AI-generated content.
 * The mobile app renders ```mermaid blocks as SVG diagrams via WebView.
 */
export const AI_MARKDOWN_FORMATTING = `Visual formatting rules (MANDATORY — apply whenever applicable):
- 2+ concepts being compared → markdown table (columns vary by topic)
- Process with 3+ steps → numbered list with sub-bullets for each step
- Hierarchy, flow, or relationship → fenced \`\`\`mermaid block (flowchart TD/LR or graph), NEVER ASCII art
- Physical objects, photos, maps, or anything 3D (e.g. a Rubik's cube) → markdown image ![description](https://stable-https-url) from Wikimedia or another permanent CDN — do NOT use mermaid for these
- Data, statistics, or numeric comparisons → markdown table with clear column headers
- Key insight or warning → > blockquote
- Real-world visual reference (map, photo, diagram not expressible in mermaid) → markdown image: ![brief description](https://full-stable-url)
Other formatting: **bold** for key terms, \`code\` for symbols/identifiers/formulas
- Use $...$ or $$...$$ for math when needed
- Images: the mobile app renders markdown images inline. Use ONLY real, stable HTTPS URLs. Prefer direct Wikimedia Commons paths (https://upload.wikimedia.org/wikipedia/commons/…) or Special:FilePath links. NEVER invent or guess URLs. NEVER use Imgur. Prefer \`\`\`mermaid for flows; external images only for real photos/diagrams.
- Respond in the same language as the user's input`;

export const AI_MARKDOWN_FORMATTING_BRIEF = `When explaining visually, use markdown tables, numbered lists, blockquotes, and \`\`\`mermaid flowcharts (never ASCII art). Use $...$ for inline math. For photos, maps, or 3D objects use markdown images (![alt](https://url)) with real direct Wikimedia Commons URLs (never invented links, no Imgur). Example Rubik's cube: https://upload.wikimedia.org/wikipedia/commons/6/61/Rubiks_cube_solved.jpg — not mermaid.`;

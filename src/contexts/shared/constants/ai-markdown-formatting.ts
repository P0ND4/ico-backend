/**
 * Shared markdown formatting rules for AI-generated content.
 * The mobile app renders ```mermaid blocks as SVG diagrams via WebView.
 */
export const AI_MARKDOWN_FORMATTING = `Visual formatting rules (MANDATORY — apply whenever applicable):
- 2+ concepts being compared → markdown table (columns vary by topic)
- Process with 3+ steps → numbered list with sub-bullets for each step
- Hierarchy, flow, or relationship → fenced \`\`\`mermaid block (flowchart TD/LR or graph), NEVER ASCII art
- Data, statistics, or numeric comparisons → markdown table with clear column headers
- Key insight or warning → > blockquote
Other formatting: **bold** for key terms, \`code\` for symbols/identifiers/formulas
- Use $...$ or $$...$$ for math when needed
- Respond in the same language as the user's input`;

export const AI_MARKDOWN_FORMATTING_BRIEF = `When explaining visually, use markdown tables, numbered lists, blockquotes, and \`\`\`mermaid diagrams (never ASCII art). Use $...$ for inline math.`;

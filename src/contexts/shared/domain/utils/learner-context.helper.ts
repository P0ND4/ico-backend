export interface LearnerProfileFields {
  learningStyle?: string | null;
  coursePreferences?: string | null;
  learningNotes?: string | null;
}

export function buildLearnerContextPrompt(user: LearnerProfileFields): string | null {
  const lines: string[] = [];

  const style = user.learningStyle?.trim();
  const preferences = user.coursePreferences?.trim();
  const notes = user.learningNotes?.trim();

  if (style) lines.push(`- How they learn: ${style}`);
  if (preferences) lines.push(`- Course preferences: ${preferences}`);
  if (notes) lines.push(`- Additional notes: ${notes}`);

  if (lines.length === 0) return null;

  return `Learner profile:\n${lines.join('\n')}`;
}

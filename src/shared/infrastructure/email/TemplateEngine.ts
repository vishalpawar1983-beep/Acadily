/**
 * TemplateEngine — variable substitution for email templates.
 *
 * Supports two placeholder syntaxes:
 *   ${variableName}   and   {{variableName}}
 *
 * Nested paths are supported (e.g. ${student.firstName}).
 * Missing variables are replaced with an empty string.
 * Values are HTML-escaped to prevent XSS in HTML templates.
 */
export class TemplateEngine {
  /**
   * Compile a template string by replacing placeholders with values.
   */
  static compile(template: string, variables: Record<string, unknown>): string {
    // Replace ${...} placeholders
    let result = template.replace(/\$\{([^}]+)\}/g, (_match, path: string) => {
      const value = TemplateEngine.resolve(path.trim(), variables);
      return TemplateEngine.escapeHtml(TemplateEngine.stringify(value));
    });

    // Replace {{...}} placeholders
    result = result.replace(/\{\{([^}]+)\}\}/g, (_match, path: string) => {
      const value = TemplateEngine.resolve(path.trim(), variables);
      return TemplateEngine.escapeHtml(TemplateEngine.stringify(value));
    });

    return result;
  }

  /**
   * Resolve a dot-separated path against a variables object.
   * Returns undefined when any segment is missing.
   */
  private static resolve(path: string, variables: Record<string, unknown>): unknown {
    const segments = path.split('.');
    let current: unknown = variables;

    for (const segment of segments) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }

  /**
   * Convert a value to its string representation.
   * undefined / null become empty string.
   */
  private static stringify(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();
    return JSON.stringify(value);
  }

  /**
   * Escape HTML special characters to prevent XSS.
   */
  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

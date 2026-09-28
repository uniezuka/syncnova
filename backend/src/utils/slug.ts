// Lowercase, strip anything that isn't a letter/number/space/hyphen, then turn
// spaces into hyphens and collapse repeats. Used to turn names into safe folder names.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

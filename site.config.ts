// ============================================================
// Identity text lives here. This is only a FALLBACK for when the database is empty or unreachable;
// the real values are edited in Admin → Profile.
// Sections (Focus, Experience, Toolbox, Achievements, ...) are managed in Admin → Sections.
// Projects are NOT filled in here: manage them in Admin → Projects.
// ============================================================

export const site = {
  name: 'Your Name', // TODO
  role: 'Industrial Engineering Student',
  affiliation: 'Universitas Brawijaya',
  email: 'you@example.com', // TODO
  // Photo on the lanyard card: put the file at public/photo.jpg (portrait, roughly 4:5).
  // If the file is missing, the card shows initials instead.
  photo: '/photo.jpg',
  links: [
    { label: 'GitHub', href: 'https://github.com/username' }, // TODO
    { label: 'LinkedIn', href: 'https://linkedin.com/in/username' }, // TODO
  ],

  headline: {
    lead: 'Data, systems, and',
    accent: 'better decisions.',
  },
  intro:
    'I turn complex problems into something structured, analyzable, and ready for decision-making, through information systems, data analysis, and optimization.',
}

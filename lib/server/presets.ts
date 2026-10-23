// Section vocabulary: layouts, field types, slots, and ready-made templates (ported from Django presets.py).

export const LAYOUTS: Record<string, string> = {
  cards: 'Cards',
  timeline: 'Timeline',
  list: 'List',
  chips: 'Chips / tags',
  journey: 'Journey map',
  text: 'Long text',
}

export const FIELD_TYPES: Record<string, string> = {
  text: 'Short text',
  textarea: 'Long text',
  url: 'Link',
  tags: 'Tags (comma-separated)',
  lines: 'Points (one per line)',
  image: 'Image',
}

export const SLOTS: Record<string, string> = {
  title: 'Title',
  meta: 'Small label (period, year)',
  subtitle: 'Subtitle (organization, issuer)',
  body: 'Description',
  list: 'Bullet list',
  tags: 'Tags',
  link: 'Link button',
  image: 'Image',
}

const f = (name: string, label: string, type: string, slot: string, required = false) => ({
  name,
  label,
  type,
  slot,
  required,
})

export const PRESETS = [
  {
    key: 'experience',
    label: 'Experience',
    description: 'Work and organization history, shown as a timeline.',
    title: 'Experience',
    layout: 'timeline',
    options: { detail: true },
    page: 'home',
    schema: [
      f('period', 'Period', 'text', 'meta'),
      f('title', 'Position', 'text', 'title', true),
      f('org', 'Organization', 'text', 'subtitle'),
      f('points', 'Responsibilities', 'lines', 'list'),
    ],
    items: [
      {
        period: '20XX — Present',
        title: 'Laboratory Assistant',
        org: 'Laboratory / organization name',
        points: ['Write your responsibilities or achievements here.'],
      },
    ],
  },
  {
    key: 'education',
    label: 'Education',
    description: 'Schools and programs as pins on an animated map, with next / previous buttons.',
    title: 'Education',
    layout: 'journey',
    options: { detail: false },
    page: 'home',
    schema: [
      f('period', 'Period', 'text', 'meta'),
      f('school', 'School / institution', 'text', 'title', true),
      f('program', 'Program / major', 'text', 'subtitle'),
      f('description', 'Description', 'textarea', 'body'),
      f('highlights', 'Highlights', 'lines', 'list'),
    ],
    items: [
      {
        period: '20XX — 20XX',
        school: 'Your university',
        program: 'Industrial Engineering',
        description: 'A short note about what you studied or built here.',
        highlights: ['GPA, thesis topic, or a notable course.'],
      },
    ],
  },
  {
    key: 'focus',
    label: 'Focus',
    description: 'Cards for the areas you work in.',
    title: 'Focus',
    layout: 'cards',
    options: { columns: 3, detail: true },
    page: 'home',
    schema: [f('title', 'Title', 'text', 'title', true), f('desc', 'Description', 'textarea', 'body')],
    items: [
      { title: 'Information Systems', desc: 'System analysis and design, plus web application development.' },
      { title: 'Data & Business Intelligence', desc: 'Using data to support business decisions.' },
      { title: 'Optimization & Decisions', desc: 'Multi-criteria decision methods and optimization approaches.' },
    ],
  },
  {
    key: 'toolbox',
    label: 'Toolbox',
    description: 'Skills and tools, grouped as chips.',
    title: 'Toolbox',
    layout: 'chips',
    options: { columns: 4, detail: false },
    page: 'home',
    schema: [f('group', 'Group name', 'text', 'title', true), f('items', 'Tools', 'tags', 'tags')],
    items: [
      { group: 'Data & Backend', items: ['Python', 'Django', 'PostgreSQL'] },
      { group: 'Frontend & Visual', items: ['Next.js', 'React', 'Figma'] },
    ],
  },
  {
    key: 'achievements',
    label: 'Achievements',
    description: 'Awards, competition wins, certificates.',
    title: 'Achievements',
    layout: 'list',
    options: { detail: true },
    page: 'home',
    schema: [
      f('title', 'Title', 'text', 'title', true),
      f('issuer', 'Issuer', 'text', 'subtitle'),
      f('year', 'Year', 'text', 'meta'),
      f('description', 'Short description', 'textarea', 'body'),
      f('url', 'Proof / certificate link', 'url', 'link'),
    ],
    items: [],
  },
  {
    key: 'story',
    label: 'Story (About page)',
    description: 'Long text, shown on the /about page.',
    title: 'About me',
    layout: 'text',
    options: { detail: false },
    page: 'about',
    schema: [f('heading', 'Section heading', 'text', 'title'), f('body', 'Story (Markdown allowed)', 'textarea', 'body')],
    items: [{ heading: 'Who I am', body: 'Tell your story here.' }],
  },
  {
    key: 'blank',
    label: 'Blank (build your own)',
    description: 'Start with a title + description, then add fields and pick any layout.',
    title: 'New section',
    layout: 'cards',
    options: { columns: 3, detail: true },
    page: 'home',
    schema: [f('title', 'Title', 'text', 'title', true), f('desc', 'Description', 'textarea', 'body')],
    items: [],
  },
]

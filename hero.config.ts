// ============================================================
// Home hero greeting: "Hello, I'm <name>".
// The first entry uses `greeting` below + the name from Admin → Profile → Name.
// To make the greeting and name cycle through other languages/scripts, add entries to `names`:
// `greeting` is shown in the muted greeting style and `text` is the highlighted name.
// Each name is typed out letter by letter, held for `hold` ms, then erased with a backspace effect.
// With no extra entries nothing animates and the hero stays static.
//
// NOTE: the transliterations below are guesses for "Athallah Farrel". Check the spelling
// (ask a native speaker if needed) before enabling more of them.
// ============================================================

export const hero = {
  greeting: "Hello, I'm",
  hold: 2600, // milliseconds each fully typed name stays on screen
  names: [
    // { greeting: 'こんにちは、私は', text: 'アタラー・ファレル' },
    // { greeting: 'नमस्ते, मैं हूँ', text: 'अथल्लाह फ़ारेल' },
    { greeting: 'ꦲꦭꦺꦴ꧈​ ꦏꦸꦭꦺꦴ', text: 'ꦄꦠ꧀ꦲꦭ꧀ꦭꦃ' },
    // { greeting: '안녕하세요, 저는', text: '아탈라 파렐' },
    // { greeting: 'สวัสดี ฉันคือ', text: 'อาทัลลาห์ ฟาร์เรล' },
    // { greeting: '你好，我是', text: '阿塔拉·法雷尔' },
    // { greeting: 'Привет, я', text: 'Аталлах Фаррел' },
  ] as { greeting: string; text: string }[],

  // ---- Home page content (all optional) ----
  // The short line under the name.
  tagline: 'Information systems, decision support and mobile apps for real-world problems.',
  // About text and photo: Admin → Profile. Tagline, achievement cards and Expertise below are only the DEFAULTS:
  // edit them on the site in Admin → Profile → Home content (that overrides what is written here).
  // Your GitHub username. Leave empty to read it from the GitHub link in Admin → Profile → Links.
  githubUser: '',
  // The big numbers next to the About text. `since` ("YYYY-MM") turns into whole years up to today;
  // `projects: true` counts your published projects; `value` is a fixed number. `suffix` is appended ("+").
  stats: [
    { label: 'Years as lab assistant', since: '2024-11', suffix: '+' },
    { label: 'Projects built', projects: true },
    { label: 'Topics taught (Figma, Flutter)', value: 2 },
  ] as { label: string; since?: string; projects?: boolean; value?: number; suffix?: string }[],
  // The four columns under About. `icon` is one of: workflow, code, target, palette.
  expertise: [
    { icon: 'workflow', title: 'System analysis & design', text: 'Modelling real processes with DFD, ERD, UML and BPMN, from requirements to a clear system blueprint.' },
    { icon: 'code', title: 'Web & mobile development', text: 'Building working systems with Django and Flutter, from database to a screen people can use.' },
    { icon: 'target', title: 'Decision support & simulation', text: 'Turning criteria into ranked decisions with AHP, and testing process changes with simulation in Arena.' },
    { icon: 'palette', title: 'UI/UX & visual design', text: 'Designing interfaces in Figma and producing clear, on-brand visuals for real organizations.' },
  ] as { icon: 'workflow' | 'code' | 'target' | 'palette'; title: string; text: string }[],
}

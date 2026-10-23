// ============================================================
// Home hero greeting: "Hello, I'm <name>".
// The first entry uses `greeting` below + the name from Admin → Profile → Name.
// To make the greeting and name cycle through other languages/scripts, add entries to `names`:
// `greeting` is shown in the muted greeting style and `text` is the highlighted name.
// The change is a soft crossfade. With no extra entries nothing animates and the hero stays static.
//
// NOTE: the transliterations below are guesses for "Athallah Farrel". Check the spelling
// (ask a native speaker if needed) before enabling more of them.
// ============================================================

export const hero = {
  greeting: "Hello, I'm",
  hold: 3200, // milliseconds each name stays on screen
  names: [
    // { greeting: 'こんにちは、私は', text: 'アタラー・ファレル' },
    // { greeting: 'नमस्ते, मैं हूँ', text: 'अथल्लाह फ़ारेल' },
    { greeting: 'ꦲꦭꦺꦴ꧈​ ꦏꦸꦭꦺꦴ', text: 'ꦄꦠ꧀ꦲꦭ꧀ꦭꦃ' },
    // { greeting: '안녕하세요, 저는', text: '아탈라 파렐' },
    // { greeting: 'สวัสดี ฉันคือ', text: 'อาทัลลาห์ ฟาร์เรล' },
    // { greeting: '你好，我是', text: '阿塔拉·法雷尔' },
    // { greeting: 'Привет, я', text: 'Аталлах Фаррел' },
  ] as { greeting: string; text: string }[],
}

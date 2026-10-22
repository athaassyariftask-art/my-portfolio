// ============================================================
// Sapaan di beranda: "Halo, saya <nama>", sapaan dan nama sama-sama berganti bahasa/aksara.
// Entri pertama (Latin) memakai `greeting` di bawah + nama dari Admin → Profil → Nama.
// Entri berikutnya diambil dari `names`: `greeting` (hitam) dan `text` (biru).
//
// PENTING: tulisan di `names` adalah transliterasi/terjemahan yang kutebak untuk "Athallah Farrel".
// Cek ejaannya (minta teman penutur bahasa itu kalau perlu) dan ganti sesukamu.
// Kalau kamu mengubah nama di Admin, daftar ini juga perlu disesuaikan.
// Tambah / hapus / urutkan baris sebebasnya.
// ============================================================

export const hero = {
  greeting: 'Halo, saya',
  hold: 2800,
  names: [
    { greeting: 'Hello, my name\'s ', text: 'Athallah Farrel' },
    // { greeting: 'こんにちは、私は', text: 'アタラー・ファレル' },
    // { greeting: 'नमस्ते, मैं हूँ', text: 'अथल्लाह फ़ारेल' },
    { greeting: 'ꦲꦭꦺꦴ꧈​ ꦏꦸꦭꦺꦴ', text: 'ꦄꦠ꧀ꦲꦭ꧀ꦭꦃ' },
    // { greeting: '안녕하세요, 저는', text: '아탈라 파렐' },
    // { greeting: 'สวัสดี ฉันคือ', text: 'อาทัลลาห์ ฟาร์เรล' },
    // { greeting: '你好，我是', text: '阿塔拉·法雷尔' },
    // { greeting: 'Привет, я', text: 'Аталлах Фаррел' },
  ] as { greeting: string; text: string }[],
}

// ============================================================
// Teks identitas ada di sini. Ini hanya CADANGAN kalau database kosong/backend mati;
// isi aslinya diedit lewat Admin → Profil.
// Section (Fokus, Pengalaman, Toolbox, Achievement, ...) ada di frontend/modules/.
// Project TIDAK diisi di sini: kelola lewat Admin → Project.
// ============================================================

export const site = {
  name: 'Nama Kamu', // TODO
  role: 'Mahasiswa Teknik Industri',
  affiliation: 'Universitas Brawijaya',
  email: 'email@kamu.com', // TODO
  // Foto di kartu lanyard: taruh file di frontend/public/photo.jpg (potret, rasio ±4:5).
  // Kalau file tidak ada, kartu menampilkan inisial.
  photo: '/photo.jpg',
  links: [
    { label: 'GitHub', href: 'https://github.com/username' }, // TODO
    { label: 'LinkedIn', href: 'https://linkedin.com/in/username' }, // TODO
  ],

  headline: {
    lead: 'Data, sistem, dan',
    accent: 'keputusan yang lebih baik.',
  },
  intro:
    'Saya mengubah masalah yang kompleks menjadi sesuatu yang terstruktur, bisa dianalisis, dan siap dipakai untuk mengambil keputusan, lewat sistem informasi, analisis data, dan optimasi.',
}

import PageHeader from '@/components/admin/PageHeader'
import CvUpload from '@/components/admin/CvUpload'
import PhotoUpload from '@/components/admin/PhotoUpload'
import { card } from '@/components/admin/ui'
import ProfileForm from '@/components/admin/ProfileForm'
import { getProfile } from '@/lib/profile'

export default async function AdminProfile() {
  // Form diisi nilai yang sedang tampil di website (database, atau bawaan site.config.ts)
  const profile = await getProfile()

  return (
    <>
      <PageHeader title="Profil" hint="Identitas di halaman depan. Kolom yang dikosongkan memakai nilai bawaan dari site.config.ts." />
      <div className={`${card} mb-6 space-y-8 p-6`}>
        <PhotoUpload photo={profile.photo} />
        <CvUpload cv={profile.cv} />
      </div>
      <div className={`${card} p-6`}>
        <ProfileForm initial={profile} />
      </div>
    </>
  )
}

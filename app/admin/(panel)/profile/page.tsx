import PageHeader from '@/components/admin/PageHeader'
import CvUpload from '@/components/admin/CvUpload'
import PhotoUpload from '@/components/admin/PhotoUpload'
import { card } from '@/components/admin/ui'
import ProfileForm from '@/components/admin/ProfileForm'
import { getProfile } from '@/lib/profile'

export default async function AdminProfile() {
  // The form is filled with the values currently shown on the website (database, or defaults from site.config.ts)
  const profile = await getProfile()

  return (
    <>
      <PageHeader title="Profile" hint="Your identity on the home page. Fields left empty use the defaults from site.config.ts." />
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

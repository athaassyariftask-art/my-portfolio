import PageHeader from '@/components/admin/PageHeader'
import CvUpload from '@/components/admin/CvUpload'
import PhotoUpload from '@/components/admin/PhotoUpload'
import { card } from '@/components/admin/ui'
import ProfileForm from '@/components/admin/ProfileForm'
import HomeContentForm from '@/components/admin/HomeContentForm'
import { getProfile } from '@/lib/profile'
import { hero } from '@/hero.config'
import { expertiseFromConfig, resolveHome, statsFromConfig } from '@/lib/home'

export default async function AdminProfile() {
  // The form is filled with the values currently shown on the website (database, or defaults from site.config.ts)
  const profile = await getProfile()
  const home = resolveHome(profile.home, { tagline: hero.tagline, stats: statsFromConfig(hero.stats), expertise: expertiseFromConfig(hero.expertise) })

  return (
    <>
      <PageHeader title="Profile" hint="Your identity on the home page. Fields left empty use the defaults from site.config.ts." />
      <div className={`${card} mb-6 space-y-8 p-6`}>
        <PhotoUpload photo={profile.photo} />
        <PhotoUpload
          photo={profile.aboutPhoto}
          field="about_photo"
          title="About photo (next to your About text)"
          hint="A different photo from the lanyard one, e.g. teaching or working. Landscape (about 3:2) fits best."
        />
        <CvUpload cv={profile.cv} />
      </div>
      <div className={`${card} p-6`}>
        <ProfileForm initial={profile} />
      </div>
      <div className={`${card} mt-6 p-6`}>
        <h2 className="mb-1 text-lg font-semibold">Home content</h2>
        <p className="mb-6 text-sm text-slate-500">The line under your name, the achievement cards and the Expertise columns on the home page.</p>
        <HomeContentForm tagline={home.tagline} stats={home.stats} expertise={home.expertise} />
      </div>
    </>
  )
}

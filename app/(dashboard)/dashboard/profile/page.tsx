import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import ProfileEditForm from './ProfileEditForm'
import { getTranslation } from '@/lib/i18n'
import { cookies } from 'next/headers'
import ResponsiveHeader from '@/components/ResponsiveHeader'

export default async function ProfileEditPage() {
    const session = await getAuthSession()

    if (!session || !session.user) {
        redirect('/login')
    }

    // Get locale from cookies
    const cookieStore = await cookies()
    const locale = (cookieStore.get('locale')?.value as 'en' | 'de') || 'en'
    const t = (key: string) => getTranslation(locale, key)

    // Get full therapist data
    const therapist = await findTherapistById(session.user.id)

    if (!therapist) {
        return <div>{t('dashboard.therapistNotFound')}</div>
    }

    // Helper to convert image data to base64
    const getImageSrc = (profileImage: any) => {
        if (!profileImage || !profileImage.data) return null
        try {
            let base64 = ''
            if (Buffer.isBuffer(profileImage.data)) {
                base64 = profileImage.data.toString('base64')
            } else if (profileImage.data.buffer) {
                // Handle MongoDB Binary
                base64 = Buffer.from(profileImage.data.buffer).toString('base64')
            } else {
                return null
            }
            return `data:${profileImage.contentType};base64,${base64}`
        } catch (e) {
            console.error('Error converting profile image:', e)
            return null
        }
    }

    const imageSrc = getImageSrc(therapist.profileImage)

    // Destructure to remove non-serializable fields
    const { profileImage, createdAt, updatedAt, ...therapistRest } = therapist
    const safeTherapist = {
        ...therapistRest,
        createdAt: createdAt?.toISOString() as any,
        updatedAt: updatedAt?.toISOString() as any
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <ResponsiveHeader pageTitle={t('dashboard.editProfile')} showBackToDashboard={true} />
            <div className="py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-6 mb-8">
                        {imageSrc ? (
                            <div className="relative w-20 h-20 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageSrc}
                                    alt={therapist.name}
                                    className="w-full h-full rounded-full object-cover shadow-md border-4 border-white"
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-4 border-white shadow-md">
                                <span className="text-2xl font-bold text-indigo-600">
                                    {(therapist.name || '?').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {therapist.name}
                            </h1>
                            <p className="text-gray-500 text-lg">{t('dashboard.editProfile')}</p>
                        </div>
                    </div>

                    <ProfileEditForm therapist={safeTherapist} />
                </div>
            </div>
        </div>
    )
}

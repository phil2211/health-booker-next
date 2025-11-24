import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import ProfileEditForm from './ProfileEditForm'

export default async function ProfileEditPage() {
    const session = await getAuthSession()

    if (!session || !session.user) {
        redirect('/login')
    }

    // Get full therapist data
    const therapist = await findTherapistById(session.user.id)

    if (!therapist) {
        return <div>Therapist not found</div>
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Profile</h1>
                <ProfileEditForm therapist={therapist} />
            </div>
        </div>
    )
}

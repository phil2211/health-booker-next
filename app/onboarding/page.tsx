import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { findTherapistById } from '@/models/Therapist'
import OnboardingWizard from './OnboardingWizard'

export default async function OnboardingPage() {
    const session = await getAuthSession()

    if (!session || !session.user) {
        redirect('/login')
    }

    const therapist = await findTherapistById(session.user.id)

    if (!therapist) {
        return <div>Therapist not found</div>
    }

    if (therapist.onboardingCompleted) {
        redirect('/dashboard')
    }



    return (
        <OnboardingWizard
            therapist={{
                _id: therapist._id,
                name: therapist.name || '',
                firstName: therapist.firstName || (therapist.name ? therapist.name.split(' ')[0] : ''),
                lastName: therapist.lastName || (therapist.name ? therapist.name.split(' ').slice(1).join(' ') : ''),
                email: therapist.email,
                specialization: therapist.specialization || [],
                bio: therapist.bio || '',
                address: therapist.address || '',
                zip: therapist.zip || '',
                city: therapist.city || '',
                phoneNumber: therapist.phoneNumber || '',
                weeklyAvailability: therapist.weeklyAvailability || [],
                profileImage: therapist.profileImage && therapist.profileImage.data ? {
                    data: therapist.profileImage.data.toString('base64'),
                    contentType: therapist.profileImage.contentType
                } : undefined
            }}
        />
    )
}

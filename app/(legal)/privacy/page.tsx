import { getServerLocale } from '@/lib/i18n/server'
import { getTranslations } from '@/lib/i18n/server'

export default async function PrivacyPage() {
    const locale = await getServerLocale()
    const t = await getTranslations(locale)

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

            <div className="prose prose-indigo max-w-none text-gray-600">
                <p className="mb-4">
                    Last updated: {new Date().toLocaleDateString()}
                </p>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
                    <p>
                        We take the protection of your personal data very seriously. This Privacy Policy explains how we collect,
                        use, disclose, and safeguard your information when you use our booking service. We comply with the
                        Swiss Federal Act on Data Protection (FADP) and, where applicable, the General Data Protection Regulation (GDPR).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data Controller</h2>
                    <p>
                        The responsible party for data processing on this website is:
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg mt-2">
                        <p className="font-medium">[INSERT COMPANY/THERAPIST NAME]</p>
                        <p>[INSERT ADDRESS]</p>
                        <p>[INSERT CITY, ZIP]</p>
                        <p>Switzerland</p>
                        <p>Email: [INSERT EMAIL]</p>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Data Collection and Processing</h2>
                    <p className="mb-2">We collect and process the following data for the purpose of appointment booking and management:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Personal Information:</strong> Name, Email address, Phone number.</li>
                        <li><strong>Appointment Data:</strong> Date, time, and type of therapy.</li>
                        <li><strong>Health Data:</strong> Information you voluntarily provide in the "Notes" or "Reason for visit" fields.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Purpose of Processing</h2>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>To facilitate and manage your appointments.</li>
                        <li>To communicate with you regarding your bookings (confirmations, reminders, cancellations).</li>
                        <li>To comply with legal obligations.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Third-Party Service Providers</h2>
                    <p className="mb-2">We use trusted third-party service providers to operate our service:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>MongoDB:</strong> Database hosting (Data storage).</li>
                        <li><strong>Resend:</strong> Transactional email service (Sending confirmations and reminders).</li>
                        <li><strong>Google Generative AI:</strong> (Therapist side only) Used for generating profile descriptions.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
                    <p>
                        We implement appropriate technical and organizational measures to protect your personal data against
                        unauthorized access, alteration, disclosure, or destruction.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
                    <p className="mb-2">You have the right to:</p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Access your personal data.</li>
                        <li>Correct inaccurate data.</li>
                        <li>Request deletion of your data.</li>
                        <li>Withdraw consent at any time.</li>
                    </ul>
                </section>
            </div>
        </div>
    )
}

import { getServerLocale } from '@/lib/i18n/server'
import { getTranslations } from '@/lib/i18n/server'

export default async function ImprintPage() {
    const locale = await getServerLocale()
    const t = await getTranslations(locale)

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Imprint (Impressum)</h1>

            <div className="prose prose-indigo max-w-none text-gray-600">
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Address</h2>
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <p className="font-bold text-lg mb-2">[INSERT COMPANY NAME]</p>
                        <p>[INSERT STREET ADDRESS]</p>
                        <p>[INSERT ZIP CITY]</p>
                        <p>Switzerland</p>

                        <div className="mt-4">
                            <p><strong>Email:</strong> [INSERT EMAIL]</p>
                            <p><strong>Phone:</strong> [INSERT PHONE]</p>
                        </div>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Commercial Register Entry</h2>
                    <p>
                        Registered company name: [INSERT REGISTERED NAME]<br />
                        Number: [INSERT UID]<br />
                        Commercial Register Office: [INSERT CANTON]
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">VAT Number</h2>
                    <p>
                        [INSERT VAT NUMBER]
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Disclaimer</h2>
                    <p>
                        The author assumes no liability for the correctness, accuracy, timeliness, reliability, and completeness of the information.
                        Liability claims regarding damage caused by the use of any information provided, including any kind of information which is incomplete or incorrect, will therefore be rejected.
                    </p>
                </section>
            </div>
        </div>
    )
}

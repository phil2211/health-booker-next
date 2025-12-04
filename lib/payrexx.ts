import crypto from 'crypto'

/**
 * Verify Payrexx Webhook Signature
 * 
 * @param signatureHeader - The 'Payrex-Signature' header from the request
 * @param rawBody - The raw body of the request
 * @param apiSecret - Your Payrexx API Secret
 * @returns boolean - True if signature is valid
 */
export function verifyPayrexxSignature(
    signatureHeader: string,
    rawBody: string,
    apiSecret: string
): boolean {
    if (!signatureHeader || !rawBody || !apiSecret) {
        return false
    }

    try {
        // Parse the signature header
        // Format: t=TIMESTAMP,te=TEST_SIG,li=LIVE_SIG
        const parts = signatureHeader.split(',')
        const timestampPart = parts.find(p => p.trim().startsWith('t='))
        const liveSigPart = parts.find(p => p.trim().startsWith('li='))
        // We prioritize live signature, but could check test if in dev mode
        // For safety, let's check based on environment or just check if *either* matches if we are in mixed mode
        // But strictly, we should check the one matching the event mode.
        // Let's assume we are verifying the LIVE signature for production safety, 
        // or we can try to match against both if we are in a dev environment.

        // Let's try to match the 'li' (live) signature first, as that's what matters for real payments.
        // If 'li' is missing or empty, maybe it's a test transaction 'te'.

        let signatureToVerify = liveSigPart ? liveSigPart.split('=')[1] : null
        if (!signatureToVerify) {
            const testSigPart = parts.find(p => p.trim().startsWith('te='))
            signatureToVerify = testSigPart ? testSigPart.split('=')[1] : null
        }

        if (!timestampPart || !signatureToVerify) {
            return false
        }

        const timestamp = timestampPart.split('=')[1]

        // Construct the signed payload: timestamp + '.' + rawBody
        const signedPayload = `${timestamp}.${rawBody}`

        // Calculate HMAC-SHA256
        const hmac = crypto.createHmac('sha256', apiSecret)
        const calculatedSignature = hmac.update(signedPayload).digest('hex')

        // Constant time comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(calculatedSignature),
            Buffer.from(signatureToVerify)
        )
    } catch (error) {
        console.error('Error verifying Payrexx signature:', error)
        return false
    }
}

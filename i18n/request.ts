import { getRequestConfig } from 'next-intl/server'
import en from '../messages/en.json'
import de from '../messages/de.json'

const messages = {
  en,
  de,
}

export default getRequestConfig(({ locale }) => {
  // Ensure locale is a valid string
  const validLocale = (locale as keyof typeof messages) || 'en'

  return {
    locale: validLocale,
    messages: messages[validLocale],
  }
})

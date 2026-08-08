import { VerifyView } from './VerifyView'

export const metadata = {
  title: 'Verify Email | CharityAI',
  description: 'Enter your OTP to verify your email address.',
}

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  return <VerifyView />
}

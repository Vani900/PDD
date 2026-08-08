import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  redirect('/auth/login')
}

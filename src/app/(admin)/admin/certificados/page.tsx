import { AdminCertificateBuilder } from '@/components/admin/AdminCertificateBuilder'
import { createClient } from '@/lib/supabase/server'
import { resolveCertificateTemplate } from '@/lib/certificates/templates'

export default async function AdminCertificadosPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('certificate_templates')
    .select('*')
    .eq('is_default', true)
    .maybeSingle()

  return <AdminCertificateBuilder template={resolveCertificateTemplate(data)} />
}

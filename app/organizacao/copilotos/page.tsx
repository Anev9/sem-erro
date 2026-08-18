'use client'

import { Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'

export default function CopilotosPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <PageHeader
          title="Copilotos"
          subtitle="Gerencie os copilotos do sistema"
          backHref="/dashboard-admin"
        />

        <Card className="flex flex-col items-center gap-3 border-dashed py-16 text-center">
          <Users size={40} className="text-ink-faint" />
          <p className="text-ink-muted">Funcionalidade em desenvolvimento</p>
        </Card>
      </div>
    </div>
  )
}

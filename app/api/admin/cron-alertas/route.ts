import { NextRequest, NextResponse } from 'next/server'

// Rota chamada automaticamente toda segunda-feira às 8h (configurado no vercel.json)
// Também pode ser chamada manualmente pelo admin via POST /api/admin/enviar-alertas
export async function GET(request: NextRequest) {
  // Verifica se é chamada legítima do Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Reutiliza a lógica de envio de alertas existente
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/enviar-alertas`, {
      method: 'POST',
      headers: {
        // Passa um header especial para identificar chamada interna do cron
        'x-cron-secret': process.env.CRON_SECRET || '',
      },
    })

    const data = await res.json()
    console.log('[CRON] Alertas enviados:', data)
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    console.error('[CRON] Erro ao enviar alertas:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

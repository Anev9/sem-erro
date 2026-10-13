'use client'

export type ColaboradorOpcao = {
  id: string
  nome: string
  empresa_id: string
  empresas?: { nome_fantasia: string } | null
}

// Um gerente pode atuar em várias lojas, então além dos colaboradores da loja
// selecionada também listamos os das outras lojas do aluno (identificando a loja).
// Permite marcar vários responsáveis; nenhum marcado = checklist da loja inteira.
export function ColaboradorSelect({
  colaboradores, empresaId, value, onChange,
}: {
  colaboradores: ColaboradorOpcao[]
  empresaId: string
  value: string[]
  onChange: (ids: string[]) => void
}) {
  if (!empresaId) {
    return <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-ink-faint">Selecione a empresa primeiro</p>
  }

  const daLoja = colaboradores.filter(c => c.empresa_id === empresaId)
  const deOutras = colaboradores.filter(c => c.empresa_id !== empresaId)

  function alternar(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  function grupo(titulo: string, lista: ColaboradorOpcao[], mostrarLoja: boolean) {
    if (lista.length === 0) return null
    return (
      <div>
        <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{titulo}</p>
        {lista.map(c => (
          <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white">
            <input
              type="checkbox"
              checked={value.includes(c.id)}
              onChange={() => alternar(c.id)}
              className="h-4 w-4 flex-shrink-0 cursor-pointer accent-brand"
            />
            <span className="text-sm text-ink">
              {c.nome}
              {mostrarLoja && c.empresas?.nome_fantasia && (
                <span className="text-ink-faint"> — {c.empresas.nome_fantasia}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex max-h-64 flex-col gap-3 overflow-y-auto rounded-xl bg-surface-2 p-2">
        {grupo('Desta loja', daLoja, false)}
        {grupo('De outras lojas', deOutras, true)}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">
        {value.length === 0
          ? 'Nenhum marcado: todos os colaboradores da loja verão o checklist'
          : `${value.length} ${value.length === 1 ? 'responsável selecionado' : 'responsáveis selecionados'}`}
      </p>
    </div>
  )
}

'use client'

export type ColaboradorOpcao = {
  id: string
  nome: string
  empresa_id: string
  empresas?: { nome_fantasia: string } | null
}

// Um gerente pode atuar em várias lojas, então além dos colaboradores da loja
// selecionada também listamos os das outras lojas do aluno (identificando a loja).
export function ColaboradorSelect({
  colaboradores, empresaId, value, onChange, className,
}: {
  colaboradores: ColaboradorOpcao[]
  empresaId: string
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  const daLoja = colaboradores.filter(c => c.empresa_id === empresaId)
  const deOutras = colaboradores.filter(c => c.empresa_id !== empresaId)

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={!empresaId} className={className}>
      <option value="">Selecione o colaborador...</option>
      {daLoja.length > 0 && (
        <optgroup label="Desta loja">
          {daLoja.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </optgroup>
      )}
      {deOutras.length > 0 && (
        <optgroup label="De outras lojas">
          {deOutras.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome}{c.empresas?.nome_fantasia ? ` — ${c.empresas.nome_fantasia}` : ''}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  )
}

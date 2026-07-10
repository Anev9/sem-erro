// Script para listar e deletar arquivos do bucket checklist-fotos
// Execute com: node limpar-storage.mjs

const SUPABASE_URL = 'https://cyqiagacrmrsazhvrbgb.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cWlhZ2Fjcm1yc2F6aHZyYmdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk5Mzg5MiwiZXhwIjoyMDg0NTY5ODkyfQ.ahcMQIOWUjWdpIBnP96crWBuAwZaX9PQcKyfn4VR22A'
const BUCKET = 'checklist-fotos'

const headers = {
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  apikey: SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
}

async function listarArquivos(prefix = '', offset = 0, limite = 100) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prefix, limit: limite, offset, sortBy: { column: 'created_at', order: 'asc' } }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro ao listar: ${res.status} - ${err}`)
  }
  return await res.json()
}

async function deletarArquivos(caminhos) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ prefixes: caminhos }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Erro ao deletar: ${res.status} - ${err}`)
  }
  return await res.json()
}

async function main() {
  console.log('Conectando ao Supabase Storage...\n')

  // Listar todos os arquivos
  let todos = []
  let offset = 0
  const limite = 100

  while (true) {
    const arquivos = await listarArquivos('', offset, limite)
    if (!Array.isArray(arquivos) || arquivos.length === 0) break
    todos = todos.concat(arquivos)
    console.log(`Encontrados ${todos.length} arquivos até agora...`)
    if (arquivos.length < limite) break
    offset += limite
  }

  const somenteFotos = todos.filter(f => f.name && !f.name.endsWith('/'))
  const totalMB = somenteFotos.reduce((acc, f) => acc + (f.metadata?.size || 0), 0) / 1024 / 1024

  console.log(`\nTotal de arquivos: ${somenteFotos.length}`)
  console.log(`Tamanho estimado: ${totalMB.toFixed(2)} MB`)

  if (somenteFotos.length === 0) {
    console.log('\nNenhum arquivo encontrado no bucket.')
    return
  }

  // Mostrar os 5 mais antigos
  console.log('\nArquivos mais antigos:')
  somenteFotos.slice(0, 5).forEach(f => {
    const tamanho = ((f.metadata?.size || 0) / 1024).toFixed(1)
    console.log(`  ${f.name} (${tamanho} KB) - ${f.created_at || 'data desconhecida'}`)
  })

  console.log('\nPara deletar TODOS os arquivos, execute:')
  console.log('  node limpar-storage.mjs --deletar\n')

  // Se passou --deletar como argumento, deleta tudo
  if (process.argv.includes('--deletar')) {
    console.log(`Deletando ${somenteFotos.length} arquivos em lotes de 100...`)
    const caminhos = somenteFotos.map(f => f.name)

    let deletados = 0
    for (let i = 0; i < caminhos.length; i += 100) {
      const lote = caminhos.slice(i, i + 100)
      await deletarArquivos(lote)
      deletados += lote.length
      console.log(`  Deletados: ${deletados}/${caminhos.length}`)
    }

    console.log('\nConcluido! Verifique o storage no Supabase.')
  }
}

main().catch(err => {
  console.error('ERRO:', err.message)
  process.exit(1)
})

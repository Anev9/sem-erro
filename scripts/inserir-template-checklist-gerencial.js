// Insere o template "Checklist Gerencial Operacional" (origem: planilha Checklist_Gerencial_Operacional.xlsx)
// Uso: node --env-file=.env.local scripts/inserir-template-checklist-gerencial.js

const { createClient } = require('@supabase/supabase-js')
// Variáveis lidas do .env.local via --env-file

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const TEMPLATE = {
  nome: 'Checklist Gerencial Operacional',
  descricao: 'Checklist diário do gerente (2x ao dia) com 25 tarefas em Frente de Loja, Ações Comerciais, Área de Vendas e Processos Internos. Cada tarefa vale até 4 pontos (total 100): 0-30 inaceitável, 31-50 abaixo do mínimo, 51-70 abaixo da média, 71-90 dentro do padrão, 91-100 excelente.',
  categoria: 'Operacional'
}

const CRITERIO_TRES_NIVEIS = 'Nota: 4 - tudo ok · 3 - um item não realizado · 0 - dois itens não realizados'
const CRITERIO_SIM_NAO = 'Nota: 4 - sim · 0 - não'
const CRITERIO_REALIZADO = 'Nota: 4 - realizado · 0 - não realizado'

const SECOES = [
  {
    nome: 'Frente de Loja',
    tarefas: [
      ['Limpeza da loja (frente, salão, banheiros e áreas internas dos setores)', CRITERIO_TRES_NIVEIS],
      ['Foi realizada a reunião de bom dia na frente de loja?', CRITERIO_REALIZADO],
      ['As operadoras estão uniformizadas e seguindo as orientações de gentileza ao cliente?', CRITERIO_TRES_NIVEIS],
      ['As operadoras estão com bolsas plásticas e orientadas diariamente sobre o racionamento?', CRITERIO_TRES_NIVEIS],
      ['Limpeza, bom funcionamento e operação dos caixas, carrinhos e cestinhas', CRITERIO_TRES_NIVEIS],
    ]
  },
  {
    nome: 'Ações Comerciais',
    tarefas: [
      ['Foram analisados os relatórios gerenciais para ações de ganho rápido?', CRITERIO_SIM_NAO],
      ['A emissão de preços foi previamente feita e etiquetada nas seções?', CRITERIO_SIM_NAO],
      ['O cartazeamento está correto na parte externa e interna, seguindo a linha da lâmina?', CRITERIO_SIM_NAO],
      ['Destaque para os produtos que geraram maior lucratividade no dia anterior (os 20 mais da loja)', CRITERIO_SIM_NAO],
      ['Iluminação, sonorização, ar-condicionado e demais equipamentos da loja (100% funcionando)', CRITERIO_TRES_NIVEIS],
      ['As pontas de gôndola e ilhas estão com os produtos em destaque?', CRITERIO_TRES_NIVEIS],
      ['Checagem do folheto de ofertas (rupturas, precificação e exposição dos produtos)', CRITERIO_SIM_NAO],
    ]
  },
  {
    nome: 'Área de Vendas',
    tarefas: [
      ['Qualidade, organização, limpeza, precificação e abastecimento do Hortifrúti', CRITERIO_TRES_NIVEIS],
      ['Qualidade, organização, limpeza, precificação e abastecimento dos Frios e Laticínios', CRITERIO_TRES_NIVEIS],
      ['Qualidade, organização, limpeza, precificação e abastecimento do Açougue e Salgados', CRITERIO_TRES_NIVEIS],
      ['Abastecimento, organização, limpeza de gôndolas e precificação do salão da loja', CRITERIO_TRES_NIVEIS],
      ['Abastecimento, organização, limpeza e precificação dos produtos próximos aos caixas', CRITERIO_TRES_NIVEIS],
      ['Abastecimento, organização, limpeza e precificação da Padaria', CRITERIO_TRES_NIVEIS],
    ]
  },
  {
    nome: 'Processos Internos',
    tarefas: [
      ['Verificação e controle das datas de validade dos produtos (todos os setores) — verificar e auditar', CRITERIO_TRES_NIVEIS],
      ['Organização do armazenamento e limpeza das câmaras, depósito e portaria', CRITERIO_TRES_NIVEIS],
      ['Limpeza e organização das áreas internas (administrativo, vestiários e refeitório)', CRITERIO_TRES_NIVEIS],
      ['Volume, limpeza da área e organização das trocas (todas deverão estar relacionadas)', CRITERIO_TRES_NIVEIS],
      ['É falado sobre prevenção de perdas diariamente?', CRITERIO_SIM_NAO],
      ['Análise das rupturas e excessos de estoque (informar e/ou solicitar ao Depto. Comercial)', CRITERIO_TRES_NIVEIS],
      ['Manutenção da loja (refrigeração, elétrica, hidráulica e predial) deverá estar 100% ok', CRITERIO_TRES_NIVEIS],
    ]
  },
]

const ITENS = SECOES.flatMap(secao => secao.tarefas.map(([titulo, criterio]) => ({ titulo, descricao: `${secao.nome} | Peso 4 | ${criterio}` })))
  .map((item, i) => ({ ...item, ordem: i + 1 }))

async function inserirTemplate() {
  const { data: existente } = await supabaseAdmin
    .from('checklist_templates')
    .select('id')
    .eq('nome', TEMPLATE.nome)
    .maybeSingle()

  if (existente) {
    console.log(`⚠️  Template "${TEMPLATE.nome}" já existe (id: ${existente.id}). Delete no Supabase para reinserir.`)
    return
  }

  const { data: templateCriado, error: errorTemplate } = await supabaseAdmin
    .from('checklist_templates')
    .insert(TEMPLATE)
    .select()
    .single()

  if (errorTemplate) {
    console.error('❌ Erro ao inserir template:', errorTemplate.message)
    return
  }

  const { error: errorItens } = await supabaseAdmin
    .from('checklist_template_itens')
    .insert(ITENS.map(item => ({ ...item, template_id: templateCriado.id })))

  if (errorItens) {
    console.error('❌ Erro ao inserir itens:', errorItens.message)
    await supabaseAdmin.from('checklist_templates').delete().eq('id', templateCriado.id)
    console.log('Template removido. Corrija o erro e tente novamente.')
    return
  }

  console.log(`✅ Template "${templateCriado.nome}" criado com ${ITENS.length} itens (id: ${templateCriado.id})`)
}

inserirTemplate()

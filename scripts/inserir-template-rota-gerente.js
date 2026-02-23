const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEMPLATE = {
  nome: 'Rota do Gerente 1.0 BASIC',
  descricao: 'Roteiro completo de tarefas diárias, semanais e mensais do gerente de supermercado. Cobre pré-abertura, abertura, dia de trabalho, rotinas semanais e procedimentos mensais.',
  categoria: 'Supermercado'
}

const ITENS = [
  // ─── PRÉ-ABERTURA DE LOJA (Diário) ───────────────────────────────────────
  {
    titulo: 'Verificar todos os maquinários da loja (PDVS, ILHAS, BALCÕES, FORNO DA PADARIA E GELADEIRA, CAMARAS)',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 1
  },
  {
    titulo: 'Verificar Relatórios gerenciais: Venda do dia anterior, Margem da Loja, Objetivo de venda para o dia, Curva A, Sem venda, Ticket Médio, Cupons e Cancelamentos',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 2
  },
  {
    titulo: 'Verificar preços alterados, realizar emissão de etiquetas de gondola',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 3
  },
  {
    titulo: 'Realizar Reunião de Bom dia na Frente de Loja (BRIEFING) com base nos relatórios gerenciais informando as metas e ações para o dia',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 4
  },
  {
    titulo: 'Ronda com Encarte, verificar layout Inteligente, verificar reposição noturna da loja, corrigir buracos e rupturas na Mercearia',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 5
  },
  {
    titulo: 'Verificar Armazenagem e Qualidades dos Perecíveis (Flv, Lacticínios, Açougue e Padaria)',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 6
  },
  {
    titulo: 'Verificar Splash para os promocionais (ex: ponta de gondola e seção) e Preços Externos',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 7
  },
  {
    titulo: 'Verificar produtos com validade curta',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 8
  },
  {
    titulo: 'Verificar produtos sem preço de cada seção',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 9
  },
  {
    titulo: 'Verificar produtos que chegaram no dia anterior',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 10
  },
  {
    titulo: 'Verificar limpeza, bom funcionamento e operação dos caixas, carrinhos e cestinhas',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 11
  },
  {
    titulo: '10 minutos após verificar andamento das ações delegadas, certificando-se que a loja está pronta para receber os clientes',
    descricao: 'Pré-Abertura de Loja | Diário',
    ordem: 12
  },

  // ─── ABERTURA DE LOJA (Diário) ────────────────────────────────────────────
  {
    titulo: 'Recepcionar clientes cordialmente na frente de loja com entusiasmo juntos as operadoras de caixa',
    descricao: 'Abertura de Loja | Diário',
    ordem: 13
  },
  {
    titulo: 'Auxiliar seções críticas que não deram o pronto na abertura',
    descricao: 'Abertura de Loja | Diário',
    ordem: 14
  },
  {
    titulo: 'Realizar Check list gerencial (Diário)',
    descricao: 'Abertura de Loja | Diário',
    ordem: 15
  },
  {
    titulo: 'Assinar notas do deposito e verificar Notas recebidas para evitar rupturas',
    descricao: 'Abertura de Loja | Diário',
    ordem: 16
  },
  {
    titulo: 'Cobrar método POLAR (Precificação, Operação eficiente, Limpeza, Atendimento de Excelência e Ruptura Zero)',
    descricao: 'Abertura de Loja | Diário',
    ordem: 17
  },
  {
    titulo: 'Ronda na loja com Visão de Prevenção de Perdas',
    descricao: 'Abertura de Loja | Diário — Cobrar realização e Registro da Quebra diária, controlar validade de mercadorias, verificar excesso no depósito, acompanhar dias de estoque, fiscalizar pesos e data de validade nas etiquetas dos perecíveis e uso correto das taras',
    ordem: 18
  },

  // ─── DIA DE TRABALHO (Diário) ─────────────────────────────────────────────
  {
    titulo: 'Verificar Rendições de almoço e auxiliar no processo',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 19
  },
  {
    titulo: 'Verificar com comercial e CPD alterações de preço durante o dia',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 20
  },
  {
    titulo: 'Verificar produtos com excesso no depósito, realizar ações com comercial e Diretoria',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 21
  },
  {
    titulo: 'Cobrar controle de datas de validade dos produtos (todos os setores), verificar e auditar',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 22
  },
  {
    titulo: 'Verificar e auditar Qualidade, organização, limpeza, precificação e abastecimento do Açougue e Salgados',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 23
  },
  {
    titulo: 'Verificar e auditar organização e limpeza de gôndolas do Salão da Loja',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 24
  },
  {
    titulo: 'Verificar e auditar Organização do armazenamento e limpeza das câmaras, depósito e portaria',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 25
  },
  {
    titulo: 'Verificar e auditar se rota de encarte e carro de som estão de modo assertivo ao longo do dia',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 26
  },
  {
    titulo: 'Atualizar Livro de Ocorrência com todos os acontecimentos da Loja (Gerente e Subgerente)',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 27
  },
  {
    titulo: 'Garantir abastecimento das Geladeiras e seções da Loja no fechamento, fiscalizando durante o dia',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 28
  },
  {
    titulo: 'Realizar Ronda Noturna nas áreas de fragilidades da loja - após fechamento',
    descricao: 'Dia de Trabalho | Diário',
    ordem: 29
  },

  // ─── ROTINAS (Semanal) ────────────────────────────────────────────────────
  {
    titulo: 'Realizar Check list Comercial',
    descricao: 'Rotinas | Semanal',
    ordem: 30
  },
  {
    titulo: 'Realizar Reunião de Alinhamento de Melhorias com Líderes e Encarregados de seção com foco em oportunidades comerciais e diminuir quebra',
    descricao: 'Rotinas | Semanal',
    ordem: 31
  },
  {
    titulo: 'Criar plano de ação de melhoria semanal e acompanhar os anteriores',
    descricao: 'Rotinas | Semanal',
    ordem: 32
  },
  {
    titulo: 'Sugerir pedidos de mercadorias com base em pesquisas de satisfação com clientes da loja',
    descricao: 'Rotinas | Semanal',
    ordem: 33
  },
  {
    titulo: 'Planejar as promoções semanais',
    descricao: 'Rotinas | Semanal',
    ordem: 34
  },
  {
    titulo: 'Definir pontas de gôndolas e pontos extras - atenção às sazonalidades',
    descricao: 'Rotinas | Semanal',
    ordem: 35
  },
  {
    titulo: 'Montar escala mensal. Mesmo que já realizado pelas seções, avaliar e corrigir',
    descricao: 'Rotinas | Semanal',
    ordem: 36
  },

  // ─── PROCEDIMENTOS (Mensal) ───────────────────────────────────────────────
  {
    titulo: 'Realizar Reunião de Apresentação de Resultados Mensal para Diretoria',
    descricao: 'Procedimentos | Mensal',
    ordem: 37
  },
  {
    titulo: 'Elaborar ações de Endomarketing (estratégia voltada para ações internas, visa melhorar imagem da empresa entre os seus colaboradores, culminando em uma equipe motivada e reduzindo o turnover)',
    descricao: 'Procedimentos | Mensal',
    ordem: 38
  },
  {
    titulo: 'Verificar escala de férias e planejar o mês',
    descricao: 'Procedimentos | Mensal',
    ordem: 39
  }
]

async function inserirTemplate() {
  console.log('🚀 Iniciando inserção do template "Rota do Gerente 1.0 BASIC"...\n')

  try {
    // 1. Verificar se já existe um template com esse nome
    const { data: existente } = await supabaseAdmin
      .from('checklist_templates')
      .select('id, nome')
      .eq('nome', TEMPLATE.nome)
      .maybeSingle()

    if (existente) {
      console.log(`⚠️  Template "${TEMPLATE.nome}" já existe (id: ${existente.id})`)
      console.log('   Se quiser reinserir, delete o template no Supabase e rode novamente.')
      return
    }

    // 2. Inserir o template
    console.log('📋 Inserindo template...')
    const { data: templateCriado, error: errorTemplate } = await supabaseAdmin
      .from('checklist_templates')
      .insert(TEMPLATE)
      .select()
      .single()

    if (errorTemplate) {
      console.error('❌ Erro ao inserir template:', errorTemplate.message)
      return
    }

    console.log(`✅ Template criado! ID: ${templateCriado.id}\n`)

    // 3. Inserir os itens
    console.log(`📝 Inserindo ${ITENS.length} itens...\n`)

    const itensParaInserir = ITENS.map(item => ({
      ...item,
      template_id: templateCriado.id
    }))

    const { error: errorItens } = await supabaseAdmin
      .from('checklist_template_itens')
      .insert(itensParaInserir)

    if (errorItens) {
      console.error('❌ Erro ao inserir itens:', errorItens.message)
      console.log('🔄 Revertendo: deletando template criado...')
      await supabaseAdmin.from('checklist_templates').delete().eq('id', templateCriado.id)
      console.log('✅ Template removido. Corrija o erro e tente novamente.')
      return
    }

    // 4. Resumo final
    console.log('='.repeat(55))
    console.log('✅ TEMPLATE INSERIDO COM SUCESSO!')
    console.log('='.repeat(55))
    console.log(`📌 Nome     : ${templateCriado.nome}`)
    console.log(`🆔 ID       : ${templateCriado.id}`)
    console.log(`📂 Categoria: ${templateCriado.categoria}`)
    console.log(`📝 Itens    : ${ITENS.length}`)
    console.log('='.repeat(55))
    console.log('\nSeções:')
    console.log('  • Pré-Abertura de Loja (Diário)  → itens 1-12')
    console.log('  • Abertura de Loja (Diário)       → itens 13-18')
    console.log('  • Dia de Trabalho (Diário)        → itens 19-29')
    console.log('  • Rotinas (Semanal)               → itens 30-36')
    console.log('  • Procedimentos (Mensal)          → itens 37-39')
    console.log('\n🎉 Pronto! O template já aparece em "Copiar um modelo pronto".')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

inserirTemplate()

// Extrai os itens (perguntas) de um checklist a partir de um arquivo enviado pelo usuário.
// Formatos aceitos: CSV/TXT, Excel (.xlsx) e Word (.docx).
// As bibliotecas de Excel e Word são carregadas sob demanda para não pesar no bundle.

export type ItemImportado = { titulo: string; descricao: string }

export const EXTENSOES_ACEITAS = '.csv,.txt,.xlsx,.docx'

export async function extrairItensDeArquivo(file: File): Promise<ItemImportado[]> {
  const nome = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  if (nome.endsWith('.xlsx')) return itensDeLinhas(await linhasDoExcel(buffer))
  if (nome.endsWith('.docx')) return itensDeLinhas(await linhasDoWord(buffer))
  if (nome.endsWith('.csv') || nome.endsWith('.txt')) return itensDeLinhas(linhasDoCsv(buffer))

  if (nome.endsWith('.xls') || nome.endsWith('.doc')) {
    throw new Error('Formato antigo do Office. Abra o arquivo e use "Salvar como" .xlsx (Excel) ou .docx (Word).')
  }
  throw new Error('Formato não suportado. Use .xlsx, .docx, .csv ou .txt.')
}

// Cada linha vira um item: 1ª célula preenchida = título, 2ª = descrição.
// Ignora a linha de cabeçalho se começar com "Título", "Pergunta" ou "Item".
function itensDeLinhas(linhas: string[][]): ItemImportado[] {
  const limpas = linhas
    .map(celulas => celulas.map(c => c.replace(/\s+/g, ' ').trim()).filter(Boolean))
    .filter(celulas => celulas.length > 0)

  const primeira = limpas[0]?.[0]?.toLowerCase() ?? ''
  const temCabecalho = /^(título|titulo|pergunta|item)s?\b/.test(primeira)

  return limpas
    .slice(temCabecalho ? 1 : 0)
    .map(celulas => ({ titulo: celulas[0], descricao: celulas.slice(1).join(' — ') }))
}

function linhasDoCsv(buffer: ArrayBuffer): string[][] {
  return decodificarTexto(buffer)
    .split(/\r?\n/)
    .map(linha => linha.split(/[;,\t]/))
}

function decodificarTexto(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // BOM UTF-8 (EF BB BF) — o arquivo é UTF-8 de verdade
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes)
  }
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  // Se a decodificação UTF-8 gerar caracteres inválidos (�), o arquivo
  // provavelmente foi salvo pelo Excel como CSV ANSI (Windows-1252), que é
  // o padrão do Windows em português — refaz a leitura com essa codificação.
  if (utf8.includes('�')) {
    return new TextDecoder('windows-1252').decode(bytes)
  }
  return utf8
}

async function linhasDoExcel(buffer: ArrayBuffer): Promise<string[][]> {
  const { readSheet } = await import('read-excel-file/browser')
  const linhas = await readSheet(buffer)
  return linhas.map(linha => linha.map(celula => (celula == null ? '' : String(celula))))
}

// Word: se o documento tiver tabelas, cada linha da tabela vira um item;
// senão, cada parágrafo / item de lista vira um item.
async function linhasDoWord(buffer: ArrayBuffer): Promise<string[][]> {
  const mammoth = (await import('mammoth')).default
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer })
  const doc = new DOMParser().parseFromString(html, 'text/html')

  const linhasTabela = Array.from(doc.querySelectorAll('tr'))
  if (linhasTabela.length > 0) {
    return linhasTabela.map(tr => Array.from(tr.querySelectorAll('td, th')).map(td => td.textContent ?? ''))
  }

  return Array.from(doc.querySelectorAll('p, li, h1, h2, h3, h4')).map(el => [el.textContent ?? ''])
}

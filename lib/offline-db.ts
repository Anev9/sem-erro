/**
 * offline-db.ts
 * Gerencia o banco de dados local (IndexedDB) para funcionamento offline.
 *
 * Stores:
 *  - checklists_cache   : dados do checklist baixados enquanto online
 *  - respostas_pendentes: respostas salvas offline que ainda não foram sincronizadas
 */

const DB_NAME = 'performe-offline'
const DB_VERSION = 1

export interface ChecklistCache {
  checklistId: string
  checklist: Record<string, unknown>
  itens: Record<string, unknown>[]
  respostas: Record<string, unknown>[]
  savedAt: number
}

export interface RespostaPendente {
  id?: number                        // auto-increment
  checklistId: string
  colaboradorId: string
  itemId: string
  resposta: 'sim' | 'nao' | 'na'
  observacao: string
  foto_url: string | null
  savedAt: number
  tentativas: number
}

// ── Abrir / criar banco ────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('checklists_cache')) {
        db.createObjectStore('checklists_cache', { keyPath: 'checklistId' })
      }

      if (!db.objectStoreNames.contains('respostas_pendentes')) {
        const store = db.createObjectStore('respostas_pendentes', {
          keyPath: 'id',
          autoIncrement: true,
        })
        store.createIndex('checklistId', 'checklistId', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Cache de checklists ───────────────────────────────────────────────────

export async function salvarChecklistCache(data: ChecklistCache): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('checklists_cache', 'readwrite')
    tx.objectStore('checklists_cache').put(data)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function lerChecklistCache(checklistId: string): Promise<ChecklistCache | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('checklists_cache', 'readonly')
    const req = tx.objectStore('checklists_cache').get(checklistId)
    req.onsuccess = () => resolve(req.result ?? null)
    req.onerror = () => reject(req.error)
  })
}

// ── Respostas pendentes ───────────────────────────────────────────────────

export async function salvarRespostaPendente(
  dados: Omit<RespostaPendente, 'id' | 'savedAt' | 'tentativas'>
): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('respostas_pendentes', 'readwrite')
    const req = tx.objectStore('respostas_pendentes').add({
      ...dados,
      savedAt: Date.now(),
      tentativas: 0,
    })
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}

export async function listarRespostasPendentes(): Promise<RespostaPendente[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('respostas_pendentes', 'readonly')
    const req = tx.objectStore('respostas_pendentes').getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function removerRespostaPendente(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('respostas_pendentes', 'readwrite')
    tx.objectStore('respostas_pendentes').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function contarRespostasPendentes(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('respostas_pendentes', 'readonly')
    const req = tx.objectStore('respostas_pendentes').count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// ── Sincronizar pendentes com o servidor ──────────────────────────────────

export async function sincronizarPendentes(): Promise<{ enviados: number; falhas: number }> {
  const pendentes = await listarRespostasPendentes()
  let enviados = 0
  let falhas = 0

  for (const item of pendentes) {
    try {
      const res = await fetch('/api/colaborador/resposta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checklist_futuro_id: item.checklistId,
          colaborador_id: item.colaboradorId,
          item_id: item.itemId,
          resposta: item.resposta,
          observacao: item.observacao,
          foto_url: item.foto_url,
        }),
      })

      if (res.ok) {
        await removerRespostaPendente(item.id!)
        enviados++
      } else {
        falhas++
      }
    } catch {
      falhas++
    }
  }

  return { enviados, falhas }
}

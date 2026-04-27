/**
 * Service Worker — Performe seu Mercado
 * Estratégia: Cache-first para assets estáticos, Network-first para API.
 * Background Sync para respostas salvas offline.
 */

const CACHE_NAME = 'performe-v2'
const SYNC_TAG = 'sync-respostas'

// Assets que serão cacheados na instalação
const ASSETS_PARA_CACHE = [
  '/',
  '/dashboard-funcionario',
  '/login',
  '/logo-semerro.jpg',
]

// ── Instalação ────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_PARA_CACHE).catch(() => {
        // Ignora erros de cache na instalação (ex: rota que ainda não existe)
      })
    })
  )
  self.skipWaiting()
})

// ── Ativação ──────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Interceptar requisições ───────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Não interceptar requisições de outros domínios (Supabase, etc.)
  if (url.origin !== self.location.origin) return

  // Rotas de API: Network-first (se falhar, retorna erro offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // Assets estáticos e páginas: Cache-first
  event.respondWith(cacheFirst(event.request))
})

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    return response
  } catch {
    return new Response(
      JSON.stringify({ error: 'Sem conexão. Resposta salva localmente.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Retorna página offline genérica se disponível
    const offline = await caches.match('/dashboard-funcionario')
    return offline ?? new Response('Sem conexão', { status: 503 })
  }
}

// ── Background Sync ───────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(sincronizarRespostas())
  }
})

async function sincronizarRespostas() {
  // Abre IndexedDB diretamente no service worker
  const db = await abrirDB()
  const pendentes = await lerTodos(db, 'respostas_pendentes')

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
        await deletarItem(db, 'respostas_pendentes', item.id)
      }
    } catch {
      // Mantém na fila para tentar na próxima sincronização
    }
  }

  // Notifica todos os clientes abertos sobre a sincronização
  const clients = await self.clients.matchAll()
  clients.forEach((client) => client.postMessage({ type: 'SYNC_CONCLUIDO' }))
}

// ── Helpers de IndexedDB no Service Worker ────────────────────────────────
function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('performe-offline', 1)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
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

function lerTodos(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function deletarItem(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

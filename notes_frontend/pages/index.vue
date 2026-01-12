<template>
  <div class="appFrame">
    <header class="topBar">
      <div class="brand">
        <div class="brandMark" aria-hidden="true">N</div>
        <div class="brandText">
          <div class="brandName">Notes</div>
          <div class="brandTagline">Ocean Professional</div>
        </div>
      </div>

      <div class="topActions">
        <div class="envPill" v-if="publicApiBase">
          <span class="envLabel">API</span>
          <span class="envValue">{{ publicApiBase }}</span>
        </div>

        <button class="btn btnPrimary" type="button" @click="onCreateNote">
          New note
        </button>
      </div>
    </header>

    <div class="contentGrid">
      <aside class="sidebar" aria-label="Notes navigation">
        <div class="panelHeader">
          <div class="panelTitle">Your notes</div>
          <div class="panelMeta">{{ filteredNotes.length }} shown</div>
        </div>

        <div class="searchBlock">
          <label class="fieldLabel" for="search">Search</label>
          <input
            id="search"
            v-model="query"
            class="input"
            type="search"
            placeholder="Search title, content, tags…"
            autocomplete="off"
          />
        </div>

        <div class="filtersRow">
          <div class="filter">
            <label class="fieldLabel" for="tagFilter">Tag</label>
            <select id="tagFilter" v-model="tagFilter" class="select">
              <option value="">All</option>
              <option v-for="t in allTags" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="filter">
            <label class="fieldLabel" for="sortBy">Sort</label>
            <select id="sortBy" v-model="sortBy" class="select">
              <option value="updatedDesc">Recently updated</option>
              <option value="createdDesc">Recently created</option>
              <option value="titleAsc">Title A→Z</option>
            </select>
          </div>
        </div>

        <nav class="notesList" aria-label="Notes list">
          <button
            v-for="n in filteredNotes"
            :key="n.id"
            type="button"
            class="noteListItem"
            :class="{ active: n.id === selectedId }"
            @click="select(n.id)"
          >
            <div class="noteListTitle">
              {{ n.title?.trim() ? n.title : "Untitled note" }}
            </div>
            <div class="noteListSnippet">
              {{ snippet(n.content) }}
            </div>
            <div class="noteListMeta">
              <span class="chip chipMuted">
                Updated {{ formatRelative(n.updatedAt) }}
              </span>
              <span v-if="n.tags.length" class="chip chipAmber">
                {{ n.tags[0] }}<span v-if="n.tags.length > 1"> +{{ n.tags.length - 1 }}</span>
              </span>
            </div>
          </button>

          <div v-if="filteredNotes.length === 0" class="emptyState">
            <div class="emptyTitle">No notes found</div>
            <div class="emptyDesc">Try a different search or create a new note.</div>
            <button class="btn btnSecondary" type="button" @click="onCreateNote">
              Create your first note
            </button>
          </div>
        </nav>
      </aside>

      <main class="editor" aria-label="Note editor">
        <div v-if="!selectedNote" class="emptyEditor">
          <div class="emptyTitle">Select a note</div>
          <div class="emptyDesc">
            Choose a note from the left, or create a new one to start writing.
          </div>
          <button class="btn btnPrimary" type="button" @click="onCreateNote">
            New note
          </button>
        </div>

        <div v-else class="editorCard">
          <div class="editorHeader">
            <div class="editorHeaderLeft">
              <div class="editorTitle">Edit note</div>
              <div class="editorMeta">
                Created {{ formatRelative(selectedNote.createdAt) }} · Updated
                {{ formatRelative(selectedNote.updatedAt) }}
              </div>
            </div>

            <div class="editorHeaderRight">
              <button class="btn btnGhost" type="button" @click="onDuplicateNote" :disabled="!selectedNote">
                Duplicate
              </button>
              <button class="btn btnDanger" type="button" @click="onDeleteNote" :disabled="!selectedNote">
                Delete
              </button>
            </div>
          </div>

          <div class="editorBody">
            <div class="formRow">
              <div class="field">
                <label class="fieldLabel" for="title">Title</label>
                <input
                  id="title"
                  v-model="draft.title"
                  class="input"
                  type="text"
                  placeholder="A clear title…"
                  @input="markDirtyAndAutosave"
                />
              </div>

              <div class="field">
                <label class="fieldLabel" for="tags">Tags</label>
                <input
                  id="tags"
                  v-model="tagsText"
                  class="input"
                  type="text"
                  placeholder="e.g. work, ideas, personal"
                  @input="onTagsTextInput"
                />
                <div class="helpText">Comma-separated. Press Enter to keep typing.</div>
              </div>
            </div>

            <div class="field">
              <div class="fieldRow">
                <label class="fieldLabel" for="content">Content (Markdown compatible)</label>
                <div class="miniHint">Tip: Use <code>#</code> headings, <code>-</code> lists, <code>**bold**</code></div>
              </div>
              <textarea
                id="content"
                v-model="draft.content"
                class="textarea"
                rows="14"
                placeholder="Write your note in Markdown…"
                @input="markDirtyAndAutosave"
              />
            </div>

            <div class="footerRow">
              <div class="status">
                <span class="dot" :class="{ on: isDirty }" aria-hidden="true"></span>
                <span v-if="isDirty">Unsaved changes (auto-saving…)</span>
                <span v-else>All changes saved</span>
              </div>

              <div class="footerActions">
                <button class="btn btnSecondary" type="button" @click="revertDraft" :disabled="!selectedNote">
                  Revert
                </button>
                <button class="btn btnPrimary" type="button" @click="saveNow" :disabled="!selectedNote">
                  Save
                </button>
              </div>
            </div>
          </div>

          <div class="preview">
            <div class="previewHeader">
              <div class="previewTitle">Preview</div>
              <div class="previewNote">Rendered lightly (no external Markdown dependency)</div>
            </div>
            <div class="previewBody">
              <h2 class="previewH2">{{ draft.title?.trim() ? draft.title : "Untitled note" }}</h2>
              <div class="previewTags" v-if="draft.tags.length">
                <span v-for="t in draft.tags" :key="t" class="chip chipAmber">{{ t }}</span>
              </div>
              <div class="previewContent" v-html="renderPreviewHtml(draft.content)"></div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <footer class="bottomBar">
      <div class="bottomLeft">
        <span class="pill">
          <span class="pillKey">Storage</span>
          <span class="pillVal">localStorage</span>
        </span>
        <span class="pill" v-if="publicFrontendUrl">
          <span class="pillKey">URL</span>
          <span class="pillVal">{{ publicFrontendUrl }}</span>
        </span>
      </div>

      <div class="bottomRight">
        <span class="muted">No backend required for MVP.</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

type Draft = {
  title: string
  content: string
  tags: string[]
}

/**
 * Simple HTML escaping to reduce accidental HTML injection when rendering preview.
 */
function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

/**
 * Very small “preview” renderer:
 * - Escapes HTML first
 * - Supports headings (#, ##, ###), unordered lists (- ), inline code, bold, italics, and paragraphs.
 * This intentionally avoids adding a 3rd party Markdown dependency for MVP.
 */
function renderPreviewHtml(markdown: string): string {
  const safe = escapeHtml(markdown || "")
  const lines = safe.split(/\r?\n/)

  const out: string[] = []
  let inList = false

  const flushList = (): void => {
    if (inList) {
      out.push("</ul>")
      inList = false
    }
  }

  const inline = (s: string): string => {
    // inline code
    let x = s.replaceAll(/`([^`]+)`/g, "<code>$1</code>")
    // bold
    x = x.replaceAll(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    // italics (basic)
    x = x.replaceAll(/\*([^*]+)\*/g, "<em>$1</em>")
    return x
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (!line.trim()) {
      flushList()
      continue
    }

    const h3 = line.match(/^###\s+(.*)$/)
    const h2 = line.match(/^##\s+(.*)$/)
    const h1 = line.match(/^#\s+(.*)$/)
    const li = line.match(/^-+\s+(.*)$/)

    if (h1) {
      flushList()
      out.push(`<h3>${inline(h1[1])}</h3>`)
      continue
    }
    if (h2) {
      flushList()
      out.push(`<h4>${inline(h2[1])}</h4>`)
      continue
    }
    if (h3) {
      flushList()
      out.push(`<h5>${inline(h3[1])}</h5>`)
      continue
    }
    if (li) {
      if (!inList) {
        out.push("<ul>")
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }

    flushList()
    out.push(`<p>${inline(line)}</p>`)
  }

  flushList()
  return out.join("\n")
}

/**
 * Generates a stable-ish id without dependencies.
 */
function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Produces a short snippet from content for the list view.
 */
function snippet(content: string): string {
  const clean = (content || "").replaceAll(/\s+/g, " ").trim()
  if (!clean) return "—"
  return clean.length > 84 ? `${clean.slice(0, 84)}…` : clean
}

function formatRelative(ts: number): string {
  const diffMs = Date.now() - ts
  const s = Math.floor(diffMs / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  if (s < 15) return "just now"
  if (s < 60) return `${s}s ago`
  if (m < 60) return `${m}m ago`
  if (h < 24) return `${h}h ago`
  return `${d}d ago`
}

const config = useRuntimeConfig()
const publicApiBase = computed(() => String(config.public?.apiBase || config.public?.backendUrl || ""))
const publicFrontendUrl = computed(() => String(config.public?.frontendUrl || ""))

const STORAGE_KEY = "notes_frontend__notes_v1"
const SELECTED_KEY = "notes_frontend__selected_v1"

const notes = ref<Note[]>([])
const selectedId = ref<string>("")

const query = ref<string>("")
const tagFilter = ref<string>("")
const sortBy = ref<"updatedDesc" | "createdDesc" | "titleAsc">("updatedDesc")

const selectedNote = computed(() => notes.value.find((n) => n.id === selectedId.value) || null)

const draft = reactive<Draft>({
  title: "",
  content: "",
  tags: [],
})

const tagsText = ref<string>("")
const isDirty = ref<boolean>(false)

const allTags = computed(() => {
  const set = new Set<string>()
  for (const n of notes.value) for (const t of n.tags) set.add(t)
  return Array.from(set).sort((a, b) => a.localeCompare(b))
})

const filteredNotes = computed(() => {
  const q = query.value.trim().toLowerCase()
  const tag = tagFilter.value.trim().toLowerCase()

  let result = [...notes.value]

  if (q) {
    result = result.filter((n) => {
      const hay = `${n.title}\n${n.content}\n${n.tags.join(",")}`.toLowerCase()
      return hay.includes(q)
    })
  }

  if (tag) {
    result = result.filter((n) => n.tags.some((t) => t.toLowerCase() === tag))
  }

  if (sortBy.value === "updatedDesc") {
    result.sort((a, b) => b.updatedAt - a.updatedAt)
  } else if (sortBy.value === "createdDesc") {
    result.sort((a, b) => b.createdAt - a.createdAt)
  } else {
    result.sort((a, b) => (a.title || "").localeCompare(b.title || ""))
  }

  return result
})

function normalizeTagsFromText(text: string): string[] {
  const parts = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  // unique, preserve order
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const key = p.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      out.push(p)
    }
  }
  return out
}

function setDraftFromNote(n: Note): void {
  draft.title = n.title
  draft.content = n.content
  draft.tags = [...n.tags]
  tagsText.value = n.tags.join(", ")
  isDirty.value = false
}

function persist(): void {
  if (!process.client) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.value))
  localStorage.setItem(SELECTED_KEY, selectedId.value || "")
}

function load(): void {
  if (!process.client) return

  const raw = localStorage.getItem(STORAGE_KEY)
  const rawSelected = localStorage.getItem(SELECTED_KEY) || ""

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Note[]
      if (Array.isArray(parsed)) {
        notes.value = parsed
      }
    } catch {
      // ignore
    }
  }

  if (!notes.value.length) {
    // Seed demo notes for first run
    const now = Date.now()
    notes.value = [
      {
        id: newId(),
        title: "Welcome to Notes",
        content:
          "# Welcome\n\nThis is a simple **Nuxt** notes app.\n\n- Create notes\n- Add tags\n- Search quickly\n\nTry editing this note!",
        tags: ["getting-started", "nuxt"],
        createdAt: now - 1000 * 60 * 60 * 12,
        updatedAt: now - 1000 * 60 * 10,
      },
      {
        id: newId(),
        title: "Ocean Professional theme checklist",
        content:
          "## UI details\n\n- Subtle gradients\n- Rounded corners\n- Soft shadows\n- Smooth transitions\n\n`Primary`: #2563EB\n\n`Accent`: #F59E0B",
        tags: ["design", "ui"],
        createdAt: now - 1000 * 60 * 60 * 24 * 3,
        updatedAt: now - 1000 * 60 * 60 * 4,
      },
    ]
  }

  // Restore selection if possible, else select first note.
  const candidate = notes.value.find((n) => n.id === rawSelected)?.id || notes.value[0]?.id || ""
  selectedId.value = candidate
  if (selectedNote.value) setDraftFromNote(selectedNote.value)

  persist()
}

function select(id: string): void {
  if (id === selectedId.value) return

  // If there are unsaved changes, we still switch but keep auto-save behavior on input.
  selectedId.value = id
  const n = notes.value.find((x) => x.id === id)
  if (n) setDraftFromNote(n)
  persist()
}

function onCreateNote(): void {
  const now = Date.now()
  const n: Note = {
    id: newId(),
    title: "Untitled note",
    content: "",
    tags: [],
    createdAt: now,
    updatedAt: now,
  }
  notes.value = [n, ...notes.value]
  selectedId.value = n.id
  setDraftFromNote(n)
  persist()
}

function onDeleteNote(): void {
  if (!selectedNote.value) return
  const id = selectedNote.value.id
  const remaining = notes.value.filter((n) => n.id !== id)
  notes.value = remaining

  if (remaining.length) {
    selectedId.value = remaining[0].id
    setDraftFromNote(remaining[0])
  } else {
    selectedId.value = ""
    draft.title = ""
    draft.content = ""
    draft.tags = []
    tagsText.value = ""
    isDirty.value = false
  }

  persist()
}

function onDuplicateNote(): void {
  if (!selectedNote.value) return
  const base = selectedNote.value
  const now = Date.now()
  const copy: Note = {
    ...base,
    id: newId(),
    title: base.title?.trim() ? `${base.title} (copy)` : "Untitled note (copy)",
    createdAt: now,
    updatedAt: now,
  }
  notes.value = [copy, ...notes.value]
  selectedId.value = copy.id
  setDraftFromNote(copy)
  persist()
}

function saveNow(): void {
  if (!selectedNote.value) return
  const idx = notes.value.findIndex((n) => n.id === selectedNote.value?.id)
  if (idx < 0) return

  const now = Date.now()
  const updated: Note = {
    ...notes.value[idx],
    title: draft.title,
    content: draft.content,
    tags: [...draft.tags],
    updatedAt: now,
  }
  const next = [...notes.value]
  next[idx] = updated
  notes.value = next
  isDirty.value = false
  persist()
}

function revertDraft(): void {
  if (!selectedNote.value) return
  setDraftFromNote(selectedNote.value)
}

let autosaveTimer: number | null = null
function markDirtyAndAutosave(): void {
  isDirty.value = true
  if (!process.client) return

  if (autosaveTimer) window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(() => {
    saveNow()
    autosaveTimer = null
  }, 450)
}

function onTagsTextInput(): void {
  draft.tags = normalizeTagsFromText(tagsText.value)
  markDirtyAndAutosave()
}

watch(
  () => selectedId.value,
  () => {
    // keep selection persisted even if no edits
    persist()
  }
)

onMounted(() => {
  load()
})
</script>

<style scoped>
/* page-specific layout tweaks (most styling is in global main.css) */
.appFrame {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topBar {
  position: sticky;
  top: 0;
  z-index: 10;
}

.contentGrid {
  flex: 1;
}

.bottomBar {
  margin-top: auto;
}
</style>

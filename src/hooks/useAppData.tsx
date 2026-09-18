import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FirstDraft } from '../domain/firsts'
import type { AppData } from '../domain/types'
import { FirstsService } from '../features/firsts/firstsService'
import { loadAppData, type LoadResult } from '../storage/appDataRepository'

interface AppDataContextValue {
  data: AppData | null
  recovery: Extract<LoadResult, { status: 'recovery' }> | null
  createFirst: (draft: FirstDraft, imageFile?: File) => ReturnType<FirstsService['create']>
  editFirst: (id: string, draft: FirstDraft, imageFile?: File, removeImage?: boolean) => ReturnType<FirstsService['edit']>
  deleteFirst: (id: string) => ReturnType<FirstsService['remove']>
  reload: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const service = useMemo(() => new FirstsService(), [])
  const [loaded, setLoaded] = useState<LoadResult>(() => loadAppData())

  const reload = () => setLoaded(loadAppData())

  const value: AppDataContextValue = {
    data: loaded.status === 'ready' ? loaded.data : null,
    recovery: loaded.status === 'recovery' ? loaded : null,
    reload,
    createFirst: async (draft, imageFile) => {
      const result = await service.create(draft, imageFile)
      setLoaded({ status: 'ready', data: result.data })
      return result
    },
    editFirst: async (id, draft, imageFile, removeImage) => {
      const result = await service.edit(id, draft, imageFile, removeImage)
      setLoaded({ status: 'ready', data: result.data })
      return result
    },
    deleteFirst: async (id) => {
      const result = await service.remove(id)
      setLoaded({ status: 'ready', data: result.data })
      return result
    },
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}

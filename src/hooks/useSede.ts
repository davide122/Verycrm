'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface SedeInfo {
  id: string
  nome: string
  citta: string
}

const sediInfo: Record<string, SedeInfo> = {
  'aragona': {
    id: 'aragona',
    nome: 'Ufficio Postale Aragona',
    citta: 'Aragona'
  },
  'porto-empedocle': {
    id: 'porto-empedocle',
    nome: 'Ufficio Postale Porto Empedocle',
    citta: 'Porto Empedocle'
  }
}

export function useSede() {
  const [currentSede, setCurrentSede] = useState<SedeInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSede = () => {
      try {
        const sedeId = localStorage.getItem('currentSede')
        if (sedeId && sediInfo[sedeId]) {
          setCurrentSede(sediInfo[sedeId])
        } else {
          // Se non c'è una sede valida, reindirizza al login
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Errore nel caricamento della sede:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkSede()
  }, [router])

  const logout = () => {
    localStorage.removeItem('currentSede')
    localStorage.removeItem('loginTime')
    document.cookie = 'currentSede=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    router.push('/login')
  }

  const getStorageKey = (baseKey: string) => {
    if (!currentSede) return baseKey
    const today = new Date().toISOString().split('T')[0]
    return `${baseKey}_${currentSede.id}_${today}`
  }

  const saveData = (key: string, data: unknown) => {
    try {
      const storageKey = getStorageKey(key)
      localStorage.setItem(storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Errore nel salvataggio dati:', error)
    }
  }

  const loadData = (key: string) => {
    try {
      const storageKey = getStorageKey(key)
      const data = localStorage.getItem(storageKey)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Errore nel caricamento dati:', error)
      return []
    }
  }

  return {
    currentSede,
    isLoading,
    logout,
    saveData,
    loadData,
    getStorageKey
  }
}
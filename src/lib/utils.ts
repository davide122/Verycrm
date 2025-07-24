import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funzione per determinare il turno automaticamente
export function getTurnoCorrente(): string {
  const ora = new Date().getHours()
  return ora < 14 ? 'mattina' : 'pomeriggio'
}

// Funzione per calcolare il prezzo delle spedizioni con listino ufficiale Poste
export function calcolaPrezzo(peso: number, pellicola: boolean, imballaggio: boolean) {
  const postePrezzi = [
    { min: 0, max: 2, prezzo: 4.50 },
    { min: 2, max: 5, prezzo: 5.45 },
    { min: 5, max: 10, prezzo: 7.05 },
    { min: 10, max: 20, prezzo: 8.05 },
    { min: 20, max: 30, prezzo: 9.70 },
    { min: 30, max: 50, prezzo: 18.02 },
    { min: 50, max: 75, prezzo: 19.08 },
    { min: 75, max: 100, prezzo: 24.38 },
    { min: 100, max: 125, prezzo: 24.38 },
    { min: 125, max: 150, prezzo: 24.38 },
    { min: 150, max: 175, prezzo: 24.38 }
  ]

  const clientePrezzi = [
    { min: 0, max: 2, prezzo: 10 },
    { min: 2, max: 5, prezzo: 13 },
    { min: 5, max: 10, prezzo: 15 },
    { min: 10, max: 20, prezzo: 18 },
    { min: 20, max: 25, prezzo: 20 },
    { min: 21, max: 30, prezzo: 24 },
    { min: 30, max: 50, prezzo: 30 },
    { min: 50, max: 75, prezzo: 45 },
    { min: 75, max: 100, prezzo: 65 },
    { min: 100, max: 125, prezzo: 80 },
    { min: 125, max: 150, prezzo: 90 },
    { min: 150, max: 175, prezzo: 100 }
  ]

  const poste = postePrezzi.find(p => peso > p.min && peso <= p.max)?.prezzo || 0
  const cliente = clientePrezzi.find(p => peso > p.min && peso <= p.max)?.prezzo || 0
  const iva = Math.round(poste * 0.22 * 100) / 100
  const rimborso = Math.round((poste + iva) * 100) / 100
  const extra = (pellicola ? 3 : 0) + (imballaggio ? 5 : 0)
  const totaleCliente = cliente + extra
  const varie = Math.round((totaleCliente - rimborso) * 100) / 100
  const guadagno = varie

  return {
    poste,
    iva,
    rimborso,
    cliente: totaleCliente,
    guadagno,
    varie
  }
}

// Funzione per formattare la data
export function formatDate(date: Date): string {
  return date.toLocaleDateString('it-IT')
}

// Funzione per formattare la valuta
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

// Configurazione prezzi servizi (modificabile dalle impostazioni)
export const PREZZI_SERVIZI = {
  SPID: {
    costoAzienda: 10, // + IVA
    prezzoCliente: 15,
    iva: 0.22
  },
  MODULI: {
    costoAzienda: 0,
    prezzoCliente: 5,
    iva: 0.22
  },
  CONTRATTI_A2A: {
    costoAzienda: 0,
    prezzoCliente: 130,
    iva: 0.22
  },
  PELLICOLA: {
    costoAzienda: 1,
    prezzoCliente: 3,
    iva: 0.22
  },
  IMBALLAGGIO: {
    costoAzienda: 2,
    prezzoCliente: 5,
    iva: 0.22
  }
}

// Funzione per calcolare il prezzo di un servizio
export function calcolaPrezzoServizio(tipoServizio: keyof typeof PREZZI_SERVIZI, quantita: number = 1) {
  const servizio = PREZZI_SERVIZI[tipoServizio]
  const costoTotale = servizio.costoAzienda * quantita
  const ivaAzienda = Math.round(costoTotale * servizio.iva * 100) / 100
  const costoConIva = Math.round((costoTotale + ivaAzienda) * 100) / 100
  const prezzoCliente = servizio.prezzoCliente * quantita
  const guadagno = Math.round((prezzoCliente - costoConIva) * 100) / 100

  return {
    costoAzienda: costoTotale,
    ivaAzienda,
    costoConIva,
    prezzoCliente,
    guadagno,
    quantita
  }
}

// Funzione per aggiornare i prezzi dei servizi (per le impostazioni)
export function aggiornaPrezzoServizio(tipoServizio: keyof typeof PREZZI_SERVIZI, nuoviPrezzi: Partial<typeof PREZZI_SERVIZI[keyof typeof PREZZI_SERVIZI]>) {
  PREZZI_SERVIZI[tipoServizio] = { ...PREZZI_SERVIZI[tipoServizio], ...nuoviPrezzi }
}

// Lista servizi disponibili per i dropdown
export const SERVIZI_DISPONIBILI = [
  { id: 'SPID', nome: 'SPID', descrizione: 'Servizio Pubblico di Identità Digitale' },
  { id: 'MODULI', nome: 'Moduli/Pratiche', descrizione: 'Disbrighi pratiche e moduli vari' },
  { id: 'CONTRATTI_A2A', nome: 'Contratti A2A', descrizione: 'Contratti energia A2A' },
  { id: 'PELLICOLA', nome: 'Pellicola', descrizione: 'Pellicola protettiva per spedizioni' },
  { id: 'IMBALLAGGIO', nome: 'Imballaggio', descrizione: 'Servizio imballaggio professionale' }
] as const

// Funzione per ottenere le opzioni del dropdown servizi
export function getOpzioniServizi() {
  return SERVIZI_DISPONIBILI.map(servizio => ({
    value: servizio.id,
    label: `${servizio.nome} - ${formatCurrency(PREZZI_SERVIZI[servizio.id as keyof typeof PREZZI_SERVIZI].prezzoCliente)}`,
    descrizione: servizio.descrizione
  }))
}
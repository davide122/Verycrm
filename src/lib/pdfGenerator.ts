import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './utils'

// Import dei tipi necessari
import { CellHookData } from 'jspdf-autotable'

interface ServizioEffettuato {
  id: string
  servizioId: number
  quantita: number
  prezzoCliente: number
  costoTotale: number
  guadagno: number
  turno: string
  sede: string
  createdAt: string
  servizio: {
    nome: string
  }
}

interface Spedizione {
  id: string
  peso: number
  prezzoCliente: number
  guadagno: number
  rimborsoSpese: number
}

interface RiepilogoData {
  data: string
  turno?: string
  servizi: {
    lista: ServizioEffettuato[]
    totali: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
  }
  spedizioni: {
    lista: Spedizione[]
    totali: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
  }
  totali: {
    entrate: number
    costi: number
    guadagni: number
  }
  pagamenti: {
    servizi: {
      contanti: number
      pos: number
    }
    spedizioni: {
      contanti: number
      pos: number
    }
    totaliContanti: number
    totaliPos: number
  }
}

interface SedeInfo {
  id: string
  nome: string
  citta: string
}

export function generateChiusuraReport(
  riepilogo: RiepilogoData,
  sede: SedeInfo,
  selectedDate: string,
  selectedTurno: string
) {
  const doc = new jsPDF()
  
  // Configurazione colori
  const primaryColor: [number, number, number] = [41, 98, 255] // Blu
  const secondaryColor: [number, number, number] = [255, 193, 7] // Giallo
  const textColor: [number, number, number] = [51, 51, 51]
  const lightGray: [number, number, number] = [248, 249, 250]
  
  // Header del documento
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 40, 'F')
  
  // Logo/Titolo
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORT CHIUSURA GIORNALIERA', 20, 25)
  
  // Informazioni sede e data
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`Sede: ${sede.nome} - ${sede.citta}`, 20, 35)
  
  // Data e turno
  doc.setTextColor(...textColor)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const dataFormattata = new Date(selectedDate).toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Data: ${dataFormattata}`, 20, 55)
  
  if (selectedTurno && selectedTurno !== 'all') {
    doc.text(`Turno: ${selectedTurno}`, 20, 65)
  }
  
  let yPosition = selectedTurno && selectedTurno !== 'all' ? 80 : 70
  
  // Sezione Riepilogo Generale
  doc.setFillColor(...secondaryColor)
  doc.rect(20, yPosition, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RIEPILOGO GENERALE', 25, yPosition + 6)
  
  yPosition += 15
  
  // Tabella riepilogo generale
  const riepilogoData = [
    ['Entrate Totali', formatCurrency(riepilogo.totali.entrate)],
    ['Costi Operativi', formatCurrency(riepilogo.totali.costi)],
    ['Guadagno Netto', formatCurrency(riepilogo.totali.guadagni)],
    ['Margine %', `${riepilogo.totali.entrate > 0 ? ((riepilogo.totali.guadagni / riepilogo.totali.entrate) * 100).toFixed(1) : '0'}%`]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Voce', 'Importo']],
    body: riepilogoData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 11,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    margin: { left: 20, right: 20 }
  })
  
  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  
  // Sezione Servizi
  if (riepilogo.servizi.lista.length > 0) {
    doc.setFillColor(...secondaryColor)
    doc.rect(20, yPosition, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETTAGLIO SERVIZI', 25, yPosition + 6)
    
    yPosition += 15
    
    const serviziData = riepilogo.servizi.lista.map(servizio => {
      // Calcola l'IVA solo se c'è un costo aziendale (22% sul costo aziendale)
      const iva = servizio.costoTotale > 0 ? servizio.costoTotale * 0.22 : 0
      const costoTotaleConIva = servizio.costoTotale + iva
      const guadagnoNettoConIva = servizio.prezzoCliente - costoTotaleConIva
      
      return [
        servizio.servizio.nome,
        servizio.quantita.toString(),
        formatCurrency(servizio.prezzoCliente),
        formatCurrency(costoTotaleConIva),
        formatCurrency(guadagnoNettoConIva),
        formatCurrency(iva)
      ]
    })
    
    // Calcola totali con IVA
    const totalIvaServizi = riepilogo.servizi.lista.reduce((acc, servizio) => {
      return acc + (servizio.costoTotale > 0 ? servizio.costoTotale * 0.22 : 0)
    }, 0)
    const totalCostiConIva = riepilogo.servizi.totali.costi + totalIvaServizi
    const totalGuadagnoConIva = riepilogo.servizi.totali.entrate - totalCostiConIva
    
    // Aggiungi riga totali
    serviziData.push([
      'TOTALE SERVIZI',
      riepilogo.servizi.totali.quantita.toString(),
      formatCurrency(riepilogo.servizi.totali.entrate),
      formatCurrency(totalCostiConIva),
      formatCurrency(totalGuadagnoConIva),
      formatCurrency(totalIvaServizi)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['Servizio', 'Qtà', 'Entrate', 'Costi', 'Guadagno', 'IVA']],
      body: serviziData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      // Evidenzia l'ultima riga (totali)
      didParseCell: function(data: CellHookData) {
        if (data.row.index === serviziData.length - 1) {
          data.cell.styles.fillColor = [230, 230, 230]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: 20, right: 20 }
    })
    
    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  }
  
  // Sezione Spedizioni
  if (riepilogo.spedizioni.lista.length > 0) {
    // Controlla se serve una nuova pagina
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 20
    }
    
    doc.setFillColor(...secondaryColor)
    doc.rect(20, yPosition, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('DETTAGLIO SPEDIZIONI', 25, yPosition + 6)
    
    yPosition += 15
    
    const spedizioniData = riepilogo.spedizioni.lista.map((spedizione, index) => [
      (index + 1).toString(),
      `${spedizione.peso}kg`,
      formatCurrency(spedizione.prezzoCliente),
      formatCurrency(spedizione.rimborsoSpese || 0),
      formatCurrency(spedizione.guadagno)
    ])
    
    // Aggiungi riga totali
    spedizioniData.push([
      'TOTALE SPEDIZIONI',
      `${riepilogo.spedizioni.lista.reduce((acc, s) => acc + s.peso, 0)}kg`,
      formatCurrency(riepilogo.spedizioni.totali.entrate),
      formatCurrency(riepilogo.spedizioni.totali.costi),
      formatCurrency(riepilogo.spedizioni.totali.guadagni)
    ])
    
    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Peso', 'Entrate', 'Costi', 'Guadagno']],
      body: spedizioniData,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: textColor
      },
      alternateRowStyles: {
        fillColor: lightGray
      },
      // Evidenzia l'ultima riga (totali)
      didParseCell: function(data: CellHookData) {
        if (data.row.index === spedizioniData.length - 1) {
          data.cell.styles.fillColor = [230, 230, 230]
          data.cell.styles.fontStyle = 'bold'
        }
      },
      margin: { left: 20, right: 20 }
    })
    
    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  }
  
  // Sezione Riepilogo Pagamenti
  // Controlla se serve una nuova pagina
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 20
  }
  
  doc.setFillColor(...secondaryColor)
  doc.rect(20, yPosition, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RIEPILOGO PAGAMENTI', 25, yPosition + 6)
  
  yPosition += 15
  
  const pagamentiData = [
    ['Servizi - Contanti', formatCurrency(riepilogo.pagamenti.servizi.contanti)],
    ['Servizi - POS', formatCurrency(riepilogo.pagamenti.servizi.pos)],
    ['Spedizioni - Contanti', formatCurrency(riepilogo.pagamenti.spedizioni.contanti)],
    ['Spedizioni - POS', formatCurrency(riepilogo.pagamenti.spedizioni.pos)],
    ['TOTALE CONTANTI', formatCurrency(riepilogo.pagamenti.totaliContanti)],
    ['TOTALE POS', formatCurrency(riepilogo.pagamenti.totaliPos)]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Metodo Pagamento', 'Importo']],
    body: pagamentiData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 12,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 11,
      textColor: textColor
    },
    alternateRowStyles: {
      fillColor: lightGray
    },
    // Evidenzia le righe dei totali
    didParseCell: function(data: CellHookData) {
      if (data.row.index >= pagamentiData.length - 2) {
        data.cell.styles.fillColor = [230, 230, 230]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 20, right: 20 }
  })
  
  // Footer
  const pageCount = (doc as jsPDF & { getNumberOfPages(): number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text(
      `Generato il ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`,
      20,
      285
    )
    doc.text(`Pagina ${i} di ${pageCount}`, 170, 285)
  }
  
  // Genera il nome del file
  const fileName = `chiusura_${sede.id}_${selectedDate}${selectedTurno && selectedTurno !== 'all' ? `_${selectedTurno}` : ''}.pdf`
  
  // Salva il PDF
  doc.save(fileName)
}

// Interfacce per il report mensile
interface MonthlyReportData {
  mese: string
  sede: {
    id: string
    nome: string
  }
  giorni: {
    data: string
    servizi: ServizioEffettuato[]
    spedizioni: Spedizione[]
    totaliGiorno: {
      entrate: number
      guadagni: number
      operazioni: number
    }
  }[]
  totali: {
    servizi: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
    spedizioni: {
      entrate: number
      costi: number
      guadagni: number
      quantita: number
    }
    generali: {
      entrate: number
      guadagni: number
      operazioni: number
    }
  }
  pagamenti: {
    servizi: {
      contanti: number
      pos: number
    }
    spedizioni: {
      contanti: number
      pos: number
    }
    totali: {
      contanti: number
      pos: number
    }
  }
}

export async function generateMonthlyReport(reportData: MonthlyReportData): Promise<Buffer> {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('REPORT MENSILE', 105, 20, { align: 'center' })
  
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Sede: ${reportData.sede.nome}`, 20, 35)
  doc.text(`Mese: ${reportData.mese}`, 20, 45)
  doc.text(`Generato il: ${formatDate(new Date())}`, 20, 55)
  
  let yPosition = 70
  
  // Riepilogo totali mensili
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RIEPILOGO MENSILE', 20, yPosition)
  yPosition += 15
  
  const totaliData = [
    ['Categoria', 'Entrate', 'Guadagni', 'Operazioni'],
    [
      'Servizi',
      formatCurrency(reportData.totali.servizi.entrate),
      formatCurrency(reportData.totali.servizi.guadagni),
      reportData.totali.servizi.quantita.toString()
    ],
    [
      'Spedizioni',
      formatCurrency(reportData.totali.spedizioni.entrate),
      formatCurrency(reportData.totali.spedizioni.guadagni),
      reportData.totali.spedizioni.quantita.toString()
    ],
    [
      'TOTALE',
      formatCurrency(reportData.totali.generali.entrate),
      formatCurrency(reportData.totali.generali.guadagni),
      reportData.totali.generali.operazioni.toString()
    ]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    head: [totaliData[0]],
    body: totaliData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
    didParseCell: function(data: CellHookData) {
      if (data.row.index === totaliData.length - 2) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 230, 230]
      }
    }
  })
  
  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  
  // Riepilogo pagamenti
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('RIEPILOGO PAGAMENTI', 20, yPosition)
  yPosition += 15
  
  const pagamentiData = [
    ['Tipologia', 'Contanti', 'POS', 'Totale'],
    [
      'Servizi',
      formatCurrency(reportData.pagamenti.servizi.contanti),
      formatCurrency(reportData.pagamenti.servizi.pos),
      formatCurrency(reportData.pagamenti.servizi.contanti + reportData.pagamenti.servizi.pos)
    ],
    [
      'Spedizioni',
      formatCurrency(reportData.pagamenti.spedizioni.contanti),
      formatCurrency(reportData.pagamenti.spedizioni.pos),
      formatCurrency(reportData.pagamenti.spedizioni.contanti + reportData.pagamenti.spedizioni.pos)
    ],
    [
      'TOTALE',
      formatCurrency(reportData.pagamenti.totali.contanti),
      formatCurrency(reportData.pagamenti.totali.pos),
      formatCurrency(reportData.pagamenti.totali.contanti + reportData.pagamenti.totali.pos)
    ]
  ]
  
  autoTable(doc, {
    startY: yPosition,
    head: [pagamentiData[0]],
    body: pagamentiData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
    didParseCell: function(data: CellHookData) {
      if (data.row.index === pagamentiData.length - 2) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 230, 230]
      }
    }
  })
  
  yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20
  
  // Dettaglio giornaliero
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('DETTAGLIO GIORNALIERO', 20, yPosition)
  yPosition += 15
  
  const giorniData = [
    ['Data', 'Entrate', 'Guadagni', 'Operazioni']
  ]
  
  reportData.giorni.forEach(giorno => {
    giorniData.push([
      formatDate(new Date(giorno.data)),
      formatCurrency(giorno.totaliGiorno.entrate),
      formatCurrency(giorno.totaliGiorno.guadagni),
      giorno.totaliGiorno.operazioni.toString()
    ])
  })
  
  autoTable(doc, {
    startY: yPosition,
    head: [giorniData[0]],
    body: giorniData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 30 }
    }
  })
  
  // Converti in Buffer
  const pdfOutput = doc.output('arraybuffer')
  return Buffer.from(pdfOutput)
}
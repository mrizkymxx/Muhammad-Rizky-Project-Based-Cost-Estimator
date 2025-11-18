import { useState, useEffect, useRef } from 'react'
import { 
  Calculator, 
  Package, 
  Ruler, 
  Droplet, 
  Plus, 
  Trash2, 
  Save, 
  Printer,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Layers,
  Scissors
} from 'lucide-react'

function App() {
  // Project Info
  const [projectName, setProjectName] = useState('Coffee Table Industrial')
  const [projectUnits, setProjectUnits] = useState(10)
  
  // Materials List (Array of materials)
  const [materials, setMaterials] = useState([])
  
  // Add Material Dropdown State
  const [showAddMaterialMenu, setShowAddMaterialMenu] = useState(false)
  
  // Refs for auto-scroll to new cards
  const materialRefs = useRef({})
  const lastAddedMaterialId = useRef(null)
  
  // Hardware/Accessories States
  const [hardwareItems, setHardwareItems] = useState([
    { id: 1, name: '', qty: 1, price: '', perUnit: false }
  ])
  
  // Labor Items States
  const [laborItems, setLaborItems] = useState([
    { id: 1, name: '', costPerUnit: '', perUnit: true }
  ])
  
  // Overhead States
  const [overheadPercent, setOverheadPercent] = useState('5')
  
  // Format currency to IDR
  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }
  
  // Helper function to parse float with comma or dot as decimal separator
  const parseNumber = (value) => {
    console.log('parseNumber - raw input:', value, 'type:', typeof value)
    if (typeof value === 'number') return value
    if (!value || value === '') {
      console.log('parseNumber - empty value, returning 0')
      return 0
    }
    // Convert to string and normalize
    let str = String(value).trim()
    
    // Replace various comma types and special characters
    // iPhone keyboard might send different comma characters
    str = str.replace(/[,،٫]/g, '.') // Regular comma, Arabic comma, Arabic decimal separator
    
    // Remove any non-numeric characters except dot, minus, and plus
    str = str.replace(/[^\d.-]/g, '')
    
    const result = parseFloat(str)
    console.log('parseNumber - normalized:', str, 'result:', result, 'isNaN:', isNaN(result))
    return isNaN(result) ? 0 : result
  }
  
  // Add new material
  const addMaterial = (type) => {
    const newMaterialId = Date.now()
    const newMaterial = {
      id: newMaterialId,
      type: type, // 'panel', 'linear', 'liquid'
      name: '',
      expanded: true,
      data: getDefaultDataByType(type),
      result: null,
      breakdown: []
    }
    setMaterials([...materials, newMaterial])
    setShowAddMaterialMenu(false) // Close menu after adding
    lastAddedMaterialId.current = newMaterialId // Store ID for auto-scroll
  }
  
  // Get default data structure by type
  const getDefaultDataByType = (type) => {
    switch(type) {
      case 'panel':
        return {
          inputMode: 'dimension', // 'dimension' or 'area'
          cutLength: '',
          cutWidth: '',
          directArea: '', // for direct area input (total for all units)
          rawSheetLength: 244,
          rawSheetWidth: 122,
          pricePerSheet: '',
          wastePercent: 10
        }
      case 'linear':
        return {
          inputMode: 'perUnit', // 'perUnit' or 'total'
          lengthPerUnit: '',
          totalLength: '', // for direct total length input
          rawBarLength: 6,
          pricePerUnit: '',
          wastePercent: 5
        }
      case 'liquid':
        return {
          surfaceArea: '',
          numLayers: 2,
          coverage: 10,
          pricePerLiter: '',
          wastePercent: 15
        }
      case 'unit':
        return {
          qtyNeeded: '',
          pricePerUnit: '',
          notes: ''
        }
      case 'fabric':
        return {
          inputMode: 'perUnit', // 'perUnit' or 'total'
          lengthPerUnit: '',
          totalLength: '',
          fabricWidth: 140, // cm
          pricePerMeter: '',
          wastePercent: 15
        }
      default:
        return {}
    }
  }
  
  // Update material
  const updateMaterial = (id, field, value) => {
    setMaterials(prevMaterials => prevMaterials.map(mat => 
      mat.id === id ? { ...mat, [field]: value } : mat
    ))
  }
  
  // Update material data
  const updateMaterialData = (id, field, value) => {
    setMaterials(prevMaterials => prevMaterials.map(mat => 
      mat.id === id ? { 
        ...mat, 
        data: { ...mat.data, [field]: value }
      } : mat
    ))
  }
  
  // Delete material
  const deleteMaterial = (id) => {
    setMaterials(prevMaterials => prevMaterials.filter(mat => mat.id !== id))
  }
  
  // Toggle material expanded
  const toggleMaterialExpanded = (id) => {
    setMaterials(prevMaterials => prevMaterials.map(mat => 
      mat.id === id ? { ...mat, expanded: !mat.expanded } : mat
    ))
  }
  
  // PANEL CALCULATION LOGIC
  const calculatePanel = (material) => {
    const breakdown = []
    const data = material.data
    const rawL = parseNumber(data.rawSheetLength) || 1
    const rawW = parseNumber(data.rawSheetWidth) || 1
    const qty = parseNumber(projectUnits) || 1
    const price = parseNumber(data.pricePerSheet) || 0
    const waste = parseNumber(data.wastePercent) || 0
    
    breakdown.push(`📦 PANEL: ${material.name || 'Unnamed'}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    let totalNetArea
    
    if (data.inputMode === 'dimension') {
      // Mode A: Calculate from dimensions
      const cutL = parseNumber(data.cutLength) || 0
      const cutW = parseNumber(data.cutWidth) || 0
      
      if (cutL === 0 || cutW === 0) {
        return {
          unitsNeeded: 0,
          unitName: 'Lembar',
          totalCost: 0,
          breakdown: ['⚠️ Please enter cut length and width'],
          wasteAmount: 0,
          wasteUnit: 'm²',
          wastePercent: waste
        }
      }
      
      const netArea = (cutL * cutW) / 10000 // cm² to m²
      breakdown.push(`1️⃣ Net Area per Piece: ${cutL} × ${cutW} cm = ${(netArea).toFixed(4)} m²`)
      
      totalNetArea = netArea * qty
      breakdown.push(`2️⃣ Total Net Area (${qty} pcs): ${(netArea).toFixed(4)} × ${qty} = ${totalNetArea.toFixed(4)} m²`)
    } else {
      // Mode B: Direct area input
      console.log('Direct Area Mode - Raw value:', data.directArea)
      totalNetArea = parseNumber(data.directArea) || 0
      console.log('Direct Area Mode - Parsed value:', totalNetArea)
      
      if (totalNetArea === 0) {
        return {
          unitsNeeded: 0,
          unitName: 'Lembar',
          totalCost: 0,
          breakdown: ['⚠️ Please enter total area'],
          wasteAmount: 0,
          wasteUnit: 'm²',
          wastePercent: waste
        }
      }
      
      breakdown.push(`1️⃣ Total Net Area (Direct Input): ${totalNetArea.toFixed(4)} m²`)
      breakdown.push(`   (For ${qty} units total)`)
    }
    
    // Gross area with waste
    const grossArea = totalNetArea * (1 + waste / 100)
    breakdown.push(`${data.inputMode === 'dimension' ? '3️⃣' : '2️⃣'} Gross Area (+${waste}% waste): ${totalNetArea.toFixed(4)} × ${(1 + waste/100).toFixed(2)} = ${grossArea.toFixed(4)} m²`)
    
    // Raw sheet area
    const rawSheetArea = (rawL * rawW) / 10000 // cm² to m²
    breakdown.push(`${data.inputMode === 'dimension' ? '4️⃣' : '3️⃣'} Raw Sheet Area: ${rawL} × ${rawW} cm = ${rawSheetArea.toFixed(4)} m²`)
    
    // Sheets needed (ALWAYS ROUND UP)
    const sheetsNeeded = Math.ceil(grossArea / rawSheetArea)
    breakdown.push(`${data.inputMode === 'dimension' ? '5️⃣' : '4️⃣'} Sheets Needed: ${grossArea.toFixed(4)} ÷ ${rawSheetArea.toFixed(4)} = ${(grossArea / rawSheetArea).toFixed(2)} → ${sheetsNeeded} lembar`)
    
    // Total cost
    const totalCost = sheetsNeeded * price
    breakdown.push(`${data.inputMode === 'dimension' ? '6️⃣' : '5️⃣'} Total Cost: ${sheetsNeeded} × ${formatIDR(price)} = ${formatIDR(totalCost)}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Calculate waste amount
    const actualArea = sheetsNeeded * rawSheetArea
    const wasteArea = actualArea - totalNetArea
    
    return {
      unitsNeeded: sheetsNeeded,
      unitName: 'Lembar',
      totalCost: totalCost,
      breakdown: breakdown,
      wasteAmount: wasteArea.toFixed(4),
      wasteUnit: 'm²',
      wastePercent: waste
    }
  }
  
  // LINEAR CALCULATION LOGIC
  const calculateLinear = (material) => {
    const breakdown = []
    const data = material.data
    const rawBarLength = parseNumber(data.rawBarLength) || 1
    const qty = parseNumber(projectUnits) || 1
    const price = parseNumber(data.pricePerUnit) || 0
    const waste = parseNumber(data.wastePercent) || 0
    
    breakdown.push(`📏 LINEAR: ${material.name || 'Unnamed'}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    let netLength
    
    if (data.inputMode === 'perUnit') {
      // Mode A: Per unit calculation
      const lengthPerUnit = parseNumber(data.lengthPerUnit) || 0
      netLength = lengthPerUnit * qty
      breakdown.push(`1️⃣ Total Net Length: ${lengthPerUnit} m × ${qty} pcs = ${netLength.toFixed(2)} m`)
    } else {
      // Mode B: Direct total length
      netLength = parseNumber(data.totalLength) || 0
      breakdown.push(`1️⃣ Total Net Length (Direct Input): ${netLength.toFixed(2)} m`)
      breakdown.push(`   (For ${qty} units total)`)
    }
    
    // Gross length with waste
    const grossLength = netLength * (1 + waste / 100)
    breakdown.push(`2️⃣ Gross Length (+${waste}% waste): ${netLength.toFixed(2)} × ${(1 + waste/100).toFixed(2)} = ${grossLength.toFixed(2)} m`)
    
    let unitsNeeded, totalCost, unitName
    
    if (rawBarLength === 1) {
      // Meter Run - Buy per meter
      unitsNeeded = Math.ceil(grossLength)
      unitName = 'Meter'
      breakdown.push(`3️⃣ Mode: Meter Run (buy per meter)`)
      breakdown.push(`4️⃣ Meters Needed: ${grossLength.toFixed(2)} m → ${unitsNeeded} m`)
      totalCost = unitsNeeded * price
      breakdown.push(`5️⃣ Total Cost: ${unitsNeeded} × ${formatIDR(price)} = ${formatIDR(totalCost)}`)
    } else {
      // Bar/Roll - Buy per bar
      unitsNeeded = Math.ceil(grossLength / rawBarLength)
      unitName = 'Batang'
      breakdown.push(`3️⃣ Mode: Bar/Roll (buy per bar)`)
      breakdown.push(`4️⃣ Bars Needed: ${grossLength.toFixed(2)} ÷ ${rawBarLength} = ${(grossLength / rawBarLength).toFixed(2)} → ${unitsNeeded} batang`)
      totalCost = unitsNeeded * price
      breakdown.push(`5️⃣ Total Cost: ${unitsNeeded} × ${formatIDR(price)} = ${formatIDR(totalCost)}`)
      
      const totalLengthBought = unitsNeeded * rawBarLength
      const leftover = totalLengthBought - grossLength
      breakdown.push(`📦 Total Bought: ${unitsNeeded} × ${rawBarLength} m = ${totalLengthBought.toFixed(2)} m`)
      breakdown.push(`♻️ Leftover: ${leftover.toFixed(2)} m`)
    }
    
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Calculate waste
    const wasteLength = grossLength - netLength
    
    return {
      unitsNeeded: unitsNeeded,
      unitName: unitName,
      totalCost: totalCost,
      breakdown: breakdown,
      wasteAmount: wasteLength.toFixed(2),
      wasteUnit: 'm',
      wastePercent: waste
    }
  }
  
  // LIQUID CALCULATION LOGIC
  const calculateLiquid = (material) => {
    const breakdown = []
    const data = material.data
    const surfaceArea = parseNumber(data.surfaceArea) || 0
    const numLayers = parseNumber(data.numLayers) || 1
    const coverage = parseNumber(data.coverage) || 1
    const qty = parseNumber(projectUnits) || 1
    const price = parseNumber(data.pricePerLiter) || 0
    const waste = parseNumber(data.wastePercent) || 0
    
    breakdown.push(`💧 LIQUID: ${material.name || 'Unnamed'}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Total area to paint
    const totalArea = surfaceArea * numLayers * qty
    breakdown.push(`1️⃣ Total Area: ${surfaceArea} m² × ${numLayers} layers × ${qty} pcs = ${totalArea.toFixed(2)} m²`)
    
    // Liters needed (net)
    const netLiters = totalArea / coverage
    breakdown.push(`2️⃣ Net Liters: ${totalArea.toFixed(2)} ÷ ${coverage} m²/L = ${netLiters.toFixed(2)} L`)
    
    // Gross liters with waste
    const grossLiters = netLiters * (1 + waste / 100)
    breakdown.push(`3️⃣ Gross Liters (+${waste}% waste): ${netLiters.toFixed(2)} × ${(1 + waste/100).toFixed(2)} = ${grossLiters.toFixed(2)} L`)
    
    // Round up for buying
    const litersNeeded = Math.ceil(grossLiters)
    breakdown.push(`4️⃣ Liters to Buy: ${grossLiters.toFixed(2)} L → ${litersNeeded} L`)
    
    // Total cost
    const totalCost = litersNeeded * price
    breakdown.push(`5️⃣ Total Cost: ${litersNeeded} × ${formatIDR(price)} = ${formatIDR(totalCost)}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Calculate waste
    const wasteLiters = grossLiters - netLiters
    
    return {
      unitsNeeded: litersNeeded,
      unitName: 'Liter',
      totalCost: totalCost,
      breakdown: breakdown,
      wasteAmount: wasteLiters.toFixed(2),
      wasteUnit: 'L',
      wastePercent: waste
    }
  }
  
  // UNIT CALCULATION LOGIC (for simple unit-based materials like Busa)
  const calculateUnit = (material) => {
    const breakdown = []
    const data = material.data
    const qtyNeeded = parseNumber(data.qtyNeeded) || 0
    const price = parseNumber(data.pricePerUnit) || 0
    
    breakdown.push(`📦 UNIT: ${material.name || 'Unnamed'}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    breakdown.push(`1️⃣ Quantity Needed: ${qtyNeeded} unit(s)`)
    
    if (data.notes) {
      breakdown.push(`📝 Notes: ${data.notes}`)
    }
    
    const totalCost = qtyNeeded * price
    breakdown.push(`2️⃣ Total Cost: ${qtyNeeded} × ${formatIDR(price)} = ${formatIDR(totalCost)}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    return {
      unitsNeeded: qtyNeeded,
      unitName: 'Unit',
      totalCost: totalCost,
      breakdown: breakdown
    }
  }
  
  // FABRIC CALCULATION LOGIC (for fabric/kain)
  const calculateFabric = (material) => {
    const breakdown = []
    const data = material.data
    const qty = parseNumber(projectUnits) || 1
    const price = parseNumber(data.pricePerMeter) || 0
    const waste = parseNumber(data.wastePercent) || 0
    const fabricWidth = parseNumber(data.fabricWidth) || 0
    
    breakdown.push(`🧵 FABRIC: ${material.name || 'Unnamed'}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    if (fabricWidth > 0) {
      breakdown.push(`📏 Fabric Width: ${fabricWidth} cm`)
    }
    
    let netLength
    
    if (data.inputMode === 'perUnit') {
      // Mode A: Per unit calculation
      const lengthPerUnit = parseNumber(data.lengthPerUnit) || 0
      netLength = lengthPerUnit * qty
      breakdown.push(`1️⃣ Net Length: ${lengthPerUnit} m/unit × ${qty} units = ${netLength.toFixed(2)} m`)
    } else {
      // Mode B: Direct total length
      netLength = parseNumber(data.totalLength) || 0
      breakdown.push(`1️⃣ Net Length (Direct Input): ${netLength.toFixed(2)} m`)
      breakdown.push(`   (For ${qty} units total)`)
    }
    
    // Gross length with waste
    const grossLength = netLength * (1 + waste / 100)
    breakdown.push(`2️⃣ Gross Length (+${waste}% waste): ${netLength.toFixed(2)} × ${(1 + waste/100).toFixed(2)} = ${grossLength.toFixed(2)} m`)
    
    // Round up to nearest meter (fabric stores sell per meter)
    const metersNeeded = Math.ceil(grossLength)
    breakdown.push(`3️⃣ Meters to Buy: ${grossLength.toFixed(2)} m → Rounded UP to ${metersNeeded} m`)
    breakdown.push(`   (Fabric stores sell per whole meter)`)
    
    // Total cost
    const totalCost = metersNeeded * price
    breakdown.push(`4️⃣ Total Cost: ${metersNeeded} m × ${formatIDR(price)}/m = ${formatIDR(totalCost)}`)
    breakdown.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    
    // Calculate waste
    const wasteLength = grossLength - netLength
    
    return {
      unitsNeeded: metersNeeded,
      unitName: 'Meter',
      totalCost: totalCost,
      breakdown: breakdown,
      wasteAmount: wasteLength.toFixed(2),
      wasteUnit: 'm',
      wastePercent: waste
    }
  }
  
  // Calculate material and update (fixed with functional state update)
  const calculateMaterial = (material) => {
    let result
    switch(material.type) {
      case 'panel':
        result = calculatePanel(material)
        break
      case 'linear':
        result = calculateLinear(material)
        break
      case 'liquid':
        result = calculateLiquid(material)
        break
      case 'unit':
        result = calculateUnit(material)
        break
      case 'fabric':
        result = calculateFabric(material)
        break
      default:
        result = { unitsNeeded: 0, unitName: '', totalCost: 0, breakdown: [] }
    }
    
    // Use functional update to avoid stale closure
    setMaterials(prevMaterials => prevMaterials.map(mat => 
      mat.id === material.id ? { 
        ...mat, 
        result: result,
        breakdown: result.breakdown
      } : mat
    ))
  }
  
  // Recalculate all materials when project units change
  useEffect(() => {
    materials.forEach(material => {
      calculateMaterial(material)
    })
  }, [projectUnits])
  
  // Auto-scroll to newly added material card
  useEffect(() => {
    if (lastAddedMaterialId.current && materialRefs.current[lastAddedMaterialId.current]) {
      const element = materialRefs.current[lastAddedMaterialId.current]
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center'
      })
      lastAddedMaterialId.current = null // Reset after scrolling
    }
  }, [materials])
  
  // Handle print with dynamic filename based on project name
  useEffect(() => {
    const handleBeforePrint = () => {
      const originalTitle = document.title
      document.title = `HPP ${projectName || 'Project'}`
      
      // Restore original title after print dialog closes
      const handleAfterPrint = () => {
        document.title = originalTitle
      }
      
      window.addEventListener('afterprint', handleAfterPrint, { once: true })
    }
    
    window.addEventListener('beforeprint', handleBeforePrint)
    
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint)
    }
  }, [projectName])
  
  // Add inputMode to all number inputs for mobile numeric keyboard
  useEffect(() => {
    const addInputMode = () => {
      const numberInputs = document.querySelectorAll('input[type="number"]')
      numberInputs.forEach(input => {
        if (!input.hasAttribute('inputmode')) {
          input.setAttribute('inputmode', 'decimal')
        }
      })
    }
    
    // Run on mount and when materials change
    addInputMode()
    
    // Also run after a short delay to catch dynamically added inputs
    const timer = setTimeout(addInputMode, 100)
    
    return () => clearTimeout(timer)
  }, [materials, hardwareItems, laborItems])
  
  // Hardware functions
  const addHardwareItem = () => {
    setHardwareItems([...hardwareItems, { 
      id: Date.now(), 
      name: '', 
      qty: 1, 
      price: '',
      perUnit: false
    }])
  }
  
  const removeHardwareItem = (id) => {
    if (hardwareItems.length > 1) {
      setHardwareItems(hardwareItems.filter(item => item.id !== id))
    }
  }
  
  const updateHardwareItem = (id, field, value) => {
    setHardwareItems(hardwareItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  // Labor functions
  const addLaborItem = () => {
    setLaborItems([...laborItems, { 
      id: Date.now(), 
      name: '', 
      costPerUnit: '',
      perUnit: true
    }])
  }
  
  const removeLaborItem = (id) => {
    if (laborItems.length > 1) {
      setLaborItems(laborItems.filter(item => item.id !== id))
    }
  }
  
  const updateLaborItem = (id, field, value) => {
    setLaborItems(laborItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }
  
  // Calculate totals
  const calculateTotals = () => {
    const materialCost = materials.reduce((sum, mat) => {
      return sum + (mat.result?.totalCost || 0)
    }, 0)
    
    const hardwareCost = hardwareItems.reduce((sum, item) => {
      const qty = parseNumber(item.qty) || 0
      const price = parseNumber(item.price) || 0
      const multiplier = item.perUnit ? projectUnits : 1
      return sum + (qty * price * multiplier)
    }, 0)
    
    const labor = laborItems.reduce((sum, item) => {
      const cost = parseNumber(item.costPerUnit) || 0
      const multiplier = item.perUnit ? projectUnits : 1
      return sum + (cost * multiplier)
    }, 0)
    
    const subtotal = materialCost + hardwareCost + labor
    
    const overhead = (parseNumber(overheadPercent) || 0) / 100 * subtotal
    
    const grandTotal = subtotal + overhead
    const hppPerUnit = grandTotal / projectUnits
    
    return {
      materialCost,
      hardwareCost,
      labor,
      subtotal,
      overhead,
      grandTotal,
      hppPerUnit
    }
  }
  
  const totals = calculateTotals()
  
  // Save to LocalStorage
  const saveToHistory = () => {
    const saveData = {
      timestamp: new Date().toISOString(),
      projectName,
      projectUnits,
      materials,
      hardwareItems,
      laborItems,
      overheadPercent,
      totals
    }
    
    const history = JSON.parse(localStorage.getItem('hppHistory') || '[]')
    history.unshift(saveData)
    
    if (history.length > 10) {
      history.pop()
    }
    
    localStorage.setItem('hppHistory', JSON.stringify(history))
    alert('✅ Perhitungan berhasil disimpan ke History!')
  }
  
  // Print to PDF
  const printToPDF = () => {
    window.print()
  }
  
  // Get type icon
  const getTypeIcon = (type) => {
    switch(type) {
      case 'panel': return <Package className="w-5 h-5" />
      case 'linear': return <Ruler className="w-5 h-5" />
      case 'liquid': return <Droplet className="w-5 h-5" />
      case 'unit': return <Layers className="w-5 h-5" />
      case 'fabric': return <Scissors className="w-5 h-5" />
      default: return <Layers className="w-5 h-5" />
    }
  }
  
  // Get type color
  const getTypeColor = (type) => {
    switch(type) {
      case 'panel': return 'slate'
      case 'linear': return 'emerald'
      case 'liquid': return 'amber'
      case 'unit': return 'indigo'
      case 'fabric': return 'rose'
      default: return 'gray'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6 print-section">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-l-4 border-blue-600">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Muhammad Rizky</h1>
                <p className="text-xs sm:text-sm text-gray-600">Project-Based Cost Estimator</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={saveToHistory}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition no-print"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </button>
              <button 
                onClick={printToPDF}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition no-print"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="max-w-7xl mx-auto mb-4 sm:mb-6 print-only-summary">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Project Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="e.g., Coffee Table Industrial"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity (Units)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={projectUnits}
                onChange={(e) => setProjectUnits(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="e.g., 10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* LEFT SIDE - Materials & Inputs */}
        <div className="space-y-4 sm:space-y-6 print-only-summary">
          
          {/* Materials Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 print-section">
            <div className="flex items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Materials
              </h3>
            </div>
            
            {materials.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Layers className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No materials added yet. Click "Add Material" to start.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    projectUnits={projectUnits}
                    onUpdate={updateMaterial}
                    onUpdateData={updateMaterialData}
                    onDelete={deleteMaterial}
                    onToggleExpanded={toggleMaterialExpanded}
                    onCalculate={calculateMaterial}
                    formatIDR={formatIDR}
                    getTypeIcon={getTypeIcon}
                    getTypeColor={getTypeColor}
                    cardRef={(el) => materialRefs.current[material.id] = el}
                  />
                ))}
              </div>
            )}

            {/* Add Material Button - Moved to Bottom */}
            <div className="relative mt-4">
              <button 
                onClick={() => setShowAddMaterialMenu(!showAddMaterialMenu)}
                className="w-full px-3 sm:px-4 py-3 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition no-print flex items-center justify-center gap-2 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Add Material</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showAddMaterialMenu && (
                <>
                  {/* Backdrop to close menu when clicking outside */}
                  <div 
                    className="fixed inset-0 z-10 no-print"
                    onClick={() => setShowAddMaterialMenu(false)}
                  />
                  <div className="absolute left-0 bottom-full mb-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 z-20 no-print overflow-hidden">
                    <button
                      onClick={() => addMaterial('panel')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-sm transition"
                    >
                      <Package className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Panel</div>
                        <div className="text-xs text-gray-500">Plywood, MDF, HPL</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addMaterial('linear')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-sm transition border-t"
                    >
                      <Ruler className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Linear</div>
                        <div className="text-xs text-gray-500">Kayu, Besi, Pipa</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addMaterial('fabric')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-sm transition border-t"
                    >
                      <Scissors className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Fabric/Kain</div>
                        <div className="text-xs text-gray-500">Canvas, Upholstery</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addMaterial('liquid')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-sm transition border-t"
                    >
                      <Droplet className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Liquid</div>
                        <div className="text-xs text-gray-500">Cat, Thinner, Lem</div>
                      </div>
                    </button>
                    <button
                      onClick={() => addMaterial('unit')}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 flex items-center gap-2 text-sm transition border-t"
                    >
                      <Layers className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Unit/Piece</div>
                        <div className="text-xs text-gray-500">Busa, Kaleng, dll</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hardware/Accessories Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 print-section">
            <div className="flex items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Hardware / Accessories
              </h3>
            </div>
            
            <div className="space-y-2">
              {hardwareItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateHardwareItem(item.id, 'name', e.target.value)}
                    placeholder="Item Name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.qty}
                    onChange={(e) => updateHardwareItem(item.id, 'qty', e.target.value)}
                    placeholder="Qty"
                    className="w-full sm:w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.price}
                    onChange={(e) => updateHardwareItem(item.id, 'price', e.target.value)}
                    placeholder="Price"
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.perUnit}
                        onChange={(e) => updateHardwareItem(item.id, 'perUnit', e.target.checked)}
                        className="rounded"
                      />
                      Per Unit
                    </label>
                    <button
                      onClick={() => removeHardwareItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition no-print"
                      disabled={hardwareItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Hardware Button - Moved to Bottom */}
            <button
              onClick={addHardwareItem}
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-3 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition no-print font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Hardware</span>
            </button>
          </div>

          {/* Labor & Overhead Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 print-section">
            <div className="flex items-center mb-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Labor Cost
              </h3>
            </div>
            
            <div className="space-y-2">
              {laborItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateLaborItem(item.id, 'name', e.target.value)}
                    placeholder="Labor Name (e.g., Assembly, Finishing)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={item.costPerUnit}
                    onChange={(e) => updateLaborItem(item.id, 'costPerUnit', e.target.value)}
                    placeholder="Cost"
                    className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={item.perUnit}
                        onChange={(e) => updateLaborItem(item.id, 'perUnit', e.target.checked)}
                        className="rounded"
                      />
                      Per Unit
                    </label>
                    <button
                      onClick={() => removeLaborItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition no-print"
                      disabled={laborItems.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Labor Button */}
            <button
              onClick={addLaborItem}
              className="w-full mt-4 flex items-center justify-center gap-2 px-3 py-3 bg-slate-600 text-white text-sm rounded-lg hover:bg-slate-700 transition no-print font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Add Labor</span>
            </button>
          </div>

          {/* Overhead Section */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 print-section">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Overhead</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Overhead (%)
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={overheadPercent}
                onChange={(e) => setOverheadPercent(e.target.value)}
                placeholder="e.g., 5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Applied to subtotal</p>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE - Results & Summary */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Grand Total Summary */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 print-section lg:sticky lg:top-4">
            
            {/* Project Info for Print Only */}
            <div className="hidden print:block mb-6 pb-4 border-b-2 border-gray-300">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">HPP Calculator Report</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Project:</span>
                  <span className="ml-2 text-gray-900">{projectName}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Quantity:</span>
                  <span className="ml-2 text-gray-900">{projectUnits} units</span>
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">{new Date().toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 print:hidden">
              <Calculator className="w-5 h-5" />
              HPP Summary
            </h3>
            
            <div className="space-y-3">
              {/* Material Cost */}
              <div className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">Material Cost</span>
                  <span className="text-sm sm:text-base text-gray-900 font-bold">
                    {formatIDR(totals.materialCost)}
                  </span>
                </div>
              </div>
              
              {materials.length > 0 && (
                <div className="text-xs text-gray-600 pl-4 -mt-2 space-y-2 mb-3">
                  {materials.map(mat => mat.result && (
                    <div key={mat.id} className="border-b border-gray-100 pb-1.5">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-700">{mat.name || 'Unnamed'}</div>
                          <div className="text-gray-500 text-xs">
                            {mat.result.unitsNeeded} {mat.result.unitName} × {formatIDR(mat.result.totalCost / mat.result.unitsNeeded)}
                          </div>
                          {mat.result.wastePercent > 0 && (
                            <div className="text-amber-600 text-xs mt-0.5">
                              Waste Allowance ({mat.result.wastePercent}%)
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-800">{formatIDR(mat.result.totalCost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Hardware Cost */}
              <div className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">Hardware/Accessories</span>
                  <span className="text-sm sm:text-base text-gray-900 font-bold">
                    {formatIDR(totals.hardwareCost)}
                  </span>
                </div>
              </div>
              
              {hardwareItems.length > 0 && hardwareItems.some(item => item.name && item.price) && (
                <div className="text-xs text-gray-600 pl-4 -mt-2 space-y-2 mb-3">
                  {hardwareItems.map(item => {
                    if (!item.name || !item.price) return null
                    const qty = parseFloat(item.qty) || 1
                    const price = parseFloat(item.price) || 0
                    const multiplier = item.perUnit ? projectUnits : 1
                    const totalQty = qty * multiplier
                    const totalCost = totalQty * price
                    
                    return (
                      <div key={item.id} className="border-b border-gray-100 pb-1.5">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-gray-700">{item.name}</div>
                            <div className="text-gray-500 text-xs">
                              {totalQty} pcs × {formatIDR(price)}
                              {item.perUnit && <span className="text-amber-600 ml-1">(per unit)</span>}
                            </div>
                          </div>
                          <span className="font-semibold text-gray-800">{formatIDR(totalCost)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Labor Cost */}
              <div className="pb-2 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700 font-medium">Labor Cost</span>
                  <span className="text-sm sm:text-base text-gray-900 font-bold">
                    {formatIDR(totals.labor)}
                  </span>
                </div>
                {laborItems.filter(item => item.costPerUnit > 0).map(item => (
                  <div key={item.id} className="flex justify-between items-center mt-1 pl-3">
                    <span className="text-xs text-gray-600">
                      {item.name}: {formatIDR(item.costPerUnit)}{item.perUnit && ' (per unit)'}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatIDR(item.perUnit ? item.costPerUnit * projectUnits : item.costPerUnit)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Subtotal */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                <span className="text-sm text-gray-700 font-semibold">Subtotal</span>
                <span className="text-sm sm:text-base text-gray-900 font-bold">
                  {formatIDR(totals.subtotal)}
                </span>
              </div>
              
              {/* Overhead */}
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="text-sm text-gray-700 font-medium">
                  Overhead ({overheadPercent || 0}%)
                </span>
                <span className="text-sm sm:text-base text-gray-900 font-bold">
                  {formatIDR(totals.overhead)}
                </span>
              </div>
              
              {/* GRAND TOTAL */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-3 border-t-4 border-blue-600 bg-blue-50 p-3 sm:p-4 rounded-lg mt-3">
                <div>
                  <div className="text-blue-900 font-bold text-lg sm:text-xl">GRAND TOTAL HPP</div>
                  <div className="text-xs text-blue-700 mt-1">for {projectUnits} units</div>
                </div>
                <span className="text-blue-900 font-bold text-xl sm:text-2xl">
                  {formatIDR(totals.grandTotal)}
                </span>
              </div>
              
              {/* HPP PER UNIT */}
              <div className="flex justify-between items-center bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                <span className="text-green-900 font-bold text-sm sm:text-base">HPP per Unit</span>
                <span className="text-green-900 font-bold text-lg sm:text-xl">
                  {formatIDR(totals.hppPerUnit)}
                </span>
              </div>
            </div>
          </div>

          {/* Developer Watermark */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-3 sm:p-4 border border-blue-200 no-print">
            <div className="flex items-center justify-center gap-3">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="#3B82F6" opacity="0.1"/>
                <path d="M30 50L45 65L70 35" stroke="#3B82F6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="50" cy="50" r="35" stroke="#3B82F6" strokeWidth="3" strokeDasharray="5 5"/>
              </svg>
              <div className="text-left">
                <p className="text-sm sm:text-base font-bold text-gray-800">
                  Developed by Muhammad Rizky
                </p>
                <p className="text-xs text-gray-600">
                  Furniture HPP Calculator • Work in Progress
                </p>
              </div>
            </div>
          </div>

        </div>
        
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-6 text-center text-xs sm:text-sm text-gray-600 no-print">
        <p>© 2025 Muhammad Rizky | Project-Based Edition</p>
      </div>
    </div>
  )
}

// Material Card Component
function MaterialCard({ 
  material, 
  projectUnits,
  onUpdate, 
  onUpdateData, 
  onDelete, 
  onToggleExpanded, 
  onCalculate,
  formatIDR,
  getTypeIcon,
  getTypeColor,
  cardRef
}) {
  const color = getTypeColor(material.type)
  const colorClasses = {
    slate: 'border-gray-300 bg-gray-50',
    emerald: 'border-gray-300 bg-gray-50',
    amber: 'border-gray-300 bg-gray-50',
    indigo: 'border-gray-300 bg-gray-50',
    rose: 'border-gray-300 bg-gray-50',
    gray: 'border-gray-300 bg-gray-50'
  }
  
  const headerColors = {
    slate: 'bg-gray-700 text-white',
    emerald: 'bg-gray-600 text-white',
    amber: 'bg-gray-700 text-white',
    indigo: 'bg-gray-600 text-white',
    rose: 'bg-gray-700 text-white',
    gray: 'bg-gray-600 text-white'
  }

  return (
    <div ref={cardRef} className={`border-2 rounded-lg overflow-hidden ${colorClasses[color]}`}>
      {/* Card Header */}
      <div className={`${headerColors[color]} p-3 flex items-center justify-between cursor-pointer`}
           onClick={() => onToggleExpanded(material.id)}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getTypeIcon(material.type)}
          <input
            type="text"
            value={material.name}
            onChange={(e) => {
              e.stopPropagation()
              onUpdate(material.id, 'name', e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={`${material.type.toUpperCase()} Material Name`}
            className="flex-1 min-w-0 px-2 py-1 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 rounded border-0 focus:ring-2 focus:ring-white/50 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {material.result && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded hidden sm:inline">
              {material.result.unitsNeeded} {material.result.unitName}
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(material.id)
            }}
            className="p-1 hover:bg-white/20 rounded no-print"
          >
            <X className="w-4 h-4" />
          </button>
          {material.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      
      {/* Card Content */}
      {material.expanded && (
        <div className="p-3 sm:p-4 bg-white space-y-3">
          
          {/* PANEL Form */}
          {material.type === 'panel' && (
            <>
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'dimension')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'dimension'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📐 By Dimension
                </button>
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'area')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'area'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📏 Direct Area (m²)
                </button>
              </div>

              {material.data.inputMode === 'dimension' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cut Length (cm)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={material.data.cutLength}
                        onChange={(e) => onUpdateData(material.id, 'cutLength', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 120"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cut Width (cm)</label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={material.data.cutWidth}
                        onChange={(e) => onUpdateData(material.id, 'cutWidth', e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 60"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Total Area (m²) <span className="text-blue-600">for {projectUnits} units</span>
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9]*[.,]?[0-9]*"
                      value={material.data.directArea}
                      onChange={(e) => onUpdateData(material.id, 'directArea', e.target.value)}
                      onBlur={(e) => {
                        // Normalize on blur to replace comma with dot for display
                        const normalized = e.target.value.replace(',', '.')
                        if (normalized !== e.target.value) {
                          onUpdateData(material.id, 'directArea', normalized)
                        }
                      }}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. 6.5"
                    />
                    <p className="text-xs text-gray-500 mt-1">Input total area needed for all {projectUnits} units</p>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Raw Length (cm)</label>
                  <input
                    type="number"
                    value={material.data.rawSheetLength}
                    onChange={(e) => onUpdateData(material.id, 'rawSheetLength', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Raw Width (cm)</label>
                  <input
                    type="number"
                    value={material.data.rawSheetWidth}
                    onChange={(e) => onUpdateData(material.id, 'rawSheetWidth', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/Sheet (Rp)</label>
                  <input
                    type="number"
                    value={material.data.pricePerSheet}
                    onChange={(e) => onUpdateData(material.id, 'pricePerSheet', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 250000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Waste (%)</label>
                  <input
                    type="number"
                    value={material.data.wastePercent}
                    onChange={(e) => onUpdateData(material.id, 'wastePercent', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* LINEAR Form */}
          {material.type === 'linear' && (
            <>
              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'perUnit')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'perUnit'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📐 Per Unit
                </button>
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'total')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'total'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📏 Total Length (m)
                </button>
              </div>

              {material.data.inputMode === 'perUnit' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Length/Unit (m)</label>
                    <input
                      type="number"
                      value={material.data.lengthPerUnit}
                      onChange={(e) => onUpdateData(material.id, 'lengthPerUnit', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. 4"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Raw Bar Length (m)</label>
                    <input
                      type="number"
                      value={material.data.rawBarLength}
                      onChange={(e) => onUpdateData(material.id, 'rawBarLength', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Set 1 for Meter Run</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Total Length (m) <span className="text-green-600">for {projectUnits} units</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={material.data.totalLength}
                      onChange={(e) => onUpdateData(material.id, 'totalLength', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                      placeholder="e.g. 70"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total net length for all {projectUnits} units</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Raw Bar Length (m)</label>
                    <input
                      type="number"
                      value={material.data.rawBarLength}
                      onChange={(e) => onUpdateData(material.id, 'rawBarLength', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Set 1 for Meter Run</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/Unit (Rp)</label>
                  <input
                    type="number"
                    value={material.data.pricePerUnit}
                    onChange={(e) => onUpdateData(material.id, 'pricePerUnit', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. 45000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Waste (%)</label>
                  <input
                    type="number"
                    value={material.data.wastePercent}
                    onChange={(e) => onUpdateData(material.id, 'wastePercent', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* LIQUID Form */}
          {material.type === 'liquid' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Surface (m²)</label>
                  <input
                    type="number"
                    value={material.data.surfaceArea}
                    onChange={(e) => onUpdateData(material.id, 'surfaceArea', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Layers</label>
                  <input
                    type="number"
                    value={material.data.numLayers}
                    onChange={(e) => onUpdateData(material.id, 'numLayers', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Coverage (m²/L)</label>
                  <input
                    type="number"
                    value={material.data.coverage}
                    onChange={(e) => onUpdateData(material.id, 'coverage', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/Liter (Rp)</label>
                  <input
                    type="number"
                    value={material.data.pricePerLiter}
                    onChange={(e) => onUpdateData(material.id, 'pricePerLiter', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. 125000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Waste (%)</label>
                  <input
                    type="number"
                    value={material.data.wastePercent}
                    onChange={(e) => onUpdateData(material.id, 'wastePercent', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* UNIT Form */}
          {material.type === 'unit' && (
            <>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-700">
                  <strong>💡 Unit/Piece Mode:</strong> For simple materials sold per unit/piece/lembar 
                  without complex conversion. Example: Busa (2.5 lembar → round to 3), Kaleng Cat, etc.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Quantity Needed
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={material.data.qtyNeeded}
                    onChange={(e) => onUpdateData(material.id, 'qtyNeeded', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. 3"
                  />
                  <p className="text-xs text-gray-500 mt-1">Manual input (already rounded)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/Unit (Rp)</label>
                  <input
                    type="number"
                    value={material.data.pricePerUnit}
                    onChange={(e) => onUpdateData(material.id, 'pricePerUnit', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. 180000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={material.data.notes}
                  onChange={(e) => onUpdateData(material.id, 'notes', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g. 0.5 × 5 = 2.5 → rounded to 3"
                />
              </div>
            </>
          )}
          
          {/* FABRIC Form */}
          {material.type === 'fabric' && (
            <>
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-700">
                  <strong>🧵 Fabric/Kain Mode:</strong> Specially designed for fabric calculations with 
                  high waste percentage and per-meter rounding (toko kain jual per meter utuh).
                </p>
              </div>

              {/* Input Mode Toggle */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'perUnit')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'perUnit'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📐 Per Unit
                </button>
                <button
                  onClick={() => onUpdateData(material.id, 'inputMode', 'total')}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition ${
                    material.data.inputMode === 'total'
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📏 Total Length (m)
                </button>
              </div>

              {material.data.inputMode === 'perUnit' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Length/Unit (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={material.data.lengthPerUnit}
                      onChange={(e) => onUpdateData(material.id, 'lengthPerUnit', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. 3.2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fabric Width (cm)</label>
                    <input
                      type="number"
                      value={material.data.fabricWidth}
                      onChange={(e) => onUpdateData(material.id, 'fabricWidth', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. 140"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Optional (for reference)</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Total Length (m) <span className="text-pink-600">for {projectUnits} units</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={material.data.totalLength}
                      onChange={(e) => onUpdateData(material.id, 'totalLength', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. 16"
                    />
                    <p className="text-xs text-gray-500 mt-1">Total net length for all {projectUnits} units</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fabric Width (cm)</label>
                    <input
                      type="number"
                      value={material.data.fabricWidth}
                      onChange={(e) => onUpdateData(material.id, 'fabricWidth', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                      placeholder="e.g. 140"
                    />
                    <p className="text-xs text-gray-500 mt-0.5">Optional (for reference)</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Price/Meter (Rp)</label>
                  <input
                    type="number"
                    value={material.data.pricePerMeter}
                    onChange={(e) => onUpdateData(material.id, 'pricePerMeter', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g. 90000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Waste (%)</label>
                  <input
                    type="number"
                    value={material.data.wastePercent}
                    onChange={(e) => onUpdateData(material.id, 'wastePercent', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-pink-500"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">Typical: 10-20% for fabrics</p>
                </div>
              </div>
            </>
          )}
          
          {/* Calculate Button */}
          <button
            onClick={() => onCalculate(material)}
            className={`w-full py-2 ${headerColors[color]} rounded-lg hover:opacity-90 transition text-sm font-medium`}
          >
            Calculate
          </button>
          
          {/* Result Display */}
          {material.result && (
            <div className={`border-2 ${colorClasses[color]} rounded-lg p-3`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-800">Result:</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatIDR(material.result.totalCost)}
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Need to buy: <strong>{material.result.unitsNeeded} {material.result.unitName}</strong>
              </div>
            </div>
          )}
          
          {/* Math Breakdown */}
          {material.breakdown && material.breakdown.length > 0 && (
            <details className="bg-slate-800 text-white rounded-lg p-3 text-xs">
              <summary className="cursor-pointer font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Math Breakdown
              </summary>
              <div className="font-mono space-y-0.5 mt-2 overflow-auto max-h-60">
                {material.breakdown.map((line, index) => (
                  <div key={index} className={`${line.includes('━') ? 'text-slate-500' : ''}`}>
                    {line}
                  </div>
                ))}
              </div>
            </details>
          )}
          
        </div>
      )}
    </div>
  )
}

export default App

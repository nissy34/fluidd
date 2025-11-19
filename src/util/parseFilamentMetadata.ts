/**
 * Parses G-code file content to extract filament metadata from slicer comments
 *
 * This parser scans the first 500 lines of G-code looking for common slicer
 * comment formats (PrusaSlicer, SuperSlicer, OrcaSlicer, BambuStudio, etc.)
 */

export interface FilamentMetadata {
  extruders: ExtruderMetadata[]
  hasMetadata: boolean
  printTime?: string          // Estimated print time like "6h 38m"
  totalFilamentGrams?: number // Total filament usage in grams
  totalFilamentCost?: number  // Total filament cost
}

export interface ExtruderMetadata {
  index: number           // G-code extruder index (0, 1, 2, 3)
  color: string | null    // Hex color like "#FF0000" or null if not found
  type: string | null     // Material type like "PLA", "PETG", "ABS" or null
  usageGrams: number | null  // Filament usage in grams or null
  vendor?: string | null  // Vendor/manufacturer name if available
}

/**
 * Parse filament metadata from G-code content
 * Scans first 500 lines for slicer comments containing filament information
 *
 * @param gcodeContent - Full G-code file content as string
 * @returns FilamentMetadata with array of extruders and hasMetadata flag
 */
export function parseFilamentMetadata (gcodeContent: string): FilamentMetadata {
  const lines = gcodeContent.split('\n')

  const colors: string[] = []
  const types: string[] = []
  const usages: number[] = []
  let printTime: string | undefined
  let totalFilamentGrams: number | undefined
  let totalFilamentCost: number | undefined

  // Scan for slicer comment patterns (check both beginning and end of file)
  const linesToCheck = [
    ...lines.slice(0, 500),  // First 500 lines
    ...lines.slice(-1000)     // Last 1000 lines (where metadata usually is)
  ]

  for (const line of linesToCheck) {
    const trimmed = line.trim()

    // OrcaSlicer/BambuStudio format (semicolon-separated)
    // ; filament_colour = #C0C0C0;#FFFF00;#FF0000;#00FF00
    if (trimmed.startsWith('; filament_colour =')) {
      const match = trimmed.match(/; filament_colour\s*=\s*(.+)/)
      if (match) {
        const colorList = match[1].split(';').map(c => c.trim())
        colors.push(...colorList)
      }
    }

    // ; filament_type = PLA;PETG;ABS;TPU
    if (trimmed.startsWith('; filament_type =')) {
      const match = trimmed.match(/; filament_type\s*=\s*(.+)/)
      if (match) {
        const typeList = match[1].split(';').map(t => t.trim())
        types.push(...typeList)
      }
    }

    // ; filament used [g] = 22.62, 16.47, 21.67, 22.01
    if (trimmed.includes('filament used [g]')) {
      const match = trimmed.match(/filament used \[g\]\s*=\s*(.+)/)
      if (match) {
        const usageList = match[1].split(',').map(u => parseFloat(u.trim()))
        usages.push(...usageList)
      }
    }

    // ; total filament used [g] = 127.78
    if (trimmed.includes('total filament used [g]')) {
      const match = trimmed.match(/total filament used \[g\]\s*=\s*([\d.]+)/)
      if (match) {
        totalFilamentGrams = parseFloat(match[1])
      }
    }

    // ; total filament cost = 1.66
    if (trimmed.includes('total filament cost')) {
      const match = trimmed.match(/total filament cost\s*=\s*([\d.]+)/)
      if (match) {
        totalFilamentCost = parseFloat(match[1])
      }
    }

    // ; estimated printing time (normal mode) = 6h 38m 17s
    if (trimmed.includes('estimated printing time')) {
      const match = trimmed.match(/estimated printing time[^=]*=\s*(.+)/)
      if (match) {
        printTime = match[1].trim()
      }
    }

    // Cura format
    // ;EXTRUDER_COLOUR:#FF0000
    if (trimmed.startsWith(';EXTRUDER_COLOUR:')) {
      const match = trimmed.match(/;EXTRUDER_COLOUR:(.+)/)
      if (match) {
        colors.push(match[1].trim())
      }
    }

    // Simplify3D format
    // ; extruderColor,#FF0000
    if (trimmed.includes('extruderColor,')) {
      const match = trimmed.match(/extruderColor,(.+)/)
      if (match) {
        colors.push(match[1].trim())
      }
    }
  }

  // Build extruder metadata array based on metadata found, not T commands
  // Limit to 4 extruders max (Snapmaker J1 has 4 slots)
  const extruders: ExtruderMetadata[] = []
  const maxExtruders = Math.min(Math.max(colors.length, types.length, usages.length), 4)

  for (let i = 0; i < maxExtruders; i++) {
    extruders.push({
      index: i,
      color: colors[i] || null,
      type: types[i] || null,
      usageGrams: usages[i] || null
    })
  }

  const hasMetadata = colors.length > 0 || types.length > 0

  // Log warning if no metadata found
  if (!hasMetadata) {
    console.warn(
      'No filament metadata found in G-code file. ' +
      'Falling back to extruder numbers. ' +
      'Ensure your slicer is configured to include filament information in comments.'
    )
  }

  return {
    extruders,
    hasMetadata,
    printTime,
    totalFilamentGrams,
    totalFilamentCost
  }
}

/**
 * Convert hex color string to RGB object
 * @param hex - Hex color string like "#FF0000" or "FF0000"
 * @returns RGB object with r, g, b values (0-255)
 */
export function hexToRgb (hex: string): { r: number, g: number, b: number } | null {
  const cleanHex = hex.replace('#', '')
  const match = cleanHex.match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)

  if (!match) return null

  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16)
  }
}

/**
 * Convert RGBA hex string (from print_task.json) to RGB hex
 * @param rgba - RGBA hex string like "F4C032FF"
 * @returns RGB hex string like "#F4C032"
 */
export function rgbaToHex (rgba: string): string {
  // Take first 6 characters (RGB), ignore last 2 (alpha)
  return '#' + rgba.substring(0, 6)
}

/**
 * Find actually used extruders by scanning G-code for T commands
 * A slicer may configure many filaments/extruders, but the actual model might only use a subset
 *
 * @param gcodeContent - Full G-code file content as string
 * @returns Array of used extruder indices (e.g., [0, 2] means T0 and T2 are used)
 */
export function findUsedExtruders (gcodeContent: string): number[] {
  const usedExtruders = new Set<number>()
  const lines = gcodeContent.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Look for T commands (tool changes): T0, T1, T2, T3, etc.
    // Match standalone T commands or T commands followed by other codes
    const tMatch = trimmed.match(/^T(\d+)(?:\s|$|;)/)
    if (tMatch) {
      const extruderIndex = parseInt(tMatch[1], 10)
      if (extruderIndex >= 0 && extruderIndex < 10) { // Max 10 extruders
        usedExtruders.add(extruderIndex)
      }
    }
  }

  // Convert Set to sorted array
  return Array.from(usedExtruders).sort((a, b) => a - b)
}

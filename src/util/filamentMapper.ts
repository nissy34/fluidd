/**
 * Auto-mapping algorithm for matching G-code extruders to physical printer slots
 * Prioritizes: 1) Material type match, 2) Closest color match, 3) Any available slot
 */

import type { ExtruderMetadata } from './parseFilamentMetadata'
import type { FilamentSlot } from '@/store/printer/filaments/types'
import { hexToRgb, rgbaToHex } from './parseFilamentMetadata'

export interface FilamentMapping {
  gcodeExtruderIndex: number      // G-code extruder (0-3)
  printerSlotIndex: number | null // Physical printer slot (0-3) or null if unmapped
  confidence: 'high' | 'medium' | 'low' | 'none'
}

/**
 * Normalize material type for comparison (case-insensitive, trim whitespace)
 * @param material - Material type string
 * @returns Normalized material string or null if empty
 */
function normalizeMaterial (material: string | null | undefined): string | null {
  if (!material) return null
  return material.trim().toLowerCase() || null
}

/**
 * Check if two material types match (case-insensitive comparison)
 * @param material1 - First material type
 * @param material2 - Second material type
 * @returns true if materials match, false otherwise
 */
export function materialsMatch (material1: string | null | undefined, material2: string | null | undefined): boolean {
  const norm1 = normalizeMaterial(material1)
  const norm2 = normalizeMaterial(material2)
  if (!norm1 || !norm2) return false
  return norm1 === norm2
}

/**
 * Calculate Euclidean distance between two RGB colors
 * @returns Distance value (0 = identical, ~442 = max difference)
 */
function calculateColorDistance (rgb1: { r: number, g: number, b: number }, rgb2: { r: number, g: number, b: number }): number {
  const rDiff = rgb1.r - rgb2.r
  const gDiff = rgb1.g - rgb2.g
  const bDiff = rgb1.b - rgb2.b
  return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
}

/**
 * Auto-map G-code extruders to physical printer slots
 * Allows multiple G-code extruders to map to the same machine slot.
 * Uses color and material matching:
 * 1. Calculate all color distances
 * 2. Prioritize material type matches
 * 3. Select closest color match for each G-code extruder
 *
 * @param gcodeExtruders - Extruder metadata from G-code file
 * @param printerSlots - Current filament slots from printer
 * @returns Array of mappings with confidence scores
 */
export function autoMapFilaments (
  gcodeExtruders: ExtruderMetadata[],
  printerSlots: FilamentSlot[]
): FilamentMapping[] {
  // Filter to only existing filaments
  const availableSlots = printerSlots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.exists)

  // Calculate all distances and preferences
  interface ExtruderPreference {
    extruderIndex: number
    extruder: ExtruderMetadata
    preferences: Array<{ slotIndex: number, distance: number, hasTypeMatch: boolean }>
  }

  const preferences: ExtruderPreference[] = gcodeExtruders.map((gcode, extruderIndex) => {
    const prefs: Array<{ slotIndex: number, distance: number, hasTypeMatch: boolean }> = []

    const gcodeRgb = gcode.color ? hexToRgb(gcode.color) : null

    for (const { slot, index } of availableSlots) {
      if (!slot.colorRgba) continue

      // Only consider slots with matching material type
      if (!materialsMatch(slot.type, gcode.type)) {
        continue
      }

      const slotHex = rgbaToHex(slot.colorRgba)
      const slotRgb = hexToRgb(slotHex)
      if (!slotRgb || !gcodeRgb) continue

      const distance = calculateColorDistance(gcodeRgb, slotRgb)
      const hasTypeMatch = true // All items in prefs now have matching materials

      prefs.push({ slotIndex: index, distance, hasTypeMatch })
    }

    // Sort by distance (closest first) - all have matching materials
    prefs.sort((a, b) => a.distance - b.distance)

    return { extruderIndex, extruder: gcode, preferences: prefs }
  })

  // Assign best match for each extruder (allows multiple G-code extruders to map to same slot)
  // Only matches slots with same material type - never allows different materials
  const mappings: FilamentMapping[] = preferences.map(({ extruderIndex, preferences: prefs }) => {
    // If no matching material slots found, return unmapped
    if (prefs.length === 0) {
      return {
        gcodeExtruderIndex: extruderIndex,
        printerSlotIndex: null,
        confidence: 'none'
      }
    }

    const bestMatch = prefs[0]
    // All matches have same material, so confidence based on color distance
    const confidence = bestMatch.distance < 100
      ? 'high'
      : bestMatch.distance < 200
        ? 'medium'
        : 'low'

    return {
      gcodeExtruderIndex: extruderIndex,
      printerSlotIndex: bestMatch.slotIndex,
      confidence
    }
  })

  return mappings
}

/**
 * Validate that all mappings are complete
 * @returns true if all extruders are mapped to valid slots
 */
export function validateMappings (mappings: FilamentMapping[]): boolean {
  return mappings.every(m => m.printerSlotIndex !== null)
}

/**
 * Build extruder_map_table array for print_task.json
 * @param mappings - Array of filament mappings
 * @returns 32-element array with printer slot indices
 */
export function buildExtruderMapTable (mappings: FilamentMapping[]): number[] {
  const table = new Array(32).fill(0)

  for (const mapping of mappings) {
    if (mapping.printerSlotIndex !== null) {
      table[mapping.gcodeExtruderIndex] = mapping.printerSlotIndex
    }
  }

  return table
}

/**
 * Build extruders_used array for print_task.json
 * @param mappings - Array of filament mappings
 * @returns 4-element boolean array indicating which printer slots are used
 */
export function buildExtrudersUsed (mappings: FilamentMapping[]): boolean[] {
  const used = [false, false, false, false]

  for (const mapping of mappings) {
    if (mapping.printerSlotIndex !== null) {
      used[mapping.printerSlotIndex] = true
    }
  }

  return used
}

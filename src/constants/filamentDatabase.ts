/**
 * Filament database with vendors, materials, series, and preset colors
 * This is a hardcoded database used for filament configuration and validation
 */

export interface FilamentVendor {
  vendor: string
  description: string
  materials: FilamentMaterial[]
}

export interface FilamentMaterial {
  material: string
  description: string
  series: FilamentSeries[]
}

export interface FilamentSeries {
  serie: string
  description: string
}

export interface FilamentColor {
  name: string
  hex: string
  type: string
  sku: string
}

export interface FilamentDatabase {
  filament: FilamentVendor[]
  filament_special_series: string[]
  filament_color: FilamentColor[]
}

export const FILAMENT_DATABASE: FilamentDatabase = {
  filament: [
    {
      vendor: 'Snapmaker',
      description: 'Snapmaker',
      materials: [
        {
          material: 'PLA',
          description: '',
          series: [
            { serie: 'Matte', description: '' },
            { serie: 'SnapSpeed', description: '' },
            { serie: 'Basic', description: '' },
            { serie: 'Support', description: 'Support for' }
          ]
        },
        {
          material: 'ABS',
          description: '',
          series: []
        },
        {
          material: 'PVA',
          description: '',
          series: []
        },
        {
          material: 'PETG',
          description: '',
          series: []
        },
        {
          material: 'TPU',
          description: '',
          series: [
            { serie: '95A', description: '' }
          ]
        }
      ]
    },
    {
      vendor: 'Polymaker',
      description: '',
      materials: [
        {
          material: 'PLA',
          description: '',
          series: [
            { serie: 'Lite', description: '' },
            { serie: 'Terra', description: '' },
            { serie: 'Sonic', description: '' }
          ]
        },
        {
          material: 'PETG',
          description: '',
          series: []
        },
        {
          material: 'ABS',
          description: '',
          series: []
        }
      ]
    },
    {
      vendor: 'Generic',
      description: '',
      materials: [
        {
          material: 'PLA',
          description: '',
          series: [
            { serie: '', description: '' },
            { serie: 'Support', description: 'Support for' },
            { serie: 'Silk', description: '' }
          ]
        },
        {
          material: 'PETG',
          description: '',
          series: []
        },
        {
          material: 'ABS',
          description: '',
          series: []
        },
        {
          material: 'TPU',
          description: '',
          series: [
            { serie: '95A', description: '' },
            { serie: '90A', description: '' }
          ]
        },
        {
          material: 'ASA',
          description: '',
          series: []
        },
        {
          material: 'BVOH',
          description: '',
          series: []
        },
        {
          material: 'EVA',
          description: '',
          series: []
        },
        {
          material: 'HIPS',
          description: '',
          series: []
        },
        {
          material: 'PA',
          description: '',
          series: []
        },
        {
          material: 'PA-CF',
          description: '',
          series: []
        },
        {
          material: 'PC',
          description: '',
          series: []
        },
        {
          material: 'PCTG',
          description: '',
          series: []
        },
        {
          material: 'PE',
          description: '',
          series: []
        },
        {
          material: 'PE-CF',
          description: '',
          series: []
        },
        {
          material: 'PETG-HF',
          description: '',
          series: []
        },
        {
          material: 'PETG-CF',
          description: '',
          series: []
        },
        {
          material: 'PHA',
          description: '',
          series: []
        },
        {
          material: 'PLA-CF',
          description: '',
          series: []
        },
        {
          material: 'PVA',
          description: '',
          series: []
        }
      ]
    }
  ],
  filament_special_series: ['85A', '90A', '95A', '95A HF'],
  filament_color: [
    { name: 'Ivory White', hex: 'FFFFFF', type: 'PLA MATTE', sku: '34046' },
    { name: 'Carbon Black', hex: '000000', type: 'PLA MATTE', sku: '34049' },
    { name: 'Lava Orange', hex: 'F78E0E', type: 'PLA MATTE', sku: '34047' },
    { name: 'Sunburst Yellow', hex: 'F0BE02', type: 'PLA MATTE', sku: '34048' },
    { name: 'Moss Mist', hex: 'BEC9A5', type: 'PLA MATTE', sku: '34050' },
    { name: 'Pine Green', hex: '519F61', type: 'PLA MATTE', sku: '34051' },
    { name: 'Engine Red', hex: 'DE1619', type: 'PLA MATTE', sku: '34052' },
    { name: 'Ash Grey', hex: '9B9EA0', type: 'PLA MATTE', sku: '34053' },
    { name: 'Celestial Blue', hex: '8BD5EE', type: 'PLA MATTE', sku: '34054' },
    { name: 'Sakura Pink', hex: 'F3D6E5', type: 'PLA MATTE', sku: '34055' },
    { name: 'Pearl White', hex: 'E2DEDB', type: 'PLA HS', sku: '34031' },
    { name: 'Black', hex: '080A0D', type: 'PLA HS', sku: '34032' },
    { name: 'Grey', hex: '8C9099', type: 'PLA HS', sku: '34033' },
    { name: 'Blue', hex: '003776', type: 'PLA HS', sku: '34034' },
    { name: 'Red', hex: 'E72F1D', type: 'PLA HS', sku: '34035' },
    { name: 'Purple', hex: '6C5BB1', type: 'PLA HS', sku: '34036' },
    { name: 'Orange', hex: 'F97429', type: 'PLA HS', sku: '34037' },
    { name: 'Green', hex: '2D9E59', type: 'PLA HS', sku: '34038' },
    { name: 'Yellow', hex: 'F4C032', type: 'PLA HS', sku: '34039' },
    { name: 'Brown', hex: '6F4C2F', type: 'PLA HS', sku: '34040' }
  ]
}

/**
 * Get formatted display name: "Vendor: Serie Material" or "Vendor: Material"
 * Examples: "Polymaker: Sonic PLA", "Snapmaker: PLA", "Generic: Silk PLA"
 */
export function getFilamentDisplayName (vendor: string, serie: string): string {
  // if (serie && serie.trim()) {
  //   return `${vendor}: ${serie} ${material}`
  // }
  // return `${vendor}: ${material}`

  if (serie && serie.trim()) {
    return `${vendor} ${serie}`
  }
  return `${vendor}`
}

/**
 * Format filament slot for display
 */
export function formatFilamentSlot (vendor: string | null, subType: string | null, type: string | null): string {
  if (!vendor || !type) {
    return 'Unknown'
  }
  return getFilamentDisplayName(vendor, subType || '')
}

/**
 * Get all vendor names
 */
export function getVendors (): string[] {
  return FILAMENT_DATABASE.filament.map(v => v.vendor)
}

/**
 * Get materials for a specific vendor
 */
export function getMaterialsForVendor (vendor: string): string[] {
  const vendorData = FILAMENT_DATABASE.filament.find(v => v.vendor === vendor)
  return vendorData?.materials.map(m => m.material) || []
}

/**
 * Get series for a specific vendor and material
 */
export function getSeriesForVendorMaterial (vendor: string, material: string): string[] {
  const vendorData = FILAMENT_DATABASE.filament.find(v => v.vendor === vendor)
  const materialData = vendorData?.materials.find(m => m.material === material)
  return materialData?.series.map(s => s.serie) || []
}

/**
 * Get preset colors
 */
export function getPresetColors (): FilamentColor[] {
  return FILAMENT_DATABASE.filament_color
}

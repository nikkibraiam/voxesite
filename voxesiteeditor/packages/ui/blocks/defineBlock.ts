import type { Component } from 'vue'

export interface BlockFieldDef {
  key: string
  label: string
  type: 'string' | 'boolean' | 'color' | 'json' | 'css'
  readonly?: boolean
}

export interface BlockSchemaDef {
  type: string
  label: string
  defaultProps: Record<string, any>
  fields: BlockFieldDef[]
}

export interface StyleGroupDef {
  group: string
  fields: Array<{
    key: string
    label: string
    type: string
    selector?: string
    cssProperty?: string
  }>
}

export interface BlockManifestEntry {
  type: string
  label: string
  icon: string
  category: 'layout' | 'content' | 'marketing' | 'ecommerce' | 'utility'
  schema: BlockSchemaDef
  component: Component
  styleSchemas?: StyleGroupDef[]
}

export function defineBlockManifest(entry: BlockManifestEntry): BlockManifestEntry {
  return entry
}

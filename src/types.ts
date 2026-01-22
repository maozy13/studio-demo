export type Mode = 'edit' | 'dev'
export type ContainerType = 'system' | 'module' | 'function'

export interface Metadata {
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface DictionaryEntry {
  id: string
  term: string
  definition: string
  metadata: Metadata
}

export interface ContainerNode {
  id: string
  type: ContainerType
  name: string
  description: string
  mode: Mode
  metadata: Metadata
  urlId: string
  children: ContainerNode[]
  doc?: string
}

export interface Project {
  id: string
  name: string
  description: string
  urlId: string
  metadata: Metadata
  dictionary: DictionaryEntry[]
  system?: ContainerNode
}

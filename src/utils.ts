import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import type { ContainerNode, Metadata } from './types'

// Generates a short URL-safe id for project and container links.
export const createUrlId = () => nanoid(22)

// Returns an ISO timestamp for consistent metadata storage.
export const nowIso = () => new Date().toISOString()

// Creates metadata for new entities.
export const createMetadata = (user: string): Metadata => {
  const timestamp = nowIso()
  return {
    createdBy: user,
    createdAt: timestamp,
    updatedBy: user,
    updatedAt: timestamp,
  }
}

// Touches metadata when content changes.
export const touchMetadata = (meta: Metadata, user: string): Metadata => ({
  ...meta,
  updatedBy: user,
  updatedAt: nowIso(),
})

// Formats timestamps for display.
export const formatDate = (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm')

// Builds the prompt text for a container node using the current server origin.
export const buildPrompt = (urlId: string, origin?: string) => {
  // Prefer the provided origin, otherwise fall back to the current browser origin.
  const base =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
  return `读取这个 DIP 项目链接下的设计文档并开发应用：\n@${base}/project/${urlId}`
}

// Finds a node by id and returns it.
export const findNodeById = (root: ContainerNode | undefined, id: string): ContainerNode | null => {
  if (!root) {
    return null
  }
  // Stop recursion once the id matches.
  if (root.id === id) {
    return root
  }
  for (const child of root.children) {
    const found = findNodeById(child, id)
    if (found) {
      return found
    }
  }
  return null
}

// Finds the path from the root to the target node.
export const findNodePath = (root: ContainerNode | undefined, id: string): ContainerNode[] => {
  if (!root) {
    return []
  }
  // Capture the path when the current node matches.
  if (root.id === id) {
    return [root]
  }
  for (const child of root.children) {
    const path = findNodePath(child, id)
    if (path.length > 0) {
      return [root, ...path]
    }
  }
  return []
}

// Updates a node in the tree by applying an updater function.
export const updateNode = (
  root: ContainerNode | undefined,
  id: string,
  updater: (node: ContainerNode) => ContainerNode,
): ContainerNode | undefined => {
  if (!root) {
    return undefined
  }
  if (root.id === id) {
    return updater(root)
  }
  return {
    ...root,
    children: root.children.map((child) => updateNode(child, id, updater) ?? child),
  }
}

// Removes a node by id and returns the updated tree.
export const removeNode = (root: ContainerNode | undefined, id: string): ContainerNode | undefined => {
  if (!root) {
    return undefined
  }
  return {
    ...root,
    children: root.children
      .filter((child) => child.id !== id)
      .map((child) => removeNode(child, id) ?? child),
  }
}

// Adds a child node under a given parent id.
export const addChildNode = (
  root: ContainerNode | undefined,
  parentId: string,
  child: ContainerNode,
): ContainerNode | undefined => {
  if (!root) {
    return undefined
  }
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, child],
    }
  }
  return {
    ...root,
    children: root.children.map((node) => addChildNode(node, parentId, child) ?? node),
  }
}

// Computes the latest edit metadata from a node and its descendants.
export const getLatestEdit = (node: ContainerNode | undefined): Metadata | null => {
  if (!node) {
    return null
  }
  let latest = node.metadata
  for (const child of node.children) {
    const candidate = getLatestEdit(child)
    // Prefer the more recent edit time.
    if (candidate && new Date(candidate.updatedAt) > new Date(latest.updatedAt)) {
      latest = candidate
    }
  }
  return latest
}

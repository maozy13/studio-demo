import { Button, Input, Modal, Space, Tabs, Typography } from 'antd'
import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocEditorProps {
  doc: string
  readOnly: boolean
  onChange: (value: string) => void
}

const indicatorOptions = ['万元人力成本销售收入', '人均销售额', '人均人力成本']
const knowledgeOptions = ['组织结构网络', '岗位能力网络', '人才画像网络', '决策流程网络']
const indicatorPattern = /{{\s*mertic:([^:}]+):([^}]+)\s*}}/g

// Inserts text into the target string at the given index.
const insertAt = (target: string, insert: string, index: number) =>
  target.slice(0, index) + insert + target.slice(index)

// Renders the design document editor with slash-triggered plugins.
export const DocEditor = ({ doc, readOnly, onChange }: DocEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  // Tracks the last known selection and value even if the textarea loses focus.
  const selectionRef = useRef({ start: 0, end: 0, value: doc })
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [pluginOpen, setPluginOpen] = useState(false)
  const [pluginType, setPluginType] = useState<'指标' | '业务知识网络' | null>(null)
  const [search, setSearch] = useState('')
  const [cursorIndex, setCursorIndex] = useState(0)
  const [slashIndex, setSlashIndex] = useState<number | null>(null)
  const [tabKey, setTabKey] = useState<'edit' | 'preview'>('edit')

  // Filters plugin options by the current search term.
  const pluginOptions = useMemo(() => {
    const base = pluginType === '指标' ? indicatorOptions : knowledgeOptions
    return base.filter((item) => item.includes(search))
  }, [pluginType, search])

  // Tracks document updates and toggles the slash menu on demand.
  const handleChange = (value: string, caretIndex: number) => {
    onChange(value)
    if (readOnly) {
      setShowSlashMenu(false)
      setSlashIndex(null)
      setSearch('')
      return
    }
    // Detect the most recent slash before the caret to support inline typing.
    const lastSlashIndex = value.lastIndexOf('/', Math.max(caretIndex - 1, 0))
    if (lastSlashIndex >= 0) {
      const inlineQuery = value.slice(lastSlashIndex + 1, caretIndex)
      const hasWhitespace = /[\s]/.test(inlineQuery)
      if (!hasWhitespace) {
        setShowSlashMenu(true)
        // Capture the slash position for replacement insertion.
        setSlashIndex(lastSlashIndex)
        setSearch(inlineQuery)
        return
      }
    }
    setShowSlashMenu(false)
    setSlashIndex(null)
    setSearch('')
  }

  // Handles textarea change events and extracts the value.
  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextCursor = event.target.selectionStart
    // Capture the latest selection/value so plugin insertion can use it after blur.
    selectionRef.current = {
      start: nextCursor,
      end: event.target.selectionEnd ?? nextCursor,
      value: event.target.value,
    }
    setCursorIndex(nextCursor)
    handleChange(event.target.value, nextCursor)
  }

  // Handles search input changes for plugin filtering.
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  // Captures the caret location for future insertions.
  const handleSelect = () => {
    const element = textareaRef.current
    if (element) {
      // Keep the latest selection even if the editor loses focus.
      selectionRef.current = {
        start: element.selectionStart ?? cursorIndex,
        end: element.selectionEnd ?? element.selectionStart ?? cursorIndex,
        value: element.value,
      }
      setCursorIndex(element.selectionStart)
    }
  }

  // Opens the plugin picker based on the selected type.
  const openPlugin = (type: '指标' | '业务知识网络') => {
    setPluginType(type)
    setPluginOpen(true)
    setShowSlashMenu(false)
  }

  // Generates a short deterministic id for metric inline blocks.
  const createMetricId = (name: string) => {
    let hash = 0
    for (let i = 0; i < name.length; i += 1) {
      hash = (hash << 5) - hash + name.charCodeAt(i)
      hash |= 0
    }
    return `m${Math.abs(hash).toString(36)}`
  }

  // Inserts a plugin token into the document at the current caret position.
  const handlePluginInsert = (value: string) => {
    const metricId = createMetricId(value)
    const token =
      pluginType === '指标' ? `{{ mertic:${metricId}:${value}  }}` : `【${pluginType}：${value}】`
    const element = textareaRef.current
    // Only trust live selection when the textarea is focused; otherwise use the last snapshot.
    const isFocused = !!element && document.activeElement === element
    const snapshot = selectionRef.current
    const currentDoc = isFocused ? element?.value ?? doc : snapshot.value ?? doc
    const selectionStart = isFocused
      ? element?.selectionStart ?? cursorIndex
      : snapshot.start ?? cursorIndex
    const selectionEnd = isFocused
      ? element?.selectionEnd ?? selectionStart
      : snapshot.end ?? selectionStart
    // Confirm the slash still exists before using it as the replacement anchor.
    const validSlash =
      slashIndex !== null &&
      slashIndex >= 0 &&
      slashIndex < currentDoc.length &&
      currentDoc[slashIndex] === '/'
    // Prefer the tracked slash position to ensure we replace the trigger even after focus loss.
    const replaceStart = validSlash ? slashIndex : selectionStart
    // Ensure the slash trigger is removed even if the current selection is stale.
    const replaceEnd = validSlash ? Math.max(selectionEnd, slashIndex + 1) : selectionEnd
    // Normalize indices to avoid duplicate content injection.
    const safeStart = Math.min(Math.max(replaceStart, 0), currentDoc.length)
    const safeEnd = Math.min(Math.max(replaceEnd, safeStart), currentDoc.length)
    const next = currentDoc.slice(0, safeStart) + token + currentDoc.slice(safeEnd)
    onChange(next)
    // Update the cursor position for subsequent edits.
    setCursorIndex(safeStart + token.length)
    selectionRef.current = {
      start: safeStart + token.length,
      end: safeStart + token.length,
      value: next,
    }
    setShowSlashMenu(false)
    setSlashIndex(null)
    setSearch('')
    setPluginOpen(false)
  }

  // Renders metric tokens as inline blocks in preview mode.
  const renderIndicatorInline = (text: string): ReactNode[] => {
    const nodes: ReactNode[] = []
    let lastIndex = 0
    for (const match of text.matchAll(indicatorPattern)) {
      if (match.index === undefined) {
        continue
      }
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index))
      }
      const metricName = match[2]
      nodes.push(
        <span className="inline-token" key={`indicator-${match.index}`}>
          <span className="inline-token-icon" aria-hidden="true" />
          <span className="inline-token-label">{metricName}</span>
        </span>,
      )
      lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex))
    }
    return nodes.length > 0 ? nodes : [text]
  }

  // Applies indicator rendering to markdown child nodes.
  const renderChildrenWithIndicators = (children: ReactNode): ReactNode[] => {
    return (Array.isArray(children) ? children : [children]).flatMap((child) => {
      if (typeof child === 'string') {
        return renderIndicatorInline(child)
      }
      return child
    })
  }

  return (
    <div className="doc-editor">
      <Tabs
        activeKey={tabKey}
        onChange={(key) => {
          // Track the active tab to switch between edit and preview modes.
          setTabKey(key as 'edit' | 'preview')
        }}
        items={[
          {
            key: 'edit',
            label: '编辑',
            children: (
              <div className="doc-editor-pane">
                <div className="doc-editor-body">
                  <Input.TextArea
                    ref={textareaRef}
                    value={doc}
                    rows={18}
                    onChange={handleTextChange}
                    onSelect={handleSelect}
                    readOnly={readOnly}
                  />
                  {showSlashMenu && !readOnly ? (
                    <div className="slash-menu">
                      <Typography.Text type="secondary">选择插件</Typography.Text>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button type="text" onClick={() => openPlugin('指标')}>
                          指标
                        </Button>
                        <Button type="text" onClick={() => openPlugin('业务知识网络')}>
                          业务知识网络
                        </Button>
                      </Space>
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          },
          {
            key: 'preview',
            label: '预览',
            children: (
              <div className="doc-preview-pane">
                <div className="doc-preview">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p>{renderChildrenWithIndicators(children)}</p>,
                      li: ({ children }) => <li>{renderChildrenWithIndicators(children)}</li>,
                    }}
                  >
                    {doc}
                  </ReactMarkdown>
                </div>
              </div>
            ),
          },
        ]}
      />
      <Modal
        title={pluginType ? `${pluginType}配置` : '插件配置'}
        open={pluginOpen}
        onCancel={() => setPluginOpen(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            value={search}
            onChange={handleSearchChange}
            placeholder="输入关键字搜索"
          />
          <div className="plugin-list">
            {pluginOptions.map((option) => (
              <Button key={option} onClick={() => handlePluginInsert(option)}>
                {option}
              </Button>
            ))}
          </div>
        </Space>
      </Modal>
    </div>
  )
}

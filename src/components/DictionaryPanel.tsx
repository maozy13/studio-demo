import { Button, Form, Input, Modal, Space, Table, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import type { DictionaryEntry } from '../types'
import { createMetadata, createUrlId, formatDate, touchMetadata } from '../utils'

interface DictionaryPanelProps {
  entries: DictionaryEntry[]
  onUpsert: (entry: DictionaryEntry) => void
  onDelete: (entry: DictionaryEntry) => void
}

interface DictionaryFormValues {
  term: string
  definition: string
}

// Renders the project dictionary management table.
export const DictionaryPanel = ({ entries, onUpsert, onDelete }: DictionaryPanelProps) => {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DictionaryEntry | null>(null)
  const [form] = Form.useForm<DictionaryFormValues>()

  // Opens the modal for creating a new dictionary entry.
  const handleCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  // Opens the modal for editing an existing dictionary entry.
  const handleEdit = (entry: DictionaryEntry) => {
    setEditing(entry)
    form.setFieldsValue({ term: entry.term, definition: entry.definition })
    setOpen(true)
  }

  // Renders multi-line definition text in the table.
  const renderDefinition = (value: string) => (
    <Typography.Paragraph className="dictionary-definition">{value}</Typography.Paragraph>
  )

  // Renders the last updated timestamp for a dictionary entry.
  const renderLastEdited = (meta: DictionaryEntry['metadata']) => (
    <span>{formatDate(meta.updatedAt)}</span>
  )

  // Renders the action buttons for each dictionary entry.
  const renderActions = (_: unknown, entry: DictionaryEntry) => (
    <Space>
      <Button size="small" onClick={() => handleEdit(entry)}>
        编辑
      </Button>
      <Button size="small" danger onClick={() => onDelete(entry)}>
        删除
      </Button>
    </Space>
  )

  // Memoizes table data for stable rendering.
  const dataSource = useMemo(
    () =>
      entries.map((entry) => ({
        key: entry.id,
        ...entry,
      })),
    [entries],
  )

  // Saves the dictionary entry after validating uniqueness.
  const handleSave = async () => {
    const values = await form.validateFields()
    const trimmedTerm = values.term.trim()
    // Prevent duplicate terms in the same project dictionary.
    if (entries.some((entry) => entry.term === trimmedTerm && entry.id !== editing?.id)) {
      message.error('术语已存在，请调整后再保存。')
      return
    }
    const payload: DictionaryEntry = {
      id: editing?.id ?? createUrlId(),
      term: trimmedTerm,
      definition: values.definition.trim(),
      metadata: editing?.metadata ? touchMetadata(editing.metadata, '产品经理') : createMetadata('产品经理'),
    }
    onUpsert(payload)
    setOpen(false)
  }

  return (
    <div className="dictionary-panel">
      <div className="dictionary-header">
        <div>
          <Typography.Title level={4} className="panel-title">
            项目词典
          </Typography.Title>
          <Typography.Text type="secondary">用于解释项目中的术语定义</Typography.Text>
        </div>
        <Button type="primary" onClick={handleCreate}>
          新增术语
        </Button>
      </div>
      <Table
        dataSource={dataSource}
        pagination={false}
        columns={[
          {
            title: '术语',
            dataIndex: 'term',
            width: 180,
          },
          {
            title: '定义',
            dataIndex: 'definition',
            render: renderDefinition,
          },
          {
            title: '最后编辑',
            dataIndex: 'metadata',
            width: 200,
            render: renderLastEdited,
          },
          {
            title: '操作',
            dataIndex: 'actions',
            width: 140,
            render: renderActions,
          },
        ]}
      />
      <Modal
        title={editing ? '编辑术语' : '新增术语'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSave}
        okText="保存"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="术语"
            name="term"
            rules={[{ required: true, message: '请填写术语名称' }]}
          >
            <Input maxLength={80} placeholder="例如：人力资本 ROI" />
          </Form.Item>
          <Form.Item
            label="定义"
            name="definition"
            rules={[{ required: true, message: '请填写术语定义' }]}
          >
            <Input.TextArea rows={5} maxLength={400} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

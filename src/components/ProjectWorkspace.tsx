import {
  Button,
  Badge,
  Card,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Tree,
  Typography,
  message,
} from 'antd'
import { CodeOutlined } from '@ant-design/icons'
import { useMemo, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ContainerNode, ContainerType, Project } from '../types'
import { DocEditor } from './DocEditor'
import {
  addChildNode,
  buildPrompt,
  createMetadata,
  createUrlId,
  findNodeById,
  findNodePath,
  formatDate,
  getLatestEdit,
  removeNode,
  touchMetadata,
  updateNode,
} from '../utils'

interface ProjectWorkspaceProps {
  project: Project
  onProjectChange: (project: Project) => void
}

interface ContainerFormValues {
  name: string
  description: string
}

interface MoveFormValues {
  parentId: string
}

const containerLabels: Record<ContainerType, string> = {
  system: '应用',
  module: '页面',
  function: '功能',
}

// Renders the main project workspace with architecture and dictionary views.
export const ProjectWorkspace = ({ project, onProjectChange }: ProjectWorkspaceProps) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [containerModalOpen, setContainerModalOpen] = useState(false)
  const [containerModalMode, setContainerModalMode] = useState<'create' | 'edit'>('create')
  const [containerType, setContainerType] = useState<ContainerType>('module')
  const [containerParentId, setContainerParentId] = useState<string | null>(null)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [movingNodeId, setMovingNodeId] = useState<string | null>(null)
  const [containerForm] = Form.useForm<ContainerFormValues>()
  const [moveForm] = Form.useForm<MoveFormValues>()

  // Resets selection when switching to a different project.
  useEffect(() => {
    setSelectedNodeId(null)
  }, [project.id])

  const selectedNode = useMemo(
    () => (selectedNodeId ? findNodeById(project.system, selectedNodeId) : null),
    [project.system, selectedNodeId],
  )

  // Computes the path for the selected node to determine inherited mode.
  const selectedPath = useMemo(
    () => (selectedNodeId ? findNodePath(project.system, selectedNodeId) : []),
    [project.system, selectedNodeId],
  )

  // Determines whether the selected node is read-only due to development mode.
  const isReadOnly = useMemo(
    () => selectedPath.some((node) => node.mode === 'dev'),
    [selectedPath],
  )

  // Checks whether read-only state is inherited from an ancestor node.
  const isInheritedDev = useMemo(
    () => selectedPath.some((node) => node.mode === 'dev' && node.id !== selectedNodeId),
    [selectedPath, selectedNodeId],
  )

  // Builds tree data for the Ant Design tree component.
  const treeData = useMemo(() => {
    if (!project.system) {
      return []
    }
    // Recursively maps container nodes to tree nodes.
    const buildNode = (node: ContainerNode): { title: ReactNode; key: string; children: any[] } => ({
      title: (
        <Space>
          <Tag color="geekblue">{containerLabels[node.type]}</Tag>
          <span>{node.name}</span>
          {/* Show a badge icon only for nodes that explicitly enable dev mode. */}
          {node.mode === 'dev' ? (
            <Tooltip title="该节点开启了开发模式">
              <Badge
                color="blue"
                count={<CodeOutlined aria-label="开发模式" />}
              />
            </Tooltip>
          ) : null}
        </Space>
      ),
      key: node.id,
      children: node.children.map((child) => buildNode(child)),
    })
    return [buildNode(project.system)]
  }, [project.system])

  // Selects a node from the tree component.
  const handleTreeSelect = (keys: Array<string | number>) => {
    setSelectedNodeId(keys[0]?.toString() ?? null)
  }

  // Creates a module under the selected system, or the root system by default.
  const handleCreateModule = () => {
    // Prefer the selected system as the module's parent.
    const targetId =
      selectedNode && selectedNode.type === 'system' ? selectedNode.id : project.system?.id ?? null
    openCreateContainer('module', targetId)
  }

  // Creates the system container with project defaults.
  const handleCreateSystem = () => {
    openCreateContainer('system', null)
  }

  // Creates a function under the selected module.
  const handleCreateFunctionForSelected = () => {
    // Require a module selection to ensure correct hierarchy.
    if (!selectedNode || selectedNode.type !== 'module') {
      message.warning('请先选择一个页面后再新建功能。')
      return
    }
    openCreateContainer('function', selectedNode.id)
  }

  // Copies the prompt text to the clipboard when available.
  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptText)
    message.success('Prompt 已复制')
  }

  // Opens the edit modal for the currently selected node.
  const handleEditSelected = () => {
    if (selectedNode) {
      openEditContainer(selectedNode)
    }
  }

  // Opens the move modal for the currently selected node.
  const handleMoveSelected = () => {
    if (selectedNode) {
      openMoveModal(selectedNode)
    }
  }

  // Deletes the currently selected node after validation.
  const handleDeleteSelected = () => {
    if (selectedNode) {
      handleDeleteContainer(selectedNode)
    }
  }

  // Toggles the mode for the currently selected node.
  const handleToggleSelectedMode = (checked: boolean) => {
    if (selectedNode) {
      handleToggleMode(selectedNode, checked ? 'dev' : 'edit')
    }
  }

  // Opens the create container modal with the desired type and parent.
  const openCreateContainer = (type: ContainerType, parentId: string | null) => {
    setContainerModalMode('create')
    setContainerType(type)
    setContainerParentId(parentId)
    containerForm.resetFields()
    // Use project name/description as defaults for system container.
    if (type === 'system') {
      containerForm.setFieldsValue({ name: project.name, description: project.description })
    }
    setContainerModalOpen(true)
  }

  // Opens the edit container modal for the selected node.
  const openEditContainer = (node: ContainerNode) => {
    setContainerModalMode('edit')
    setContainerType(node.type)
    setContainerParentId(null)
    containerForm.setFieldsValue({ name: node.name, description: node.description })
    setContainerModalOpen(true)
  }

  // Persists changes when creating or editing a container.
  const handleSaveContainer = async () => {
    const values = await containerForm.validateFields()
    const trimmedName = values.name.trim()
    const trimmedDesc = values.description?.trim() ?? ''

    // Block saving when a system container already exists.
    if (containerModalMode === 'create' && containerType === 'system' && project.system) {
      message.warning('应用已存在，一个项目只能创建一个应用。')
      return
    }

    if (containerModalMode === 'create') {
      const newNode: ContainerNode = {
        id: createUrlId(),
        type: containerType,
        name: trimmedName,
        description: trimmedDesc,
        mode: 'edit',
        metadata: createMetadata('产品经理'),
        urlId: createUrlId(),
        children: [],
        doc: containerType === 'function' ? '' : undefined,
      }

      if (containerType === 'system') {
        onProjectChange({
          ...project,
          system: newNode,
        })
        setSelectedNodeId(newNode.id)
      } else if (containerParentId) {
        const updatedSystem = addChildNode(project.system, containerParentId, newNode)
        onProjectChange({
          ...project,
          system: updatedSystem,
        })
        setSelectedNodeId(newNode.id)
      }
    } else if (selectedNode) {
      const updatedSystem = updateNode(project.system, selectedNode.id, (node) => ({
        ...node,
        name: trimmedName,
        description: trimmedDesc,
        metadata: touchMetadata(node.metadata, '产品经理'),
      }))
      onProjectChange({
        ...project,
        system: updatedSystem,
      })
    }

    setContainerModalOpen(false)
  }

  // Ensures a node can be deleted before removing it.
  const handleDeleteContainer = (node: ContainerNode) => {
    // Prevent deletion when the node still has children.
    if (node.children.length > 0) {
      message.warning('请先删除或移动子节点后再删除该节点。')
      return
    }
    Modal.confirm({
      title: `确认删除${containerLabels[node.type]}？`,
      content: '删除后无法恢复，请谨慎操作。',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: () => {
        if (node.type === 'system') {
          onProjectChange({
            ...project,
            system: undefined,
          })
          setSelectedNodeId(null)
          return
        }
        const updatedSystem = removeNode(project.system, node.id)
        onProjectChange({
          ...project,
          system: updatedSystem,
        })
        setSelectedNodeId(null)
      },
    })
  }

  // Toggles development mode and cascades to children for consistency.
  const handleToggleMode = (node: ContainerNode, nextMode: 'edit' | 'dev') => {
    const cascadeMode = (target: ContainerNode): ContainerNode => ({
      ...target,
      mode: nextMode,
      children: target.children.map((child) => cascadeMode(child)),
    })
    const updatedSystem = updateNode(project.system, node.id, (target) => cascadeMode(target))
    onProjectChange({
      ...project,
      system: updatedSystem,
    })
  }

  // Opens the move modal for the selected node.
  const openMoveModal = (node: ContainerNode) => {
    setMovingNodeId(node.id)
    moveForm.resetFields()
    setMoveModalOpen(true)
  }

  // Computes eligible parents based on hierarchy rules.
  const moveParentOptions = useMemo(() => {
    if (!project.system || !movingNodeId) {
      return []
    }
    const node = findNodeById(project.system, movingNodeId)
    if (!node) {
      return []
    }
    if (node.type === 'system') {
      return []
    }
    const allowedParentTypes: ContainerType[] =
      node.type === 'module' ? ['system'] : ['module']

    // Collects all nodes to build the move target list.
    const collectNodes = (current: ContainerNode): ContainerNode[] => {
      return [current, ...current.children.flatMap((child) => collectNodes(child))]
    }

    const allNodes = collectNodes(project.system)
    // Checks whether the candidate id lives within the moving node subtree.
    const isDescendant = (candidateId: string) => {
      const path = findNodePath(node, candidateId)
      return path.length > 0
    }

    return allNodes
      .filter((candidate) => allowedParentTypes.includes(candidate.type))
      // Block moving under itself or descendants.
      .filter((candidate) => candidate.id !== node.id && !isDescendant(candidate.id))
      .map((candidate) => ({
        label: `${containerLabels[candidate.type]} · ${candidate.name}`,
        value: candidate.id,
      }))
  }, [movingNodeId, project.system])

  // Saves the move operation after validation.
  const handleMoveContainer = async () => {
    const values = await moveForm.validateFields()
    const node = movingNodeId ? findNodeById(project.system, movingNodeId) : null
    if (!node) {
      setMoveModalOpen(false)
      return
    }
    const parentId = values.parentId
    let updatedSystem = removeNode(project.system, node.id)
    if (updatedSystem) {
      const movedNode = {
        ...node,
        metadata: touchMetadata(node.metadata, '产品经理'),
      }
      updatedSystem = addChildNode(updatedSystem, parentId, movedNode)
    }
    onProjectChange({
      ...project,
      system: updatedSystem,
    })
    setMoveModalOpen(false)
  }

  // Updates the function document content.
  const handleDocChange = (value: string) => {
    if (!selectedNode || selectedNode.type !== 'function') {
      return
    }
    const updatedSystem = updateNode(project.system, selectedNode.id, (node) => ({
      ...node,
      doc: value,
      metadata: touchMetadata(node.metadata, '产品经理'),
    }))
    onProjectChange({
      ...project,
      system: updatedSystem,
    })
  }

  const selectedMeta = selectedNode ? getLatestEdit(selectedNode) : null
  // Use the current browser origin when building the prompt URL.
  const promptText = selectedNode
    ? buildPrompt(selectedNode.urlId, typeof window !== 'undefined' ? window.location.origin : undefined)
    : ''
  // Applies read-only restrictions when the system container is in development mode.
  const systemReadOnly = project.system?.mode === 'dev'
  // Enables function creation only when a module is selected.
  const canCreateFunction = !!selectedNode && selectedNode.type === 'module' && !isReadOnly
  // Enables module creation when system context is available.
  const canCreateModule =
    !!project.system &&
    (!selectedNode || selectedNode.type === 'system') &&
    !(selectedNode ? isReadOnly : systemReadOnly)

  return (
    <div className="project-workspace">
      <div className="workspace-layout">
        <aside className="workspace-sider">
          <Card className="panel-card" title="项目架构">
            <Space direction="vertical" className="panel-stack" size="middle">
              {!project.system ? (
                <div className="empty-state">
                  <Typography.Text type="secondary">
                    当前项目暂无应用，请先创建应用。
                  </Typography.Text>
                  <Button onClick={handleCreateSystem} type="primary">
                    创建应用
                  </Button>
                </div>
              ) : (
                <div className="tree-wrapper">
                  <Typography.Text type="secondary">点击节点查看详情</Typography.Text>
                  <div className="tree-scroll">
                    <div className="tree-actions">
                      <Button size="small" onClick={handleCreateModule} disabled={!canCreateModule}>
                        新建页面
                      </Button>
                      <Button size="small" onClick={handleCreateFunctionForSelected} disabled={!canCreateFunction}>
                        新建功能
                      </Button>
                    </div>
                    <Tree
                      treeData={treeData}
                      selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                      onSelect={handleTreeSelect}
                      defaultExpandAll
                    />
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </aside>
        <div className="workspace-main">
          <Tabs
            items={[
              {
                key: 'detail',
                label: '节点详情',
                children: (
                  <Card className="panel-card">
                    {!selectedNode ? (
                      <div className="empty-state">
                        <Typography.Text type="secondary">请选择一个节点查看详情。</Typography.Text>
                      </div>
                    ) : (
                      <Space direction="vertical" size="middle" className="panel-stack">
                        <div className="detail-header">
                          <Space>
                            <Tag color="geekblue">{containerLabels[selectedNode.type]}</Tag>
                            <Typography.Title level={5} className="detail-title">
                              {selectedNode.name}
                            </Typography.Title>
                          </Space>
                          <Space>
                            <Button onClick={handleEditSelected} disabled={isReadOnly}>
                              编辑
                            </Button>
                            <Button onClick={handleMoveSelected} disabled={isReadOnly}>
                              移动
                            </Button>
                            <Button danger onClick={handleDeleteSelected} disabled={isReadOnly}>
                              删除
                            </Button>
                          </Space>
                        </div>
                        <Divider />
                        <Space direction="vertical" size="small">
                          <Typography.Text>描述：{selectedNode.description || '暂无描述'}</Typography.Text>
                          <Typography.Text>创建者：{selectedNode.metadata.createdBy}</Typography.Text>
                          <Typography.Text>
                            创建时间：{formatDate(selectedNode.metadata.createdAt)}
                          </Typography.Text>
                          {selectedMeta ? (
                            <Typography.Text>
                              最近编辑：{selectedMeta.updatedBy} · {formatDate(selectedMeta.updatedAt)}
                            </Typography.Text>
                          ) : null}
                        </Space>
                        <Divider />
                        <Space align="center">
                          <Typography.Text>开发模式</Typography.Text>
                          <Switch
                            checked={selectedNode.mode === 'dev'}
                            onChange={handleToggleSelectedMode}
                            disabled={isInheritedDev}
                          />
                          {isReadOnly ? (
                            <Typography.Text type="secondary">当前为只读模式</Typography.Text>
                          ) : null}
                        </Space>
                        {selectedNode.mode === 'dev' ? (
                          <div className="prompt-box">
                            <Typography.Text type="secondary">Prompt</Typography.Text>
                            <Input.TextArea value={promptText} readOnly rows={3} />
                            <Button onClick={handleCopyPrompt}>
                              复制 Prompt
                            </Button>
                          </div>
                        ) : null}
                      </Space>
                    )}
                  </Card>
                ),
              },
              ...(selectedNode?.type === 'function'
                ? [
                    {
                      key: 'doc',
                      label: '设计文档',
                      children: (
                        <Card className="panel-card">
                          <DocEditor
                            doc={selectedNode.doc ?? ''}
                            readOnly={isReadOnly}
                            onChange={handleDocChange}
                          />
                        </Card>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </div>
      <Modal
        title={containerModalMode === 'create' ? `新建${containerLabels[containerType]}` : '编辑'}
        open={containerModalOpen}
        onCancel={() => setContainerModalOpen(false)}
        onOk={handleSaveContainer}
        okText="保存"
      >
        <Form form={containerForm} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请填写名称' }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} maxLength={400} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="移动"
        open={moveModalOpen}
        onCancel={() => setMoveModalOpen(false)}
        onOk={handleMoveContainer}
        okText="确认"
      >
        <Form form={moveForm} layout="vertical">
          <Form.Item
            label="选择新的上级"
            name="parentId"
            rules={[{ required: true, message: '请选择目标' }]}
          >
            <Select options={moveParentOptions} placeholder="请选择" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

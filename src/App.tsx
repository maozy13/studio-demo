import { Button, Drawer, Form, Input, Layout, Modal, Typography, message } from 'antd'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { DictionaryPanel } from './components/DictionaryPanel'
import { ProjectList } from './components/ProjectList'
import { ProjectWorkspace } from './components/ProjectWorkspace'
import type { Project } from './types'
import { createMetadata, createUrlId, touchMetadata } from './utils'

const { Content } = Layout

interface ProjectFormValues {
  name: string
  description: string
}

// Renders the main DIP Studio project management demo.
const App = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'workspace'>('list')
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [dictionaryOpen, setDictionaryOpen] = useState(false)
  const [projectForm] = Form.useForm<ProjectFormValues>()

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  )

  // Opens the create project modal.
  const handleCreateProject = () => {
    setProjectModalMode('create')
    setEditingProject(null)
    projectForm.resetFields()
    setProjectModalOpen(true)
  }

  // Opens the edit project modal for a given project.
  const handleEditProject = (project: Project) => {
    setProjectModalMode('edit')
    setEditingProject(project)
    projectForm.setFieldsValue({ name: project.name, description: project.description })
    setProjectModalOpen(true)
  }

  // Persists project changes when creating or editing.
  const handleSaveProject = async () => {
    const values = await projectForm.validateFields()
    const name = values.name.trim()
    const description = values.description?.trim() ?? ''

    // Ensure the project name is unique for clarity.
    if (
      projects.some(
        (project) => project.name === name && project.id !== (editingProject?.id ?? null),
      )
    ) {
      message.warning('项目名称已存在，请更换名称。')
      return
    }

    if (projectModalMode === 'create') {
      const newProject: Project = {
        id: createUrlId(),
        name,
        description,
        urlId: createUrlId(),
        metadata: createMetadata('产品经理'),
        dictionary: [],
      }
      setProjects((prev) => [newProject, ...prev])
      setActiveProjectId(newProject.id)
      setViewMode('workspace')
    } else if (editingProject) {
      setProjects((prev) =>
        prev.map((project) =>
          project.id === editingProject.id
            ? {
                ...project,
                name,
                description,
                metadata: touchMetadata(project.metadata, '产品经理'),
              }
            : project,
        ),
      )
    }

    setProjectModalOpen(false)
  }

  // Opens the delete project modal with confirmation input.
  const handleDeleteProject = (project: Project) => {
    setEditingProject(project)
    setDeleteInput('')
    setDeleteModalOpen(true)
  }

  // Confirms deletion after name verification.
  const confirmDeleteProject = () => {
    if (!editingProject) {
      setDeleteModalOpen(false)
      return
    }
    // Require an exact name match before deleting.
    if (deleteInput.trim() !== editingProject.name) {
      message.error('项目名称不匹配，请重新输入。')
      return
    }
    const nextProjects = projects.filter((project) => project.id !== editingProject.id)
    setProjects(nextProjects)
    setDeleteModalOpen(false)
    if (activeProjectId === editingProject.id) {
      setActiveProjectId(nextProjects[0]?.id ?? null)
      setViewMode('list')
    }
  }

  // Updates a single project within the project list.
  const handleProjectChange = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    )
  }

  // Updates dictionary entries for the active project.
  const handleDictionaryUpsert = (entry: Project['dictionary'][number]) => {
    if (!activeProject) {
      return
    }
    const existingIndex = activeProject.dictionary.findIndex((item) => item.id === entry.id)
    const nextDictionary = [...activeProject.dictionary]
    if (existingIndex >= 0) {
      nextDictionary[existingIndex] = entry
    } else {
      nextDictionary.push(entry)
    }
    handleProjectChange({
      ...activeProject,
      dictionary: nextDictionary,
    })
  }

  // Removes dictionary entries after confirmation.
  const handleDictionaryDelete = (entry: Project['dictionary'][number]) => {
    if (!activeProject) {
      return
    }
    Modal.confirm({
      title: '确认删除术语？',
      content: '删除后无法恢复。',
      okText: '删除',
      okButtonProps: { danger: true },
      onOk: () => {
        handleProjectChange({
          ...activeProject,
          dictionary: activeProject.dictionary.filter((item) => item.id !== entry.id),
        })
      },
    })
  }

  // Opens edit modal for the currently active project.
  const handleEditActiveProject = () => {
    if (activeProject) {
      handleEditProject(activeProject)
    }
  }

  // Switches the active project when a card is selected from the list page.
  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId)
    setViewMode('workspace')
  }

  // Tracks the delete confirmation input value.
  const handleDeleteInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDeleteInput(event.target.value)
  }

  return (
    <Layout className="app-shell">
      <Content className="main-content">
        {/* Use a dedicated list page before entering a project workspace. */}
        {viewMode === 'list' ? (
          <div className="project-page">
            <div className="project-page-header">
              <div>
                <Typography.Title level={3} className="project-page-title">
                  项目列表
                </Typography.Title>
                <Typography.Text type="secondary">已创建的 DIP 应用开发项目</Typography.Text>
              </div>
              <Button type="primary" onClick={handleCreateProject}>
                新建项目
              </Button>
            </div>
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              onSelect={handleSelectProject}
              onCreate={handleCreateProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              variant="page"
            />
          </div>
        ) : !activeProject ? (
          <div className="empty-state">
            <Typography.Title level={3}>暂无项目</Typography.Title>
            <Typography.Text type="secondary">请创建一个项目开始管理。</Typography.Text>
            <Button type="primary" onClick={() => setViewMode('list')}>
              返回项目列表
            </Button>
          </div>
        ) : (
          <div className="workspace-wrapper">
            <div className="workspace-header">
              <div>
                <Typography.Title level={3} className="workspace-title">
                  {activeProject.name}
                </Typography.Title>
                <Typography.Text type="secondary">{activeProject.description}</Typography.Text>
              </div>
              <div className="workspace-actions">
                <Button onClick={() => setViewMode('list')}>返回项目列表</Button>
                <Button onClick={handleEditActiveProject}>编辑项目</Button>
                <Button onClick={() => setDictionaryOpen(true)}>项目词典</Button>
              </div>
            </div>
            <ProjectWorkspace project={activeProject} onProjectChange={handleProjectChange} />
          </div>
        )}
      </Content>
      <Modal
        title={projectModalMode === 'create' ? '新建项目' : '编辑项目'}
        open={projectModalOpen}
        onCancel={() => setProjectModalOpen(false)}
        onOk={handleSaveProject}
        okText="保存"
      >
        <Form form={projectForm} layout="vertical">
          <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item label="项目描述" name="description">
            <Input.TextArea rows={4} maxLength={400} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="删除项目"
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={confirmDeleteProject}
        okText="删除"
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph>
          请输入项目名称以确认删除：<Typography.Text strong>{editingProject?.name}</Typography.Text>
        </Typography.Paragraph>
        <Input value={deleteInput} onChange={handleDeleteInputChange} />
      </Modal>
      <Drawer
        title="项目词典"
        placement="right"
        width="66.6667vw"
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
      >
        {activeProject ? (
          <DictionaryPanel
            entries={activeProject.dictionary}
            onUpsert={handleDictionaryUpsert}
            onDelete={handleDictionaryDelete}
          />
        ) : (
          <Typography.Text type="secondary">暂无项目可编辑。</Typography.Text>
        )}
      </Drawer>
    </Layout>
  )
}

export default App

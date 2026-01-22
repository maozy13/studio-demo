import { Button, Card, Dropdown, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import type { Project } from '../types'
import { formatDate } from '../utils'

const { Text } = Typography

interface ProjectListProps {
  projects: Project[]
  activeProjectId?: string | null
  onSelect: (projectId: string) => void
  onCreate: () => void
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
  variant?: 'sidebar' | 'page'
}

// Renders the project list with card actions for selection.
export const ProjectList = ({
  projects,
  activeProjectId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  variant = 'sidebar',
}: ProjectListProps) => {
  // Hide the inner header when the list is used as a full page.
  const showHeader = variant === 'sidebar'
  // Builds dropdown items for each project card.
  const buildMenu = (project: Project): MenuProps => ({
    items: [
      {
        key: 'edit',
        label: '编辑项目',
        onClick: () => onEdit(project),
      },
      {
        key: 'delete',
        label: '删除项目',
        onClick: () => onDelete(project),
        danger: true,
      },
    ],
  })

  return (
    <div className={`project-list ${variant === 'page' ? 'project-list-page' : ''}`}>
      {showHeader ? (
        <div className="project-list-header">
          <div>
            <Typography.Title level={4} className="project-list-title">
              项目列表
            </Typography.Title>
            <Text type="secondary">已创建的 DIP 应用开发项目</Text>
          </div>
          <Button type="primary" onClick={onCreate}>
            新建项目
          </Button>
        </div>
      ) : null}
      <div className={`project-list-body ${variant === 'page' ? 'project-list-body-grid' : ''}`}>
        {/* Render each project card in the sidebar list. */}
        {projects.map((project) => {
          const isActive = project.id === activeProjectId
          return (
            <Card
              key={project.id}
              className={`project-card ${isActive ? 'project-card-active' : ''}`}
              onClick={() => onSelect(project.id)}
            >
              <div className="project-card-header">
                <div>
                  <Typography.Title level={5} className="project-card-title">
                    {project.name}
                  </Typography.Title>
                  <Text type="secondary" className="project-card-desc">
                    {project.description || '暂无描述'}
                  </Text>
                </div>
                <Dropdown menu={buildMenu(project)} trigger={['click']}>
                  <Button
                    size="small"
                    type="text"
                    onClick={(event) => {
                      // Prevent card navigation when using the action menu.
                      event.stopPropagation()
                    }}
                  >
                    操作
                  </Button>
                </Dropdown>
              </div>
              <Space size="small" direction="vertical">
                <Text type="secondary">创建者：{project.metadata.createdBy}</Text>
                <Text type="secondary">创建时间：{formatDate(project.metadata.createdAt)}</Text>
              </Space>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

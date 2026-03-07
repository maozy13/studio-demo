/**
 * 数字员工详情页
 * 以树结构管理所有能力，左侧为树导航，右侧为对应内容面板
 *
 * 树结构：
 * {{ 数字员工 }}
 * |-- 设定
 * |-- 知识
 * |-- 技能
 *     |-- {{ 技能 1 }}
 * |-- 计划
 *     |-- {{ 计划 1 }}
 *         |-- {{ 任务 a }}
 * |-- 会话
 *     |-- {{ IM 工具 }}
 *         |-- {{ 会话 session }}
 */

import React, { useState, useMemo } from 'react';
import { Button, Tree } from 'antd';
import {
  ArrowLeftOutlined, SettingOutlined, DatabaseOutlined,
  ThunderboltOutlined, CalendarOutlined, MessageOutlined,
} from '@ant-design/icons';
import type { DigitalEmployeeDetail, TreeNode, TaskInstance } from '../types';
import { mockEmployeeDetails } from '../data';
import { formatRelativeTime } from './shared';
import SettingPanel from './panels/SettingPanel';
import KnowledgePanel from './panels/KnowledgePanel';
import SkillPanel from './panels/SkillPanel';
import PlanPanel from './panels/PlanPanel';
import { TaskDetailPanel } from './panels/PlanPanel';
import SessionPanel from './panels/SessionPanel';

interface EmployeeDetailProps {
  /** 数字员工 ID */
  employeeId: string;
  /** 返回列表回调 */
  onBack: () => void;
}


/**
 * 根据数字员工详情构建左侧树数据
 */
function buildTreeData(detail: DigitalEmployeeDetail): TreeNode[] {
  // 技能子节点
  const skillChildren: TreeNode[] = detail.skills.map((skill) => ({
    key: `skill-${skill.id}`,
    title: skill.name,
    type: 'skillItem' as const,
    dataId: skill.id,
  }));

  // 计划子节点（含任务实例子节点）
  const planChildren: TreeNode[] = detail.plans.map((plan) => ({
    key: `plan-${plan.id}`,
    title: plan.name,
    type: 'planItem' as const,
    dataId: plan.id,
    children: plan.tasks.map((task) => ({
      key: `task-${task.id}`,
      title: formatRelativeTime(task.startedAt) + ' 执行',
      type: 'taskItem' as const,
      dataId: task.id,
    })),
  }));

  // 会话子节点：所有 IM 工具下的 session 直接平铺挂在"会话"节点下
  const sessionChildren: TreeNode[] = detail.imIntegrations.flatMap((im) =>
    im.sessions.map((sess) => ({
      key: `session-${sess.id}`,
      title: sess.name,
      type: 'sessionItem' as const,
      dataId: sess.id,
    }))
  );

  return [
    {
      key: 'setting',
      title: '设定',
      type: 'setting',
    },
    {
      key: 'knowledge',
      title: '知识',
      type: 'knowledge',
    },
    {
      key: 'skill',
      title: '技能',
      type: 'skill',
      children: skillChildren,
    },
    {
      key: 'plan',
      title: '计划',
      type: 'plan',
      children: planChildren,
    },
    {
      key: 'session',
      title: '会话',
      type: 'session',
      children: sessionChildren,
    },
  ];
}

/**
 * 树节点标题渲染：根据节点类型添加图标
 */
const TreeTitle: React.FC<{ node: TreeNode }> = ({ node }) => {
  const iconMap: Partial<Record<string, React.ReactNode>> = {
    setting: <SettingOutlined className="text-gray-400 mr-1.5" />,
    knowledge: <DatabaseOutlined className="text-gray-400 mr-1.5" />,
    skill: <ThunderboltOutlined className="text-gray-400 mr-1.5" />,
    plan: <CalendarOutlined className="text-gray-400 mr-1.5" />,
    session: <MessageOutlined className="text-gray-400 mr-1.5" />,
  };

  return (
    <span className="flex items-center text-sm">
      {iconMap[node.type]}
      <span>{node.title}</span>
    </span>
  );
};

/**
 * 数字员工详情主组件
 */
const EmployeeDetail: React.FC<EmployeeDetailProps> = ({ employeeId, onBack }) => {
  // 加载详情数据（实际场景中从API获取）
  const [detail, setDetail] = useState<DigitalEmployeeDetail>(
    mockEmployeeDetails[employeeId] ?? {
      ...({ id: employeeId, name: '未知', description: '', createdBy: '', createdAt: '', updatedBy: '', updatedAt: '', integrations: [], planCount: 0, taskStats: [] } as any),
      setting: '',
      knowledgeNodes: [],
      knowledgeEdges: [],
      skills: [],
      plans: [],
      imIntegrations: [],
    }
  );

  /** 当前选中的树节点 key */
  const [selectedKey, setSelectedKey] = useState<string>('setting');

  /** 当前展开的任务详情（计划面板通过回调传入，渲染在最右侧第三列） */
  const [activeTask, setActiveTask] = useState<TaskInstance | null>(null);

  /** 树展开的节点 keys */
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['skill', 'plan', 'session']);

  /** 构建树数据 */
  const treeData = useMemo(() => buildTreeData(detail), [detail]);

  /** 将树数据转为 Ant Design Tree 所需格式 */
  const toAntTreeData = (nodes: TreeNode[]): any[] =>
    nodes.map((n) => ({
      key: n.key,
      title: <TreeTitle node={n} />,
      children: n.children ? toAntTreeData(n.children) : undefined,
    }));

  /** 处理树节点选中：切换节点时清除任务详情 */
  const handleSelect = (keys: React.Key[]) => {
    if (keys.length > 0) {
      setSelectedKey(String(keys[0]));
      setActiveTask(null);
    }
  };

  /** 根据选中 key 决定渲染哪个面板 */
  const renderPanel = () => {
    if (selectedKey === 'setting') {
      return (
        <SettingPanel
          setting={detail.setting}
          onSave={(content) => setDetail((prev) => ({ ...prev, setting: content }))}
        />
      );
    }

    if (selectedKey === 'knowledge') {
      return (
        <KnowledgePanel
          nodes={detail.knowledgeNodes}
          edges={detail.knowledgeEdges}
          onUpdate={(nodes, edges) =>
            setDetail((prev) => ({ ...prev, knowledgeNodes: nodes, knowledgeEdges: edges }))
          }
        />
      );
    }

    if (selectedKey === 'skill' || selectedKey.startsWith('skill-')) {
      // 从 key 中提取技能ID
      const skillId = selectedKey.startsWith('skill-')
        ? selectedKey.replace('skill-', '')
        : undefined;
      return (
        <SkillPanel
          skills={detail.skills}
          selectedSkillId={skillId}
          onUpdate={(skills) => setDetail((prev) => ({ ...prev, skills }))}
        />
      );
    }

    if (selectedKey === 'plan' || selectedKey.startsWith('plan-') || selectedKey.startsWith('task-')) {
      const planId = selectedKey.startsWith('plan-') ? selectedKey.replace('plan-', '') : undefined;
      const taskId = selectedKey.startsWith('task-') ? selectedKey.replace('task-', '') : undefined;
      return (
        <PlanPanel
          plans={detail.plans}
          selectedPlanId={planId}
          selectedTaskId={taskId}
          onUpdate={(plans) =>
            setDetail((prev) => ({ ...prev, plans, planCount: plans.length }))
          }
          onOpenTask={(task) => setActiveTask(task)}
        />
      );
    }

    if (selectedKey === 'session' || selectedKey.startsWith('session-')) {
      const sessionId = selectedKey.startsWith('session-')
        ? selectedKey.replace('session-', '')
        : undefined;
      return (
        <SessionPanel
          integrations={detail.imIntegrations}
          selectedSessionId={sessionId}
          onUpdate={(integrations) => setDetail((prev) => ({ ...prev, imIntegrations: integrations }))}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 左侧导航树 */}
      <div className="w-56 border-r border-gray-100 flex flex-col shrink-0">
        {/* 返回按钮 + 数字员工名称 */}
        <div className="px-4 pt-6 pb-4">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
            className="text-gray-500 hover:text-gray-900 -ml-2 mb-4 text-sm"
            size="small"
          >
            返回
          </Button>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-indigo-600 text-xs font-bold">
                {detail.name.charAt(0)}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">{detail.name}</span>
          </div>
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {detail.description}
          </p>
        </div>

        {/* 分隔线 */}
        <div className="mx-4 h-px bg-gray-100 mb-2" />

        {/* 能力树 */}
        <div className="flex-1 overflow-auto px-2 pb-4">
          <Tree
            treeData={toAntTreeData(treeData)}
            selectedKeys={[selectedKey]}
            expandedKeys={expandedKeys}
            onSelect={handleSelect}
            onExpand={(keys) => setExpandedKeys(keys as string[])}
            blockNode
            className="tree-notion-style"
          />
        </div>
      </div>

      {/* 中间内容面板 */}
      <div className="flex-1 overflow-auto min-w-0">
        <div className="max-w-3xl mx-auto px-10 py-10">
          {renderPanel()}
        </div>
      </div>

      {/* 右侧任务详情面板：1/3 宽度，推动整体布局 */}
      {activeTask && (
        <div className="w-1/3 shrink-0 border-l border-gray-100 overflow-hidden">
          <TaskDetailPanel
            task={activeTask}
            onClose={() => setActiveTask(null)}
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeDetail;

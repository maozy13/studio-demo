/**
 * 数字员工「计划」面板
 * 管理数字员工的定时任务、周期任务和条件任务
 * 展示计划执行的任务实例和工件
 */

import React, { useState } from 'react';
import { Button, Tag, Drawer, Input, Tabs, Badge, message } from 'antd';
import {
  ClockCircleOutlined, SyncOutlined, AlertOutlined,
  SendOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileOutlined, CodeOutlined, FilePdfOutlined, GlobalOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { Plan, TaskInstance, Artifact, ChatMessage, PlanTriggerType } from '../../types';
import { formatDateTime, formatRelativeTime, PLAN_TRIGGER_LABELS, TASK_RESULT_LABELS } from '../shared';

interface PlanPanelProps {
  /** 计划列表 */
  plans: Plan[];
  /** 选中的计划ID（来自树节点） */
  selectedPlanId?: string;
  /** 选中的任务实例ID（来自树节点） */
  selectedTaskId?: string;
  /** 更新计划列表回调 */
  onUpdate: (plans: Plan[]) => void;
}

/** 触发类型图标映射 */
const TRIGGER_ICONS: Record<PlanTriggerType, React.ReactNode> = {
  scheduled: <ClockCircleOutlined />,
  periodic: <SyncOutlined />,
  conditional: <AlertOutlined />,
};

/**
 * 工件渲染组件
 * 根据工件类型使用不同组件渲染
 */
const ArtifactViewer: React.FC<{ artifact: Artifact }> = ({ artifact }) => {
  const iconMap: Record<string, React.ReactNode> = {
    code: <CodeOutlined />,
    pdf: <FilePdfOutlined />,
    html: <GlobalOutlined />,
    markdown: <FileOutlined />,
    text: <FileOutlined />,
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{iconMap[artifact.type]}</span>
        <span className="font-medium text-gray-800 text-sm">{artifact.name}</span>
        <Tag bordered={false} color="blue">{artifact.type}</Tag>
      </div>
      {/* 根据类型渲染内容 */}
      {artifact.type === 'markdown' && (
        <div className="prose prose-sm max-w-none prose-gray bg-white rounded-lg p-4 border border-gray-100">
          <ReactMarkdown>{artifact.content}</ReactMarkdown>
        </div>
      )}
      {artifact.type === 'code' && (
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap overflow-auto">
            {artifact.content}
          </pre>
        </div>
      )}
      {artifact.type === 'html' && (
        <iframe
          srcDoc={artifact.content}
          className="w-full h-64 border border-gray-200 rounded-lg"
          sandbox="allow-scripts"
          title={artifact.name}
        />
      )}
      {(artifact.type === 'text' || artifact.type === 'pdf') && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {artifact.content}
        </div>
      )}
    </div>
  );
};

/**
 * 消息气泡：展示任务执行的思考、推理、工具调用流
 */
const MessageBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  const isTool = msg.role === 'tool';

  if (isTool) {
    return (
      <div className="flex items-start gap-2 my-2">
        <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <CodeOutlined className="text-amber-600 text-xs" />
        </div>
        <div className="flex-1 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800 font-mono whitespace-pre-wrap">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} my-2`}>
      {!isUser && (
        <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 mt-1">
          <RobotOutlined className="text-indigo-600 text-xs" />
        </span>
      )}
      <div
        className={`max-w-sm rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
};

/**
 * 任务实例详情抽屉
 */
const TaskDetailDrawer: React.FC<{
  task: TaskInstance | null;
  open: boolean;
  onClose: () => void;
}> = ({ task, open, onClose }) => {
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  React.useEffect(() => {
    if (task) setMessages(task.messages);
  }, [task]);

  if (!task) return null;

  const resultConfig = TASK_RESULT_LABELS[task.result];

  /** 在消息流中追问数字员工 */
  const handleReply = () => {
    if (!replyInput.trim()) return;
    const userMsg: ChatMessage = {
      id: `reply-${Date.now()}`,
      role: 'user',
      content: replyInput,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setReplyInput('');

    // 模拟响应
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `reply-a-${Date.now()}`,
        role: 'assistant',
        content: `关于您的问题「${replyInput}」，根据本次任务执行结果分析：数据显示整体趋势向好，具体细节请参考生成的报告。`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 800);
  };

  const tabs = [
    {
      key: 'messages',
      label: '执行过程',
      children: (
        <div className="flex flex-col h-80">
          <div className="flex-1 overflow-auto space-y-1 mb-3">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
          {/* 追问输入框 */}
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <Input
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              onPressEnter={handleReply}
              placeholder="对执行结果进行追问..."
              size="small"
            />
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleReply} />
          </div>
        </div>
      ),
    },
    {
      key: 'artifacts',
      label: `工件 (${task.artifacts.length})`,
      children: (
        <div className="space-y-4">
          {task.artifacts.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">暂无工件</div>
          ) : (
            task.artifacts.map((art) => (
              <ArtifactViewer key={art.id} artifact={art} />
            ))
          )}
        </div>
      ),
    },
  ];

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <span>任务执行详情</span>
          <Tag color={resultConfig.color} bordered={false}>{resultConfig.label}</Tag>
        </div>
      }
      open={open}
      onClose={onClose}
      width={600}
    >
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-400">
        <span>开始：{formatDateTime(task.startedAt)}</span>
        {task.finishedAt && <span>完成：{formatDateTime(task.finishedAt)}</span>}
      </div>
      <Tabs items={tabs} />
    </Drawer>
  );
};

/**
 * 计划创建对话界面
 */
const PlanCreationChat: React.FC<{
  employeeId: string;
  onDeploy: (plan: Plan) => void;
}> = ({ employeeId, onDeploy }) => {
  const [step, setStep] = useState<'generate' | 'preview' | 'deploy'>('generate');
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: '你好！请告诉我你想创建什么计划，例如：\n- 每天早上9点发送日报\n- 当收到特定消息时执行某任务',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: input, timestamp: new Date().toISOString() };
    setMsgs((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      if (step === 'generate') {
        /** 判断触发类型 */
        let triggerType: PlanTriggerType = 'scheduled';
        let triggerConfig = '0 9 * * *';
        if (input.includes('每') || input.includes('周') || input.includes('月')) {
          triggerType = 'periodic';
          triggerConfig = '0 9 * * 1';
        } else if (input.includes('当') || input.includes('如果') || input.includes('监控')) {
          triggerType = 'conditional';
          triggerConfig = '监听指定条件';
        }

        const plan: Plan = {
          id: `plan-${Date.now()}`,
          name: input.slice(0, 20),
          triggerType,
          triggerConfig,
          employeeId,
          messages: [userMsg],
          tasks: [],
          createdAt: new Date().toISOString(),
        };
        setPendingPlan(plan);

        const aMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `已为您生成计划：**${plan.name}**\n\n- 执行类型：${PLAN_TRIGGER_LABELS[triggerType].label}\n- 执行配置：\`${triggerConfig}\`\n\n您可以说「发布」来启用计划，或继续描述调整。`,
          timestamp: new Date().toISOString(),
        };
        setMsgs((prev) => [...prev, aMsg]);
        setStep('preview');
      } else if (step === 'preview') {
        if (input.includes('发布') || input.includes('启用')) {
          setStep('deploy');
          const dMsg: ChatMessage = {
            id: `d-${Date.now()}`,
            role: 'assistant',
            content: '✅ 计划已成功发布，将按照设定的条件自动执行。',
            timestamp: new Date().toISOString(),
          };
          setMsgs((prev) => [...prev, dMsg]);
          if (pendingPlan) onDeploy(pendingPlan);
        } else {
          const aMsg: ChatMessage = {
            id: `adj-${Date.now()}`,
            role: 'assistant',
            content: '已根据您的调整更新计划配置。满意后请说「发布」来启用。',
            timestamp: new Date().toISOString(),
          };
          setMsgs((prev) => [...prev, aMsg]);
        }
      }
    }, 600);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 步骤 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg text-xs">
        {(['generate', 'preview', 'deploy'] as const).map((s, i) => {
          const labels = { generate: '生成计划', preview: '预览计划', deploy: '发布计划' };
          const active = step === s;
          const done = (s === 'generate' && ['preview', 'deploy'].includes(step)) || (s === 'preview' && step === 'deploy');
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className="flex-1 h-px bg-gray-200" />}
              <div className={`flex items-center gap-1.5 ${active ? 'text-indigo-600 font-medium' : done ? 'text-gray-400' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${active ? 'border-indigo-400 bg-indigo-50' : done ? 'border-gray-300 bg-gray-100' : 'border-gray-200'}`}>{i + 1}</span>
                {labels[s]}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto space-y-2 mb-3">
        {msgs.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                <RobotOutlined className="text-indigo-600 text-xs" />
              </span>
            )}
            <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {step !== 'deploy' && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder={step === 'generate' ? '描述你想创建的计划...' : '调整计划或输入「发布」'}
            size="small"
          />
          <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} />
        </div>
      )}
    </div>
  );
};

/**
 * 计划面板主组件
 */
const PlanPanel: React.FC<PlanPanelProps> = ({ plans, selectedTaskId, onUpdate }) => {
  const [taskDrawer, setTaskDrawer] = useState<TaskInstance | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // 如果外部选中了任务实例，自动打开抽屉
  React.useEffect(() => {
    if (selectedTaskId) {
      for (const plan of plans) {
        const task = plan.tasks.find((t) => t.id === selectedTaskId);
        if (task) { setTaskDrawer(task); break; }
      }
    }
  }, [selectedTaskId, plans]);

  /** 发布新计划 */
  const handleDeploy = (plan: Plan) => {
    onUpdate([plan, ...plans]);
    setActiveTab('list');
    message.success(`计划「${plan.name}」已发布`);
  };

  /** 计划列表 Tab */
  const listTab = (
    <div className="space-y-4">
      {plans.length === 0 ? (
        <div className="text-center text-gray-400 text-sm py-12">
          <ClockCircleOutlined className="text-2xl mb-2 block" />
          暂无计划，点击「创建计划」添加第一个计划
        </div>
      ) : (
        plans.map((plan) => (
          <div key={plan.id} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* 计划头部 */}
            <div className="flex items-center justify-between p-4 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{TRIGGER_ICONS[plan.triggerType]}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 text-sm">{plan.name}</span>
                    <Tag
                      color={PLAN_TRIGGER_LABELS[plan.triggerType].color}
                      bordered={false}
                      className="text-xs"
                    >
                      {PLAN_TRIGGER_LABELS[plan.triggerType].label}
                    </Tag>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">{plan.triggerConfig}</span>
                </div>
              </div>
              <Badge count={plan.tasks.length} color="blue" />
            </div>

            {/* 任务实例列表 */}
            {plan.tasks.length > 0 && (
              <div className="divide-y divide-gray-100">
                {plan.tasks.map((task) => {
                  const result = TASK_RESULT_LABELS[task.result];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setTaskDrawer(task)}
                    >
                      <div className="flex items-center gap-2">
                        {task.result === 'success' ? (
                          <CheckCircleOutlined className="text-green-500" />
                        ) : task.result === 'failure' ? (
                          <CloseCircleOutlined className="text-red-500" />
                        ) : (
                          <SyncOutlined spin className="text-blue-500" />
                        )}
                        <span className="text-sm text-gray-700">
                          {formatRelativeTime(task.startedAt)}执行
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {task.artifacts.length > 0 && (
                          <span>{task.artifacts.length} 个工件</span>
                        )}
                        <Tag color={result.color} bordered={false}>{result.label}</Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const tabs = [
    { key: 'list', label: '计划列表', children: listTab },
    {
      key: 'create',
      label: '创建计划',
      children: (
        <div className="h-96">
          <PlanCreationChat employeeId="emp-001" onDeploy={handleDeploy} />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">计划</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          在满足时间条件或逻辑条件时自动执行的任务计划，支持定时、周期、条件三种执行模式
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} className="flex-1" />

      <TaskDetailDrawer
        task={taskDrawer}
        open={!!taskDrawer}
        onClose={() => setTaskDrawer(null)}
      />
    </div>
  );
};

export default PlanPanel;

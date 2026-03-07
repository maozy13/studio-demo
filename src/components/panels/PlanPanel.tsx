/**
 * 数字员工「计划」面板
 * 管理数字员工的定时任务、周期任务和条件任务
 * 展示计划执行的任务实例和工件
 */

import React, { useState } from 'react';
import { Button, Tag, Input, Tabs, Badge, message } from 'antd';
import {
  ClockCircleOutlined, SyncOutlined, AlertOutlined,
  SendOutlined, RobotOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileOutlined, CodeOutlined, FilePdfOutlined, GlobalOutlined,
  CloseOutlined,
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
  /** 通知父组件打开任务详情（父组件负责渲染 TaskDetailPanel） */
  onOpenTask?: (task: TaskInstance | null) => void;
}

/** 触发类型图标映射 */
const TRIGGER_ICONS: Record<PlanTriggerType, React.ReactNode> = {
  scheduled: <ClockCircleOutlined />,
  periodic: <SyncOutlined />,
  conditional: <AlertOutlined />,
};

/**
 * 基于用户输入推断计划触发方式
 * 说明：这是一个轻量规则推断，便于演示“继续对话调整计划模式/内容”
 */
function inferTriggerFromText(
  text: string,
  fallbackType: PlanTriggerType = 'scheduled',
  fallbackConfig = '0 9 * * *',
): { triggerType: PlanTriggerType; triggerConfig: string } {
  const normalized = text.trim();
  let triggerType = fallbackType;
  let triggerConfig = fallbackConfig;

  // 关键条件：出现“当/如果/监控”等词，优先识别为条件触发
  if (/(当|如果|监控|触发时|达到)/.test(normalized)) {
    triggerType = 'conditional';
    triggerConfig = '监听指定条件';
    return { triggerType, triggerConfig };
  }

  // 关键条件：出现“每天/每周/每月”等词，识别为周期触发
  if (/(每天|每周|每月|每个|每逢|每)/.test(normalized)) {
    triggerType = 'periodic';
    triggerConfig = '0 9 * * 1';
    return { triggerType, triggerConfig };
  }

  // 关键条件：出现“几点/今天/明天”等时间描述，识别为定时触发
  if (/(今天|明天|后天|点|:|：|定时)/.test(normalized)) {
    triggerType = 'scheduled';
    triggerConfig = '0 9 * * *';
  }

  return { triggerType, triggerConfig };
}

/**
 * 从输入中提取计划名（优先取用户输入前20字符）
 */
function inferPlanNameFromText(text: string, fallbackName: string): string {
  const name = text.trim().slice(0, 20);
  return name || fallbackName;
}

/**
 * 仅在用户明确提出“改名/命名”时提取计划名，避免普通调整语句误改名称
 */
function inferExplicitPlanNameFromText(text: string, fallbackName: string): string {
  const matched = text.match(/(?:计划名称|命名为|改名为|名称改为|名字改为|叫做?)\s*[:：]?\s*([^\n，。]+)/);
  if (!matched?.[1]) return fallbackName;
  const name = matched[1].trim().slice(0, 20);
  return name || fallbackName;
}

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
 * 任务实例详情内联面板
 * 以右侧 1/3 分栏形式展示，替代原 Drawer
 * 包含：执行过程消息流（支持追问）、工件列表
 */
export const TaskDetailPanel: React.FC<{
  task: TaskInstance;
  onClose: () => void;
}> = ({ task, onClose }) => {
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(task.messages);

  /** 切换不同任务时重置消息列表 */
  React.useEffect(() => {
    setMessages(task.messages);
    setReplyInput('');
  }, [task.id]);

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
        <div className="flex flex-col" style={{ height: 'calc(100% - 0px)' }}>
          <div className="flex-1 overflow-auto space-y-1 mb-3 min-h-0">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t border-gray-100 shrink-0">
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
        <div className="space-y-4 overflow-auto">
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
    <div className="flex flex-col h-full border-l border-gray-100">
      {/* 面板头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">任务详情</span>
          <Tag color={resultConfig.color} bordered={false} className="text-xs">
            {resultConfig.label}
          </Tag>
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700"
        />
      </div>

      {/* 时间信息 */}
      <div className="px-5 py-2.5 flex gap-4 text-xs text-gray-400 border-b border-gray-50 shrink-0">
        <span>开始：{formatDateTime(task.startedAt)}</span>
        {task.finishedAt && <span>完成：{formatDateTime(task.finishedAt)}</span>}
      </div>

      {/* Tab 内容 */}
      <div className="flex-1 overflow-hidden px-5 pt-2">
        <Tabs
          items={tabs}
          size="small"
          className="h-full [&_.ant-tabs-content-holder]:overflow-auto [&_.ant-tabs-content]:h-full [&_.ant-tabs-tabpane]:h-full"
        />
      </div>
    </div>
  );
};

/**
 * 计划创建对话界面
 */
/**
 * 计划创建对话界面
 * 分三步：生成计划 → 预览计划（支持立即执行测试）→ 发布计划
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
  /** 是否正在模拟立即执行 */
  const [isRunning, setIsRunning] = useState(false);

  /**
   * 追加消息到对话流，并可选同步到待发布计划
   */
  const appendMessage = (msg: ChatMessage, syncPendingPlan = true) => {
    setMsgs((prev) => [...prev, msg]);
    if (syncPendingPlan) {
      setPendingPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, msg],
        };
      });
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userInput = input.trim();
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: userInput, timestamp: new Date().toISOString() };
    appendMessage(userMsg, step !== 'generate');
    setInput('');

    setTimeout(() => {
      if (step === 'generate') {
        const { triggerType, triggerConfig } = inferTriggerFromText(userInput, 'scheduled', '0 9 * * *');
        const planName = inferPlanNameFromText(userInput, '新计划');

        const plan: Plan = {
          id: `plan-${Date.now()}`,
          name: planName,
          triggerType,
          triggerConfig,
          employeeId,
          messages: [...msgs, userMsg],
          tasks: [],
          createdAt: new Date().toISOString(),
        };

        const aMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: `已为您生成计划：**${plan.name}**\n\n- 执行类型：${PLAN_TRIGGER_LABELS[triggerType].label}\n- 执行配置：\`${triggerConfig}\`\n\n**预览阶段**：您可以点击「立即执行」来测试计划效果，也可以继续对话调整计划内容。`,
          timestamp: new Date().toISOString(),
        };
        setPendingPlan({
          ...plan,
          messages: [...plan.messages, aMsg],
        });
        appendMessage(aMsg, false);
        setStep('preview');
      } else if (step === 'preview') {
        const currentPlan = pendingPlan;
        if (!currentPlan) return;
        const { triggerType, triggerConfig } = inferTriggerFromText(
          userInput,
          currentPlan.triggerType,
          currentPlan.triggerConfig,
        );

        const aMsg: ChatMessage = {
          id: `adj-${Date.now()}`,
          role: 'assistant',
          content:
            `已根据您的描述更新计划配置：\n\n- 执行类型：${PLAN_TRIGGER_LABELS[triggerType].label}\n- 执行配置：\`${triggerConfig}\`\n\n您可以继续调整，或点击「立即执行」测试，满意后点击「发布计划」。`,
          timestamp: new Date().toISOString(),
        };

        setPendingPlan((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            triggerType,
            triggerConfig,
            messages: [...prev.messages, aMsg],
          };
        });
        appendMessage(aMsg, false);
      }
    }, 600);
  };

  /**
   * 立即执行：模拟计划立即触发执行，测试效果
   * 在消息流中追加模拟的执行过程消息
   */
  const handleRunNow = () => {
    if (isRunning) return;
    setIsRunning(true);
    const startMsg: ChatMessage = {
      id: `run-start-${Date.now()}`,
      role: 'assistant',
      content: '▶ 正在立即执行计划，测试执行效果...',
      timestamp: new Date().toISOString(),
    };
    appendMessage(startMsg);

    setTimeout(() => {
      const resultMsg: ChatMessage = {
        id: `run-result-${Date.now()}`,
        role: 'assistant',
        content: '✅ **立即执行完成！**\n\n执行过程正常，计划逻辑运行无误。您可以点击「发布计划」正式启用。',
        timestamp: new Date().toISOString(),
      };
      appendMessage(resultMsg);
      setIsRunning(false);
    }, 1500);
  };

  /** 确认发布计划 */
  const handlePublish = () => {
    if (!pendingPlan) return;
    setStep('deploy');
    const dMsg: ChatMessage = {
      id: `d-${Date.now()}`,
      role: 'assistant',
      content: '✅ 计划已成功发布，将按照设定的条件自动执行。',
      timestamp: new Date().toISOString(),
    };
    const deployedPlan: Plan = {
      ...pendingPlan,
      messages: [...pendingPlan.messages, dMsg],
    };
    appendMessage(dMsg, false);
    setPendingPlan(deployedPlan);
    onDeploy(deployedPlan);
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

      {step === 'generate' && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder="描述你想创建的计划..."
            size="small"
          />
          <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} />
        </div>
      )}
      {step === 'preview' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
              placeholder="继续对话调整计划内容..."
              size="small"
            />
            <Button size="small" type="primary" icon={<SendOutlined />} onClick={handleSend} disabled={!input.trim()} />
          </div>
          <div className="flex gap-2">
            {/* 立即执行：测试计划效果 */}
            <Button
              size="small"
              block
              icon={<SyncOutlined spin={isRunning} />}
              onClick={handleRunNow}
              disabled={isRunning}
            >
              {isRunning ? '执行中...' : '立即执行'}
            </Button>
            {/* 发布计划：正式启用 */}
            <Button
              size="small"
              type="primary"
              block
              onClick={handlePublish}
              disabled={isRunning}
            >
              发布计划
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 计划详情视图
 * 展示单个计划的名称（可编辑）、创建时的对话、以及历史任务实例列表
 * 点击执行记录时通过 onOpenTask 回调通知父组件（父组件负责渲染详情面板）
 */
const PlanDetail: React.FC<{
  plan: Plan;
  onUpdateName: (planId: string, newName: string) => void;
  onUpdatePlan: (planId: string, patch: Partial<Pick<Plan, 'name' | 'triggerType' | 'triggerConfig' | 'messages'>>) => void;
  /** 当前选中的任务ID（由父组件控制） */
  activeTaskId?: string;
  /** 通知父组件打开/关闭任务详情 */
  onOpenTask: (task: TaskInstance | null) => void;
}> = ({ plan, onUpdateName, onUpdatePlan, activeTaskId, onOpenTask }) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(plan.name);
  const [adjustInput, setAdjustInput] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  /**
   * 继续对话调整计划执行模式/内容
   */
  const handleAdjustPlan = () => {
    if (!adjustInput.trim() || isAdjusting) return;
    const userInput = adjustInput.trim();
    const userMsg: ChatMessage = {
      id: `plan-detail-u-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString(),
    };
    const { triggerType, triggerConfig } = inferTriggerFromText(
      userInput,
      plan.triggerType,
      plan.triggerConfig,
    );
    const nextName = inferExplicitPlanNameFromText(userInput, plan.name);
    setAdjustInput('');
    setIsAdjusting(true);

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `plan-detail-a-${Date.now()}`,
        role: 'assistant',
        content:
          `已更新计划：\n\n- 计划名称：${nextName}\n- 执行类型：${PLAN_TRIGGER_LABELS[triggerType].label}\n- 执行配置：\`${triggerConfig}\`\n\n可继续发送需求，我会继续微调。`,
        timestamp: new Date().toISOString(),
      };

      onUpdatePlan(plan.id, {
        name: nextName,
        triggerType,
        triggerConfig,
        messages: [...plan.messages, userMsg, assistantMsg],
      });
      setIsAdjusting(false);
    }, 500);
  };

  /** 保存计划名称 */
  const handleSaveName = () => {
    if (nameValue.trim()) {
      onUpdateName(plan.id, nameValue.trim());
    } else {
      setNameValue(plan.name);
    }
    setEditingName(false);
  };

  return (
    <div className="space-y-6">
      {/* 计划名称（可内联编辑） */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400">{TRIGGER_ICONS[plan.triggerType]}</span>
        {editingName ? (
          <Input
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onPressEnter={handleSaveName}
            onBlur={handleSaveName}
            autoFocus
            className="text-base font-semibold"
            size="small"
          />
        ) : (
          <h3
            className="text-base font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => setEditingName(true)}
            title="点击编辑计划名称"
          >
            {plan.name}
          </h3>
        )}
        <Tag
          color={PLAN_TRIGGER_LABELS[plan.triggerType].color}
          bordered={false}
          className="text-xs"
        >
          {PLAN_TRIGGER_LABELS[plan.triggerType].label}
        </Tag>
      </div>

      {/* 执行配置 */}
      <div className="bg-gray-50 rounded-lg px-4 py-2.5 text-xs text-gray-500 font-mono">
        {plan.triggerConfig}
      </div>

      {/* 对话记录：保留创建阶段全量消息，并支持继续调整 */}
      {plan.messages.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-3">计划对话</h4>
          <div className="space-y-2">
            {plan.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 shrink-0 mt-1">
                    <RobotOutlined className="text-indigo-600 text-xs" />
                  </span>
                )}
                <div
                  className={`max-w-sm rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Input
              value={adjustInput}
              onChange={(e) => setAdjustInput(e.target.value)}
              onPressEnter={handleAdjustPlan}
              placeholder="继续对话以调整执行模式或计划内容..."
              size="small"
              disabled={isAdjusting}
            />
            <Button
              size="small"
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAdjustPlan}
              disabled={!adjustInput.trim() || isAdjusting}
              loading={isAdjusting}
            />
          </div>
        </div>
      )}

      {/* 任务实例列表 */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-3">
          执行记录
          <span className="ml-2 font-normal text-gray-400">{plan.tasks.length} 次</span>
        </h4>
        {plan.tasks.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-6">暂无执行记录</div>
        ) : (
          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {plan.tasks.map((task) => {
              const result = TASK_RESULT_LABELS[task.result];
              const isActive = activeTaskId === task.id;
              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                    isActive ? 'bg-indigo-50 border-l-2 border-indigo-400' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onOpenTask(isActive ? null : task)}
                >
                  <div className="flex items-center gap-2">
                    {task.result === 'success' ? (
                      <CheckCircleOutlined className="text-green-500" />
                    ) : task.result === 'failure' ? (
                      <CloseCircleOutlined className="text-red-500" />
                    ) : (
                      <SyncOutlined spin className="text-blue-500" />
                    )}
                    <span className={`text-sm ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
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
    </div>
  );
};

/**
 * 计划面板主组件
 * 根据 selectedPlanId 决定展示计划列表或单个计划详情
 */
const PlanPanel: React.FC<PlanPanelProps> = ({ plans, selectedPlanId, selectedTaskId, onUpdate, onOpenTask }) => {
  /** 当前在列表视图中高亮的任务ID */
  const [listActiveTaskId, setListActiveTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  /** 发布新计划 */
  const handleDeploy = (plan: Plan) => {
    onUpdate([plan, ...plans]);
    setActiveTab('list');
    message.success(`计划「${plan.name}」已发布`);
  };

  /** 更新计划名称 */
  const handleUpdatePlanName = (planId: string, newName: string) => {
    onUpdate(plans.map((p) => p.id === planId ? { ...p, name: newName } : p));
  };

  /** 更新计划的执行配置或对话历史 */
  const handleUpdatePlan = (
    planId: string,
    patch: Partial<Pick<Plan, 'name' | 'triggerType' | 'triggerConfig' | 'messages'>>,
  ) => {
    onUpdate(plans.map((p) => p.id === planId ? { ...p, ...patch } : p));
  };

  // 如果外部选中了某个计划，展示计划详情视图
  const selectedPlan = selectedPlanId ? plans.find((p) => p.id === selectedPlanId) : undefined;
  if (selectedPlan) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">计划</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            点击计划名称可直接编辑，点击执行记录查看详情
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <PlanDetail
            plan={selectedPlan}
            onUpdateName={handleUpdatePlanName}
            onUpdatePlan={handleUpdatePlan}
            activeTaskId={selectedTaskId}
            onOpenTask={(task) => onOpenTask?.(task)}
          />
        </div>
      </div>
    );
  }

  /** 计划列表 Tab */
  const listTab = (
    <div className="space-y-4 overflow-auto h-full">
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
                    const isActive = listActiveTaskId === task.id;
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                          isActive ? 'bg-indigo-50 border-l-2 border-indigo-400' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const next = isActive ? null : task;
                          setListActiveTaskId(next?.id ?? null);
                          onOpenTask?.(next);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {task.result === 'success' ? (
                            <CheckCircleOutlined className="text-green-500" />
                          ) : task.result === 'failure' ? (
                            <CloseCircleOutlined className="text-red-500" />
                          ) : (
                            <SyncOutlined spin className="text-blue-500" />
                          )}
                          <span className={`text-sm ${isActive ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
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
      <div className="mb-6 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">计划</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          在满足时间条件或逻辑条件时自动执行的任务计划，支持定时、周期、条件三种执行模式
        </p>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabs} className="flex-1 overflow-hidden" />
    </div>
  );
};

export default PlanPanel;

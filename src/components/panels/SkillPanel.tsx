/**
 * 数字员工「技能」面板
 * 展示已配置的技能列表，支持查看技能详情（名称、描述、脚本）
 * 支持通过自然语言对话调用「技能智能体」创建新技能
 */

import React, { useState } from 'react';
import { Button, Drawer, Tag, Tabs, Input, message } from 'antd';
import {
  CodeOutlined, SendOutlined, RobotOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import type { Skill, ChatMessage } from '../../types';
import { formatDateTime } from '../shared';

interface SkillPanelProps {
  /** 当前数字员工已配置的技能列表 */
  skills: Skill[];
  /** 选中的技能 ID（来自树节点点击） */
  selectedSkillId?: string;
  /** 更新技能列表回调 */
  onUpdate: (skills: Skill[]) => void;
}

/**
 * 技能详情抽屉：展示技能名称、描述、可选脚本
 */
const SkillDetailDrawer: React.FC<{
  skill: Skill | null;
  open: boolean;
  onClose: () => void;
}> = ({ skill, open, onClose }) => {
  const [scriptOpen, setScriptOpen] = useState(false);

  if (!skill) return null;

  return (
    <Drawer
      title={<span className="font-semibold">{skill.name}</span>}
      open={open}
      onClose={onClose}
      width={560}
      className="skill-drawer"
    >
      <div className="space-y-6">
        {/* 技能描述 */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">技能描述</h4>
          <div className="prose prose-sm max-w-none prose-gray bg-gray-50 rounded-lg p-4">
            <ReactMarkdown>{skill.description}</ReactMarkdown>
          </div>
        </div>

        {/* 脚本（可选展示） */}
        {skill.script && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-600">脚本</h4>
              <Button
                type="text"
                size="small"
                icon={<CodeOutlined />}
                onClick={() => setScriptOpen(!scriptOpen)}
                className="text-gray-500"
              >
                {scriptOpen ? '收起' : '展开'}
              </Button>
            </div>
            {scriptOpen && (
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-green-300 font-mono whitespace-pre-wrap">
                  {skill.script}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 元信息 */}
        <div className="pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
          <p>创建时间：{formatDateTime(skill.createdAt)}</p>
          <p>语言：{skill.scriptLanguage ?? '无脚本'}</p>
        </div>
      </div>
    </Drawer>
  );
};

/**
 * 技能创建对话界面
 * 通过自然语言与「技能智能体」对话来创建新技能
 * 分三步：生成技能 → 预览技能 → 部署技能
 */
const SkillCreationChat: React.FC<{
  employeeId: string;
  onDeploy: (skill: Skill) => void;
}> = ({ employeeId, onDeploy }) => {
  /** 创建步骤：generate → preview → deploy */
  const [step, setStep] = useState<'generate' | 'preview' | 'deploy'>('generate');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: '你好！我是技能智能体。请告诉我你想创建什么技能，我会帮你生成技能描述和脚本。',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [pendingSkill, setPendingSkill] = useState<Skill | null>(null);

  /** 发送消息给技能智能体 */
  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // 模拟智能体响应
    setTimeout(() => {
      if (step === 'generate') {
        // 生成阶段：模拟生成技能
        const generated: Skill = {
          id: `sk-${Date.now()}`,
          name: `${input.slice(0, 20)} 技能`,
          description: `## 技能描述\n\n根据您的需求生成的技能：${input}\n\n## 执行步骤\n\n1. 分析输入数据\n2. 执行核心逻辑\n3. 返回处理结果`,
          script: `def execute(input_data: dict) -> dict:\n    """\n    技能执行函数\n    :param input_data: 输入数据\n    :return: 执行结果\n    """\n    # TODO: 实现具体逻辑\n    return {"status": "success", "result": input_data}`,
          scriptLanguage: 'python',
          employeeId,
          createdAt: new Date().toISOString(),
        };
        setPendingSkill(generated);

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-a`,
          role: 'assistant',
          content: `已为您生成技能：**${generated.name}**\n\n包含技能描述和 Python 脚本。您可以：\n- 直接说「发布」来部署技能\n- 或继续对话调整技能内容`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStep('preview');
      } else if (step === 'preview') {
        if (input.includes('发布') || input.includes('部署')) {
          setStep('deploy');
          const deployMsg: ChatMessage = {
            id: `msg-${Date.now()}-d`,
            role: 'assistant',
            content: '✅ 技能已成功发布！该技能现在可以被其他数字员工检索和使用。',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, deployMsg]);
          if (pendingSkill) onDeploy(pendingSkill);
        } else {
          const adjustMsg: ChatMessage = {
            id: `msg-${Date.now()}-adj`,
            role: 'assistant',
            content: '好的，我已根据您的要求调整了技能描述。如果满意，请说「发布」来部署技能。',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, adjustMsg]);
        }
      }
    }, 800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 步骤指示器 */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
        {(['generate', 'preview', 'deploy'] as const).map((s, i) => {
          const labels = { generate: '生成技能', preview: '预览技能', deploy: '部署技能' };
          const active = step === s;
          const done =
            (s === 'generate' && ['preview', 'deploy'].includes(step)) ||
            (s === 'preview' && step === 'deploy');
          return (
            <React.Fragment key={s}>
              {i > 0 && <div className="flex-1 h-px bg-gray-200" />}
              <div className={`flex items-center gap-1.5 text-xs ${active ? 'text-indigo-600 font-medium' : done ? 'text-gray-400' : 'text-gray-300'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${active ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : done ? 'border-gray-300 bg-gray-100' : 'border-gray-200'}`}>
                  {i + 1}
                </span>
                {labels[s]}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-auto space-y-3 mb-4 px-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs mr-2 shrink-0 mt-1">
                <RobotOutlined />
              </span>
            )}
            <div
              className={`max-w-xs rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
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

      {/* 输入框 */}
      {step !== 'deploy' && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder={step === 'generate' ? '描述你想创建的技能...' : '继续调整或输入「发布」部署技能'}
            className="rounded-lg"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!input.trim()}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 技能面板主组件
 */
const SkillPanel: React.FC<SkillPanelProps> = ({ skills, selectedSkillId, onUpdate }) => {
  const [drawerSkill, setDrawerSkill] = useState<Skill | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // 如果外部选中了某个技能，自动打开抽屉
  React.useEffect(() => {
    if (selectedSkillId) {
      const found = skills.find((s) => s.id === selectedSkillId);
      if (found) setDrawerSkill(found);
    }
  }, [selectedSkillId, skills]);

  /** 部署新技能：插入到列表头部 */
  const handleDeploy = (skill: Skill) => {
    onUpdate([skill, ...skills]);
    setActiveTab('list');
    message.success(`技能「${skill.name}」已发布`);
  };

  const tabs = [
    {
      key: 'list',
      label: '已配置技能',
      children: (
        <div>
          {skills.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-12">
              <ThunderboltOutlined className="text-2xl mb-2 block" />
              暂无技能，点击「创建技能」添加第一个技能
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-all group"
                  onClick={() => setDrawerSkill(skill)}
                >
                  <div className="flex items-center gap-3">
                    <ThunderboltOutlined className="text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{skill.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{skill.description.slice(0, 60)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {skill.script && <Tag color="blue" bordered={false}>脚本</Tag>}
                    <Tag color="green" bordered={false}>{skill.scriptLanguage ?? 'markdown'}</Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'create',
      label: '创建技能',
      children: (
        <div className="h-96">
          <SkillCreationChat employeeId="emp-001" onDeploy={handleDeploy} />
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">技能</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          面向智能体的指令集，教会数字员工如何执行特定任务。执行时还将通过 BKN 动态检索技能
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        className="flex-1"
      />

      {/* 技能详情抽屉 */}
      <SkillDetailDrawer
        skill={drawerSkill}
        open={!!drawerSkill}
        onClose={() => setDrawerSkill(null)}
      />
    </div>
  );
};

export default SkillPanel;

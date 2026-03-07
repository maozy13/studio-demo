/**
 * 数字员工「技能」面板
 * 展示已配置的技能列表，支持查看技能详情（名称、描述、脚本）
 * 支持通过自然语言对话调用「技能智能体」创建新技能
 */

import React, { useState, useRef, useEffect } from 'react';
import { Button, Tag, Tabs, Input, Modal, Form, message } from 'antd';
import {
  CodeOutlined, SendOutlined, RobotOutlined, ThunderboltOutlined,
  ArrowLeftOutlined,
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
 * 技能测试对话框
 * 用户可在技能详情下方直接发送消息，测试技能的实际执行效果
 */
const SkillTestChat: React.FC<{ skillName: string }> = ({ skillName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `你好！我已准备好执行「${skillName}」技能。请告诉我你想测试什么，或直接提供输入数据。`,
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  /** 消息列表末尾锚点，用于自动滚动到最新消息 */
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** 发送测试消息，模拟技能执行返回结果 */
  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `**技能执行完成**\n\n输入：\`${userMsg.content}\`\n\n执行结果：\n\`\`\`json\n{"status": "success", "result": "已处理输入，技能运行正常"}\n\`\`\``,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, replyMsg]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
        <RobotOutlined className="text-indigo-400 text-xs" />
        <span className="text-xs font-medium text-gray-600">技能测试</span>
      </div>

      {/* 消息流 */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-3 max-h-64 min-h-32">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs mr-2 shrink-0 mt-0.5">
                <RobotOutlined />
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
        {/* 加载占位 */}
        {loading && (
          <div className="flex justify-start">
            <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs mr-2 shrink-0 mt-0.5">
              <RobotOutlined />
            </span>
            <div className="bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-400">
              执行中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 输入框 */}
      <div className="px-3 py-2.5 border-t border-gray-100 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={handleSend}
          placeholder="输入测试数据或指令..."
          size="small"
          disabled={loading}
          className="rounded-lg"
        />
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={!input.trim() || loading}
        />
      </div>
    </div>
  );
};

/**
 * 技能详情内联视图
 * 替代原 Drawer，以弹性伸缩方式内联在面板中展示
 * 包含：技能描述、可选脚本、元信息、测试对话框
 */
const SkillDetailView: React.FC<{
  skill: Skill;
  onBack: () => void;
}> = ({ skill, onBack }) => {
  const [scriptOpen, setScriptOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* 顶部返回 + 技能名 */}
      <div className="flex items-center gap-2">
        <Button
          type="text"
          size="small"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="text-gray-400 hover:text-gray-700 -ml-1"
        />
        <ThunderboltOutlined className="text-indigo-400" />
        <h3 className="text-base font-semibold text-gray-900">{skill.name}</h3>
        {skill.version && (
          <Tag bordered={false} color="blue" className="text-xs">{skill.version}</Tag>
        )}
        {skill.script && (
          <Tag bordered={false} color="green" className="text-xs">{skill.scriptLanguage ?? 'script'}</Tag>
        )}
      </div>

      {/* 技能描述 */}
      <div>
        <h4 className="text-xs font-medium text-gray-500 mb-2">技能描述</h4>
        <div className="prose prose-sm max-w-none prose-gray bg-gray-50 rounded-lg p-4">
          <ReactMarkdown>{skill.description}</ReactMarkdown>
        </div>
      </div>

      {/* 脚本（折叠展示） */}
      {skill.script && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-gray-500">脚本</h4>
            <Button
              type="text"
              size="small"
              icon={<CodeOutlined />}
              onClick={() => setScriptOpen(!scriptOpen)}
              className="text-gray-400 hover:text-gray-700"
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
      <div className="text-xs text-gray-400 space-y-0.5">
        <p>创建时间：{formatDateTime(skill.createdAt)}</p>
        {skill.publishDescription && <p>发布描述：{skill.publishDescription}</p>}
      </div>

      {/* 技能测试对话框 */}
      <SkillTestChat skillName={skill.name} />
    </div>
  );
};

/**
 * 技能发布弹窗
 * 用户一键发布前需填写版本号和发布描述
 */
const PublishSkillModal: React.FC<{
  open: boolean;
  skillName: string;
  onOk: (version: string, publishDescription: string) => void;
  onCancel: () => void;
}> = ({ open, skillName, onOk, onCancel }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk(values.version, values.publishDescription);
    form.resetFields();
  };

  return (
    <Modal
      title="发布技能"
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText="确认发布"
      cancelText="取消"
      width={440}
    >
      <div className="mb-4 text-sm text-gray-600">
        发布技能 <span className="font-semibold text-gray-900">「{skillName}」</span>，发布后可被其他数字员工检索使用。
      </div>
      <Form form={form} layout="vertical" initialValues={{ version: 'v0.0.1' }}>
        {/* 版本号：自动递增，遵循语义版本规则 */}
        <Form.Item
          name="version"
          label="版本号"
          rules={[
            { required: true, message: '请输入版本号' },
            { pattern: /^v\d+\.\d+\.\d+$/, message: '版本号格式为 v0.0.1' },
          ]}
        >
          <Input placeholder="v0.0.1" />
        </Form.Item>
        {/* 发布描述：必填，不超过400字 */}
        <Form.Item
          name="publishDescription"
          label="发布描述"
          rules={[
            { required: true, message: '请输入发布描述' },
            { max: 400, message: '发布描述不超过400字' },
          ]}
        >
          <Input.TextArea
            placeholder="描述此版本技能的功能和变更..."
            rows={3}
            maxLength={400}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 技能创建对话界面
 * 通过自然语言与「技能智能体」对话来创建新技能
 * 分三步：生成技能 → 预览技能 → 部署技能
 * 预览步骤：用户可通过对话下达调用指令测试技能效果
 * 部署步骤：填写版本号和发布描述后一键发布
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
  /** 控制发布弹窗显示 */
  const [publishModalOpen, setPublishModalOpen] = useState(false);

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
        // 生成阶段：模拟技能智能体生成技能描述和脚本
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
          content: `已为您生成技能：**${generated.name}**\n\n包含技能描述和 Python 脚本。\n\n**预览阶段**：您可以通过对话下达调用指令来测试技能效果，满意后点击「发布技能」按钮进行发布。`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStep('preview');
      } else if (step === 'preview') {
        // 预览阶段：模拟技能执行，响应测试指令
        const previewMsg: ChatMessage = {
          id: `msg-${Date.now()}-p`,
          role: 'assistant',
          content: `好的，正在模拟执行技能...\n\n**执行结果**：\n\`\`\`json\n{"status": "success", "result": "技能执行成功，输入已处理"}\n\`\`\`\n\n技能运行正常，如需调整请继续描述，满意后点击「发布技能」按钮。`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, previewMsg]);
      }
    }, 800);
  };

  /** 确认发布：填写版本号和发布描述 */
  const handlePublish = (version: string, publishDescription: string) => {
    if (!pendingSkill) return;
    const deployedSkill: Skill = { ...pendingSkill, version, publishDescription };
    setPublishModalOpen(false);
    setStep('deploy');
    const deployMsg: ChatMessage = {
      id: `msg-${Date.now()}-d`,
      role: 'assistant',
      content: `✅ 技能已成功发布！\n\n- **版本**：${version}\n- **描述**：${publishDescription}\n\n该技能现在可以被其他数字员工检索和使用。`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, deployMsg]);
    onDeploy(deployedSkill);
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

      {/* 输入框 + 发布按钮 */}
      {step === 'generate' && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={handleSend}
            placeholder="描述你想创建的技能..."
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
      {step === 'preview' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPressEnter={handleSend}
              placeholder="输入测试指令验证技能效果..."
              className="rounded-lg"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim()}
            />
          </div>
          {/* 预览满意后点击发布技能 */}
          <Button
            type="primary"
            block
            onClick={() => setPublishModalOpen(true)}
            disabled={!pendingSkill}
          >
            发布技能
          </Button>
        </div>
      )}

      {/* 发布弹窗：填写版本号和发布描述 */}
      <PublishSkillModal
        open={publishModalOpen}
        skillName={pendingSkill?.name ?? ''}
        onOk={handlePublish}
        onCancel={() => setPublishModalOpen(false)}
      />
    </div>
  );
};

/**
 * 技能面板主组件
 * 点击技能列表项后，以内联弹性伸缩方式切换到技能详情+测试视图
 * 点击「返回」回到列表
 */
const SkillPanel: React.FC<SkillPanelProps> = ({ skills, selectedSkillId, onUpdate }) => {
  /** 当前展开查看的技能，null 表示展示列表 */
  const [activeSkill, setActiveSkill] = useState<Skill | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // 从树节点外部选中技能时，自动展开该技能详情
  React.useEffect(() => {
    if (selectedSkillId) {
      const found = skills.find((s) => s.id === selectedSkillId);
      if (found) setActiveSkill(found);
    }
  }, [selectedSkillId, skills]);

  /** 部署新技能：插入到列表头部，并切换到列表 Tab */
  const handleDeploy = (skill: Skill) => {
    onUpdate([skill, ...skills]);
    setActiveTab('list');
    message.success(`技能「${skill.name}」已发布`);
  };

  // 如果有选中的技能，展示内联详情视图（替代原 Drawer）
  if (activeSkill) {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">技能</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            面向智能体的指令集，教会数字员工如何执行特定任务
          </p>
        </div>
        <div className="flex-1 overflow-auto">
          <SkillDetailView skill={activeSkill} onBack={() => setActiveSkill(null)} />
        </div>
      </div>
    );
  }

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
                  onClick={() => setActiveSkill(skill)}
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
    </div>
  );
};

export default SkillPanel;

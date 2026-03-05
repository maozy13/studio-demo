/**
 * 数字员工「会话」面板
 * 配置即时通讯工具集成（飞书、钉钉、企业微信）
 * 展示各 IM 工具下的会话 session 列表
 */

import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import {
  PlusOutlined, MessageOutlined, TeamOutlined, UserOutlined,
  CheckCircleFilled, CloseCircleOutlined,
} from '@ant-design/icons';
import type { IMIntegration, IMTool, ConversationSession } from '../../types';
import { IMToolIcon, formatRelativeTime } from '../shared';

interface SessionPanelProps {
  /** IM 集成配置列表 */
  integrations: IMIntegration[];
  /** 更新集成配置回调 */
  onUpdate: (integrations: IMIntegration[]) => void;
}

/** IM 工具配置信息 */
const IM_CONFIGS: Record<IMTool, { name: string; description: string; color: string }> = {
  feishu: { name: '飞书', description: '连接飞书机器人，支持群聊和单聊', color: '#00D6A4' },
  dingtalk: { name: '钉钉', description: '连接钉钉机器人，支持企业群和个人会话', color: '#1A6EFF' },
  wecom: { name: '企业微信', description: '连接企业微信机器人，支持部门群和客户群', color: '#07C160' },
};

/** 全部可用 IM 工具 */
const ALL_IM_TOOLS: IMTool[] = ['feishu', 'dingtalk', 'wecom'];

/**
 * 会话 Session 列表项
 */
const SessionItem: React.FC<{ session: ConversationSession }> = ({ session }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
      {session.isGroup ? <TeamOutlined /> : <UserOutlined />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-800 truncate">{session.name}</span>
        <span className="text-xs text-gray-400 shrink-0 ml-2">
          {formatRelativeTime(session.lastActiveAt)}
        </span>
      </div>
      {session.lastMessage && (
        <p className="text-xs text-gray-400 truncate mt-0.5">{session.lastMessage}</p>
      )}
    </div>
  </div>
);

/**
 * IM 工具集成卡片
 */
const IMCard: React.FC<{
  imTool: IMTool;
  integration?: IMIntegration;
  onConnect: (tool: IMTool) => void;
  onDisconnect: (tool: IMTool) => void;
}> = ({ imTool, integration, onConnect, onDisconnect }) => {
  const config = IM_CONFIGS[imTool];
  const configured = integration?.configured ?? false;
  const sessions = integration?.sessions ?? [];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* 工具头部 */}
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <IMToolIcon tool={imTool} size={28} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800 text-sm">{config.name}</span>
              {configured && (
                <CheckCircleFilled className="text-green-500 text-xs" />
              )}
            </div>
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        {configured ? (
          <Button
            size="small"
            type="text"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => onDisconnect(imTool)}
          >
            断开
          </Button>
        ) : (
          <Button
            size="small"
            type="primary"
            ghost
            icon={<PlusOutlined />}
            onClick={() => onConnect(imTool)}
          >
            连接
          </Button>
        )}
      </div>

      {/* 会话列表 */}
      {configured && (
        <div>
          {sessions.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-6">
              <MessageOutlined className="text-lg mb-1 block" />
              暂无会话
            </div>
          ) : (
            <div className="px-2 py-2 space-y-0.5">
              {sessions.map((session) => (
                <SessionItem key={session.id} session={session} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * 会话面板主组件
 */
const SessionPanel: React.FC<SessionPanelProps> = ({ integrations, onUpdate }) => {
  const [connectingTool, setConnectingTool] = useState<IMTool | null>(null);

  /** 获取某 IM 工具的集成配置 */
  const getIntegration = (tool: IMTool) => integrations.find((i) => i.imTool === tool);

  /** 连接 IM 工具 */
  const handleConnect = (tool: IMTool) => {
    setConnectingTool(tool);
  };

  /** 确认连接（模拟OAuth流程） */
  const handleConfirmConnect = () => {
    if (!connectingTool) return;
    const existing = integrations.find((i) => i.imTool === connectingTool);
    if (existing) {
      onUpdate(
        integrations.map((i) =>
          i.imTool === connectingTool ? { ...i, configured: true } : i
        )
      );
    } else {
      onUpdate([
        ...integrations,
        { imTool: connectingTool, configured: true, sessions: [] },
      ]);
    }
    setConnectingTool(null);
    message.success(`${IM_CONFIGS[connectingTool].name} 已成功连接`);
  };

  /** 断开连接 */
  const handleDisconnect = (tool: IMTool) => {
    Modal.confirm({
      title: `断开 ${IM_CONFIGS[tool].name}`,
      content: '断开后，数字员工将停止接收来自此工具的消息。',
      okText: '确认断开',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        onUpdate(
          integrations.map((i) =>
            i.imTool === tool ? { ...i, configured: false } : i
          )
        );
        message.success('已断开连接');
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">会话</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          配置即时通讯工具集成，让数字员工在 IM 工具中与用户对话，并接受会话中的计划指令
        </p>
      </div>

      {/* IM 工具卡片列表 */}
      <div className="space-y-4 flex-1 overflow-auto">
        {ALL_IM_TOOLS.map((tool) => (
          <IMCard
            key={tool}
            imTool={tool}
            integration={getIntegration(tool)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {/* 连接确认弹窗（模拟 OAuth 授权） */}
      <Modal
        title={connectingTool ? `连接 ${IM_CONFIGS[connectingTool].name}` : ''}
        open={!!connectingTool}
        onOk={handleConfirmConnect}
        onCancel={() => setConnectingTool(null)}
        okText="确认授权连接"
        cancelText="取消"
        width={400}
      >
        {connectingTool && (
          <div className="py-4 text-center space-y-4">
            <div className="flex justify-center">
              <IMToolIcon tool={connectingTool} size={48} />
            </div>
            <p className="text-sm text-gray-600">
              将通过 OAuth 授权方式连接 <strong>{IM_CONFIGS[connectingTool].name}</strong>，
              授权后数字员工可以接收和发送消息。
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 text-left space-y-1">
              <p>✓ 接收群聊和单聊消息</p>
              <p>✓ 发送消息和通知</p>
              <p>✓ 创建和管理计划任务</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SessionPanel;

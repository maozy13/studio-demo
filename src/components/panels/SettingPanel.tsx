/**
 * 数字员工「设定」面板
 * 使用 Markdown 编辑器对数字员工的职责进行自然语言描述
 */

import React, { useState } from 'react';
import { Button, message } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

interface SettingPanelProps {
  /** 设定内容（Markdown） */
  setting: string;
  /** 保存设定回调 */
  onSave: (content: string) => void;
}

/**
 * 设定面板
 * 支持查看（Markdown 渲染）和编辑（Textarea 输入）两种模式
 */
const SettingPanel: React.FC<SettingPanelProps> = ({ setting, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(setting);

  /** 进入编辑模式 */
  const handleStartEdit = () => {
    setEditValue(setting);
    setIsEditing(true);
  };

  /** 保存设定内容 */
  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
    message.success('设定已保存');
  };

  /** 取消编辑 */
  const handleCancel = () => {
    setEditValue(setting);
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">设定</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            用自然语言描述数字员工的职责，设定可作为元数据供其他数字员工调用
          </p>
        </div>
        {!isEditing && (
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={handleStartEdit}
            className="text-gray-500 hover:text-gray-900"
          >
            编辑
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleCancel}
              className="text-gray-500"
            >
              取消
            </Button>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSave}
              size="small"
            >
              保存
            </Button>
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          /* 编辑模式：Textarea */
          <textarea
            className="w-full h-full min-h-96 p-4 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 font-mono leading-relaxed"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="请用 Markdown 格式描述数字员工的职责、工作原则等..."
          />
        ) : (
          /* 查看模式：Markdown 渲染 */
          <div className="prose prose-sm max-w-none prose-gray">
            {setting ? (
              <ReactMarkdown>{setting}</ReactMarkdown>
            ) : (
              <div className="text-gray-400 text-sm py-12 text-center">
                <p>暂无设定内容</p>
                <p className="mt-1 text-xs">点击「编辑」按钮开始配置数字员工的职责描述</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingPanel;

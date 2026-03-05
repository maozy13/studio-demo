/**
 * 数字员工「知识」面板
 * 以图（Graph）形式展示知识节点及其关系
 * 支持从业务知识网络（BKN）选择知识
 */

import React, { useState } from 'react';
import { Button, Tag, Modal, Input, Select, message, Empty } from 'antd';
import { PlusOutlined, DatabaseOutlined, FileTextOutlined, ApiOutlined } from '@ant-design/icons';
import type { KnowledgeNode, KnowledgeEdge } from '../../types';

interface KnowledgePanelProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onUpdate: (nodes: KnowledgeNode[], edges: KnowledgeEdge[]) => void;
}

/**
 * 知识节点卡片
 */
const KnowledgeNodeCard: React.FC<{ node: KnowledgeNode }> = ({ node }) => {
  const isStructured = node.type === 'structured';
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-indigo-300 hover:shadow-sm transition-all cursor-default">
      <div className="flex items-start gap-2">
        <span className={`text-lg ${isStructured ? 'text-blue-500' : 'text-amber-500'}`}>
          {isStructured ? <DatabaseOutlined /> : <FileTextOutlined />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
            <Tag
              color={isStructured ? 'blue' : 'orange'}
              className="text-xs shrink-0"
              bordered={false}
            >
              {isStructured ? '结构化' : '非结构化'}
            </Tag>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{node.description}</p>
          {node.source && (
            <span className="text-xs text-indigo-400 mt-1 block">来源：{node.source}</span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 简化的知识图谱可视化组件
 * 使用 SVG 绘制节点和连线
 */
const KnowledgeGraph: React.FC<{
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}> = ({ nodes, edges }) => {
  if (nodes.length === 0) return null;

  // 简单的圆形布局：将节点均匀排列在圆周上
  const cx = 300, cy = 200, r = 140;
  const nodePositions: Record<string, { x: number; y: number }> = {};

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
    nodePositions[node.id] = {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  return (
    <svg
      width="100%"
      viewBox="0 0 600 400"
      className="rounded-xl bg-gray-50 border border-gray-100"
    >
      {/* 绘制连线 */}
      {edges.map((edge, i) => {
        const src = nodePositions[edge.source];
        const tgt = nodePositions[edge.target];
        if (!src || !tgt) return null;
        const midX = (src.x + tgt.x) / 2;
        const midY = (src.y + tgt.y) / 2;
        return (
          <g key={i}>
            <line
              x1={src.x} y1={src.y}
              x2={tgt.x} y2={tgt.y}
              stroke="#e5e7eb"
              strokeWidth="1.5"
              markerEnd="url(#arrow)"
            />
            {edge.label && (
              <text
                x={midX} y={midY - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#9ca3af"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}
      {/* 箭头定义 */}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#d1d5db" />
        </marker>
      </defs>
      {/* 绘制节点 */}
      {nodes.map((node) => {
        const pos = nodePositions[node.id];
        if (!pos) return null;
        const isStructured = node.type === 'structured';
        return (
          <g key={node.id}>
            <circle
              cx={pos.x} cy={pos.y} r={32}
              fill={isStructured ? '#eff6ff' : '#fffbeb'}
              stroke={isStructured ? '#bfdbfe' : '#fde68a'}
              strokeWidth="1.5"
            />
            <text
              x={pos.x} y={pos.y - 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10"
              fill={isStructured ? '#3b82f6' : '#d97706'}
              fontWeight="500"
            >
              {node.name.length > 6 ? node.name.slice(0, 6) + '…' : node.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/**
 * 添加知识弹窗
 */
const AddKnowledgeModal: React.FC<{
  open: boolean;
  onOk: (node: Omit<KnowledgeNode, 'id'>) => void;
  onCancel: () => void;
}> = ({ open, onOk, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'structured' | 'unstructured'>('structured');
  const [description, setDescription] = useState('');

  const handleOk = () => {
    if (!name.trim()) { message.warning('请输入知识名称'); return; }
    onOk({ name, type, description, source: 'BKN' });
    setName(''); setType('structured'); setDescription('');
  };

  return (
    <Modal
      title="从 BKN 添加知识"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="添加"
      cancelText="取消"
      width={440}
    >
      <div className="space-y-4 py-2">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">知识名称</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入知识名称" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">数据类型</label>
          <Select
            value={type}
            onChange={setType}
            className="w-full"
            options={[
              { value: 'structured', label: '结构化数据' },
              { value: 'unstructured', label: '非结构化数据' },
            ]}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">描述</label>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述此知识的用途和内容"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
};

/**
 * 知识面板主组件
 */
const KnowledgePanel: React.FC<KnowledgePanelProps> = ({ nodes, edges, onUpdate }) => {
  const [addOpen, setAddOpen] = useState(false);

  /** 添加知识节点 */
  const handleAdd = (node: Omit<KnowledgeNode, 'id'>) => {
    const newNode: KnowledgeNode = { ...node, id: `kn-${Date.now()}` };
    onUpdate([...nodes, newNode], edges);
    setAddOpen(false);
    message.success('知识已添加');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">知识</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            数字员工执行任务所需的背景信息和业务规则，来自业务知识网络（BKN）
          </p>
        </div>
        <Button
          type="text"
          icon={<PlusOutlined />}
          onClick={() => setAddOpen(true)}
          className="text-gray-500 hover:text-gray-900"
        >
          添加知识
        </Button>
      </div>

      {nodes.length === 0 ? (
        <Empty
          description="暂无知识配置"
          className="mt-16"
        >
          <Button type="primary" icon={<ApiOutlined />} onClick={() => setAddOpen(true)}>
            从 BKN 添加知识
          </Button>
        </Empty>
      ) : (
        <div className="flex-1 overflow-auto space-y-6">
          {/* 知识图谱 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">知识图谱</h3>
            <KnowledgeGraph nodes={nodes} edges={edges} />
          </div>

          {/* 知识节点列表 */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-3">
              知识节点
              <span className="ml-2 text-xs text-gray-400 font-normal">{nodes.length} 项</span>
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {nodes.map((node) => (
                <KnowledgeNodeCard key={node.id} node={node} />
              ))}
            </div>
          </div>

          {/* BKN 动态补充提示 */}
          <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-700">
            <ApiOutlined className="mr-2" />
            执行任务时，还将通过 BKN 智能体动态检索补充相关业务知识
          </div>
        </div>
      )}

      <AddKnowledgeModal open={addOpen} onOk={handleAdd} onCancel={() => setAddOpen(false)} />
    </div>
  );
};

export default KnowledgePanel;

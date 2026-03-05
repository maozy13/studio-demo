/**
 * 共享 UI 组件
 * 包含：IM 工具图标、迷你折线图、时间格式化工具
 */

import React from 'react';
import { Tooltip } from 'antd';
import type { IMTool } from '../types';

/**
 * IM 工具的元数据配置
 * icon 对应 public/icons/ 下的 SVG 文件路径
 */
const IM_TOOL_CONFIG: Record<IMTool, { name: string; icon: string }> = {
  feishu: { name: '飞书', icon: '/icons/feishu.svg' },
  dingtalk: { name: '钉钉', icon: '/icons/dingding.svg' },
  wecom: { name: '企业微信', icon: '/icons/wechat.svg' },
};

/**
 * IM 工具图标组件
 * 使用 public/icons/ 下的 SVG 图标
 */
export const IMToolIcon: React.FC<{
  tool: IMTool;
  size?: number;
}> = ({ tool, size = 20 }) => {
  const config = IM_TOOL_CONFIG[tool];
  return (
    <Tooltip title={config.name}>
      <img
        src={config.icon}
        alt={config.name}
        style={{ width: size, height: size, flexShrink: 0 }}
        className="select-none"
      />
    </Tooltip>
  );
};

/**
 * 迷你折线图（SparkLine）组件
 * 极简样式，用于展示趋势数据
 */
export const SparkLine: React.FC<{
  /** 数据点数组 */
  data: number[];
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 折线颜色 */
  color?: string;
}> = ({ data, width = 80, height = 24, color = '#6366f1' }) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  /** 将数据点映射为 SVG 坐标 */
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="sparkline-container"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
        opacity="0.8"
      />
    </svg>
  );
};

/**
 * 格式化相对时间
 * @param isoString ISO 格式时间字符串
 * @returns 相对时间描述，如"3天前"
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 格式化绝对时间
 */
export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 计划触发类型标签
 */
export const PLAN_TRIGGER_LABELS: Record<string, { label: string; color: string }> = {
  scheduled: { label: '定时执行', color: 'blue' },
  periodic: { label: '周期执行', color: 'purple' },
  conditional: { label: '条件执行', color: 'orange' },
};

/**
 * 任务结果标签
 */
export const TASK_RESULT_LABELS: Record<string, { label: string; color: string }> = {
  success: { label: '成功', color: 'green' },
  failure: { label: '失败', color: 'red' },
  running: { label: '运行中', color: 'blue' },
};

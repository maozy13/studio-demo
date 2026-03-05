/**
 * DIP Studio - Mock 数据
 * 用于原型演示
 */

import type { DigitalEmployee, DigitalEmployeeDetail } from './types';

/**
 * 数字员工列表 Mock 数据
 */
export const mockEmployees: DigitalEmployee[] = [
  {
    id: 'emp-001',
    name: '财务分析师 Aria',
    description: '负责企业财务数据分析、报表生成和财务预测，具备深厚的财务领域知识。',
    createdBy: '张伟',
    createdAt: '2025-01-10T09:00:00Z',
    updatedBy: '张伟',
    updatedAt: '2025-02-28T14:30:00Z',
    integrations: ['feishu', 'wecom'],
    planCount: 5,
    taskStats: [85, 100, 75, 100, 80, 100, 90],
  },
  {
    id: 'emp-002',
    name: '客服助理 Evan',
    description: '提供24/7客户支持服务，处理常见问题、工单分类和客户情绪分析。',
    createdBy: '李娜',
    createdAt: '2025-01-15T10:00:00Z',
    updatedBy: '王芳',
    updatedAt: '2025-03-01T16:00:00Z',
    integrations: ['dingtalk'],
    planCount: 12,
    taskStats: [92, 88, 95, 85, 90, 93, 97],
  },
  {
    id: 'emp-003',
    name: '人力资源专员 Nova',
    description: '负责招聘信息处理、简历筛选、面试安排以及员工入职流程自动化。',
    createdBy: '赵磊',
    createdAt: '2025-02-01T08:00:00Z',
    updatedBy: '赵磊',
    updatedAt: '2025-02-25T11:00:00Z',
    integrations: ['feishu', 'dingtalk', 'wecom'],
    planCount: 3,
    taskStats: [60, 50, 80, 70, 65, 100, 75],
  },
  {
    id: 'emp-004',
    name: '市场洞察师 Luna',
    description: '实时监控市场动态、竞品信息，自动生成市场分析报告和趋势预测。',
    createdBy: '陈静',
    createdAt: '2025-02-10T09:30:00Z',
    updatedBy: '陈静',
    updatedAt: '2025-03-03T10:00:00Z',
    integrations: ['feishu'],
    planCount: 8,
    taskStats: [78, 82, 80, 88, 85, 91, 89],
  },
];

/**
 * 数字员工详情 Mock 数据
 */
export const mockEmployeeDetails: Record<string, DigitalEmployeeDetail> = {
  'emp-001': {
    id: 'emp-001',
    name: '财务分析师 Aria',
    description: '负责企业财务数据分析、报表生成和财务预测，具备深厚的财务领域知识。',
    createdBy: '张伟',
    createdAt: '2025-01-10T09:00:00Z',
    updatedBy: '张伟',
    updatedAt: '2025-02-28T14:30:00Z',
    integrations: ['feishu', 'wecom'],
    planCount: 5,
    taskStats: [3, 5, 2, 8, 4, 6, 7],
    setting: `## 角色定义

你是一名专业的企业财务分析师，负责：

1. **财务数据分析** - 对企业财务报表进行深入分析，识别趋势和异常
2. **报表生成** - 自动生成月度、季度、年度财务报告
3. **财务预测** - 基于历史数据和市场趋势进行财务预测
4. **风险评估** - 识别财务风险并提出改善建议

## 工作原则

- 数据优先，基于事实进行分析
- 结论清晰，以可视化方式呈现复杂数据
- 及时响应，在规定时间内完成分析报告
- 严格保密，遵守财务数据安全规范`,
    knowledgeNodes: [
      { id: 'kn-001', name: '企业财务制度', type: 'unstructured', description: '公司内部财务管理规章制度', source: 'BKN' },
      { id: 'kn-002', name: '历史财务报表', type: 'structured', description: '近三年季度财务报表数据', source: 'BKN' },
      { id: 'kn-003', name: '行业基准数据', type: 'structured', description: '同行业财务指标基准值', source: 'BKN' },
      { id: 'kn-004', name: '会计准则', type: 'unstructured', description: '企业会计准则及解释', source: 'BKN' },
    ],
    knowledgeEdges: [
      { source: 'kn-001', target: 'kn-002', label: '规范' },
      { source: 'kn-002', target: 'kn-003', label: '对比' },
      { source: 'kn-004', target: 'kn-001', label: '指导' },
    ],
    skills: [
      {
        id: 'sk-001',
        name: '财务报表分析',
        description: `## 技能描述

分析企业财务三大报表（资产负债表、利润表、现金流量表），计算关键财务指标。

## 执行步骤

1. 获取最新财务报表数据
2. 计算流动比率、速动比率、资产负债率等指标
3. 与历史数据及行业基准对比
4. 生成分析摘要`,
        script: `import pandas as pd
import json

def analyze_financial_statements(data: dict) -> dict:
    """
    分析财务三大报表，计算关键指标
    :param data: 包含资产负债表、利润表、现金流量表的字典
    :return: 财务指标分析结果
    """
    balance_sheet = data.get('balance_sheet', {})
    income_statement = data.get('income_statement', {})

    # 计算流动比率
    current_ratio = (
        balance_sheet.get('current_assets', 0) /
        balance_sheet.get('current_liabilities', 1)
    )

    # 计算资产负债率
    debt_ratio = (
        balance_sheet.get('total_liabilities', 0) /
        balance_sheet.get('total_assets', 1)
    )

    # 计算净利润率
    net_profit_margin = (
        income_statement.get('net_profit', 0) /
        income_statement.get('revenue', 1)
    )

    return {
        'current_ratio': round(current_ratio, 2),
        'debt_ratio': round(debt_ratio, 2),
        'net_profit_margin': round(net_profit_margin * 100, 2),
    }`,
        scriptLanguage: 'python',
        employeeId: 'emp-001',
        createdAt: '2025-01-15T10:00:00Z',
      },
      {
        id: 'sk-002',
        name: '月度财务报告生成',
        description: `## 技能描述

自动汇总月度财务数据，生成标准化财务分析报告（Markdown格式）。

## 执行步骤

1. 从数据源获取当月财务数据
2. 调用财务报表分析技能
3. 生成文字分析报告
4. 输出PDF格式报告`,
        employeeId: 'emp-001',
        createdAt: '2025-01-20T10:00:00Z',
      },
    ],
    plans: [
      {
        id: 'plan-001',
        name: '月度财务报告',
        triggerType: 'periodic',
        triggerConfig: '0 9 1 * *',
        employeeId: 'emp-001',
        messages: [
          {
            id: 'msg-001',
            role: 'user',
            content: '每月1号早上9点自动生成上月的财务分析报告，并发送到财务群',
            timestamp: '2025-01-10T09:00:00Z',
          },
          {
            id: 'msg-002',
            role: 'assistant',
            content: '好的，我已为您创建一个周期性计划：**每月1日09:00** 自动执行月度财务报告生成任务，完成后将结果发送到飞书财务群。\n\n执行配置：`0 9 1 * *`',
            timestamp: '2025-01-10T09:01:00Z',
          },
        ],
        tasks: [
          {
            id: 'task-001',
            planId: 'plan-001',
            result: 'success',
            startedAt: '2025-02-01T09:00:00Z',
            finishedAt: '2025-02-01T09:03:42Z',
            messages: [
              {
                id: 'tm-001',
                role: 'assistant',
                content: '开始执行月度财务报告生成任务...',
                timestamp: '2025-02-01T09:00:00Z',
              },
              {
                id: 'tm-002',
                role: 'tool',
                content: '调用技能：财务报表分析\n输入：2025年1月财务数据\n输出：流动比率 2.3，资产负债率 45.2%，净利润率 18.5%',
                toolName: '财务报表分析',
                timestamp: '2025-02-01T09:01:00Z',
              },
              {
                id: 'tm-003',
                role: 'assistant',
                content: '数据分析完成，正在生成报告...',
                timestamp: '2025-02-01T09:02:00Z',
              },
              {
                id: 'tm-004',
                role: 'tool',
                content: '调用技能：月度财务报告生成\n输出：已生成 2025年1月财务分析报告.pdf',
                toolName: '月度财务报告生成',
                timestamp: '2025-02-01T09:03:00Z',
              },
              {
                id: 'tm-005',
                role: 'assistant',
                content: '月度财务报告已生成完毕，报告已发送至飞书财务分析群。',
                timestamp: '2025-02-01T09:03:42Z',
              },
            ],
            artifacts: [
              {
                id: 'art-001',
                name: '2025年1月财务分析报告',
                type: 'markdown',
                content: `# 2025年1月财务分析报告

## 执行摘要

本月财务状况整体良好，营收同比增长 **12.3%**，净利润率保持在 **18.5%** 的健康水平。

## 关键指标

| 指标 | 本月 | 上月 | 同比 |
|------|------|------|------|
| 营业收入 | 2,450万 | 2,180万 | +12.3% |
| 净利润 | 453万 | 398万 | +13.8% |
| 流动比率 | 2.30 | 2.15 | +7.0% |
| 资产负债率 | 45.2% | 47.1% | -1.9pp |

## 分析结论

1. **收入增长强劲**：主要来自新客户拓展和老客户续约
2. **盈利能力提升**：成本管控有效，净利润率创近6月新高
3. **财务结构优化**：资产负债率持续下降，财务风险降低
4. **现金流充裕**：经营性现金流净额 320万，资金状况良好

## 风险提示

- 应收账款周转天数略有上升，需关注回款情况
- Q2预计市场营销投入增加，注意成本控制`,
                createdAt: '2025-02-01T09:03:42Z',
              },
            ],
          },
          {
            id: 'task-002',
            planId: 'plan-001',
            result: 'success',
            startedAt: '2025-03-01T09:00:00Z',
            finishedAt: '2025-03-01T09:04:10Z',
            messages: [
              {
                id: 'tm-010',
                role: 'assistant',
                content: '开始执行月度财务报告生成任务...',
                timestamp: '2025-03-01T09:00:00Z',
              },
              {
                id: 'tm-011',
                role: 'assistant',
                content: '报告生成完毕，已发送至飞书财务分析群。',
                timestamp: '2025-03-01T09:04:10Z',
              },
            ],
            artifacts: [
              {
                id: 'art-002',
                name: '2025年2月财务分析报告',
                type: 'markdown',
                content: `# 2025年2月财务分析报告\n\n## 执行摘要\n\n本月受春节假期影响，营收环比下降，但同比仍保持正增长。`,
                createdAt: '2025-03-01T09:04:10Z',
              },
            ],
          },
        ],
        createdAt: '2025-01-10T09:01:00Z',
      },
      {
        id: 'plan-002',
        name: '异常交易监控',
        triggerType: 'conditional',
        triggerConfig: '监控财务系统，当单笔交易金额超过50万时触发',
        employeeId: 'emp-001',
        messages: [
          {
            id: 'msg-010',
            role: 'user',
            content: '当有单笔交易超过50万时，立即发送预警通知到我的飞书',
            timestamp: '2025-01-12T10:00:00Z',
          },
          {
            id: 'msg-011',
            role: 'assistant',
            content: '已创建条件监控计划：实时监控财务系统，当单笔交易金额超过 **50万元** 时，立即向您的飞书发送预警通知。',
            timestamp: '2025-01-12T10:01:00Z',
          },
        ],
        tasks: [],
        createdAt: '2025-01-12T10:01:00Z',
      },
    ],
    imIntegrations: [
      {
        imTool: 'feishu',
        configured: true,
        sessions: [
          {
            id: 'sess-001',
            imTool: 'feishu',
            name: '财务分析群',
            isGroup: true,
            lastMessage: 'Aria：2月份财务报告已发送至群内',
            lastActiveAt: '2025-03-01T09:04:10Z',
            messages: [],
          },
          {
            id: 'sess-002',
            imTool: 'feishu',
            name: '张伟',
            isGroup: false,
            lastMessage: '请帮我分析一下Q1的毛利率趋势',
            lastActiveAt: '2025-03-03T14:30:00Z',
            messages: [],
          },
        ],
      },
      {
        imTool: 'wecom',
        configured: true,
        sessions: [
          {
            id: 'sess-003',
            imTool: 'wecom',
            name: '财务部',
            isGroup: true,
            lastMessage: 'Aria：月度报告已就绪',
            lastActiveAt: '2025-03-01T09:10:00Z',
            messages: [],
          },
        ],
      },
    ],
  },
};

/**
 * DIP Studio 数字员工管理平台 - 数据类型定义
 */

/**
 * 即时通讯工具类型
 * 支持飞书、钉钉、企业微信
 */
export type IMTool = 'feishu' | 'dingtalk' | 'wecom';

/**
 * 技能脚本语言类型
 */
export type ScriptLanguage = 'python' | 'javascript';

/**
 * 计划执行条件类型
 * - scheduled: 定时执行（一次性）
 * - periodic: 周期执行（重复）
 * - conditional: 条件执行（监控触发）
 */
export type PlanTriggerType = 'scheduled' | 'periodic' | 'conditional';

/**
 * 任务执行结果
 */
export type TaskResult = 'success' | 'failure' | 'running';

/**
 * 工件类型
 */
export type ArtifactType = 'code' | 'pdf' | 'html' | 'markdown' | 'text';

/**
 * 消息角色
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * 数字员工基本属性
 */
export interface DigitalEmployee {
  /** 唯一标识 */
  id: string;
  /** 名称，最多128个字符 */
  name: string;
  /** 简介，最多400个字符 */
  description: string;
  /** 创建者，不可编辑 */
  createdBy: string;
  /** 创建时间，不可编辑 */
  createdAt: string;
  /** 最后编辑者，不可编辑 */
  updatedBy: string;
  /** 最后编辑时间，不可编辑 */
  updatedAt: string;
  /** 集成的即时通讯工具 */
  integrations: IMTool[];
  /** 计划实例数量 */
  planCount: number;
  /** 最近7天任务成功率（0-100，用于折线图） */
  taskStats: number[];
  /**
   * 使用者列表（按"用户ID + 数字员工ID"去重计数）
   * 仅对管理员展示，以头像形式展示，超过3个在末尾显示数量
   */
  users?: { id: string; name: string; avatar?: string }[];
}

/**
 * 技能（Skill）定义
 * 面向智能体的指令描述，教会智能体如何执行特定任务或流程
 */
export interface Skill {
  /** 唯一标识 */
  id: string;
  /** 技能名称 */
  name: string;
  /** 技能描述（Markdown格式） */
  description: string;
  /** 技能脚本（通常为Python代码，可选） */
  script?: string;
  /** 脚本语言 */
  scriptLanguage?: ScriptLanguage;
  /** 所属数字员工ID */
  employeeId: string;
  /** 创建时间 */
  createdAt: string;
  /** 版本号，遵循语义版本规则，格式为 v0.0.1 */
  version?: string;
  /** 发布描述，不超过400字 */
  publishDescription?: string;
}

/**
 * 知识节点
 * 来自业务知识网络（BKN）的结构化或非结构化数据
 */
export interface KnowledgeNode {
  /** 唯一标识 */
  id: string;
  /** 知识名称 */
  name: string;
  /** 知识类型：结构化/非结构化 */
  type: 'structured' | 'unstructured';
  /** 知识描述 */
  description: string;
  /** 数据来源 */
  source?: string;
}

/**
 * 知识关系（用于图展示）
 */
export interface KnowledgeEdge {
  /** 来源节点ID */
  source: string;
  /** 目标节点ID */
  target: string;
  /** 关系描述 */
  label?: string;
}

/**
 * 任务工件（Artifact）
 */
export interface Artifact {
  /** 唯一标识 */
  id: string;
  /** 工件名称 */
  name: string;
  /** 工件类型 */
  type: ArtifactType;
  /** 工件内容 */
  content: string;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 对话消息
 */
export interface ChatMessage {
  /** 唯一标识 */
  id: string;
  /** 消息角色 */
  role: MessageRole;
  /** 消息内容 */
  content: string;
  /** 发送时间 */
  timestamp: string;
  /** 调用的工具名称（role为tool时） */
  toolName?: string;
}

/**
 * 任务实例
 * 计划执行后产生的一次执行记录
 */
export interface TaskInstance {
  /** 唯一标识 */
  id: string;
  /** 所属计划ID */
  planId: string;
  /** 执行结果 */
  result: TaskResult;
  /** 开始时间 */
  startedAt: string;
  /** 完成时间 */
  finishedAt?: string;
  /** 思考、推理、工具调用消息流 */
  messages: ChatMessage[];
  /** 任务完成后产出的工件列表 */
  artifacts: Artifact[];
}

/**
 * 计划
 * 用户发起的、需要数字员工在满足条件时自动执行的待办任务
 */
export interface Plan {
  /** 唯一标识 */
  id: string;
  /** 计划名称 */
  name: string;
  /** 触发类型 */
  triggerType: PlanTriggerType;
  /** 触发配置（cron表达式或条件描述） */
  triggerConfig: string;
  /** 所属数字员工ID */
  employeeId: string;
  /** 创建该计划的对话消息 */
  messages: ChatMessage[];
  /** 关联的任务实例列表 */
  tasks: TaskInstance[];
  /** 创建时间 */
  createdAt: string;
}

/**
 * 会话session
 */
export interface ConversationSession {
  /** 唯一标识 */
  id: string;
  /** 来源IM工具 */
  imTool: IMTool;
  /** 会话名称（群聊名称或用户名） */
  name: string;
  /** 是否为群聊 */
  isGroup: boolean;
  /** 最近消息 */
  lastMessage?: string;
  /** 最近活跃时间 */
  lastActiveAt: string;
  /** 消息列表 */
  messages: ChatMessage[];
}

/**
 * IM工具配置
 */
export interface IMIntegration {
  /** 所属IM工具类型 */
  imTool: IMTool;
  /** 配置状态 */
  configured: boolean;
  /** 会话列表 */
  sessions: ConversationSession[];
}

/**
 * 数字员工详情（完整信息，含各项能力配置）
 */
export interface DigitalEmployeeDetail extends DigitalEmployee {
  /** 设定内容（Markdown格式） */
  setting: string;
  /** 知识节点列表 */
  knowledgeNodes: KnowledgeNode[];
  /** 知识关系列表 */
  knowledgeEdges: KnowledgeEdge[];
  /** 技能列表 */
  skills: Skill[];
  /** 计划列表 */
  plans: Plan[];
  /** IM集成配置 */
  imIntegrations: IMIntegration[];
}

/**
 * 左侧树节点类型
 */
export type TreeNodeType =
  | 'root'       // 数字员工根节点
  | 'setting'    // 设定
  | 'knowledge'  // 知识
  | 'skill'      // 技能（父节点）
  | 'skillItem'  // 具体技能
  | 'plan'       // 计划（父节点）
  | 'planItem'   // 具体计划
  | 'taskItem'   // 任务实例
  | 'session'    // 会话（父节点）
  | 'imItem'     // IM工具
  | 'sessionItem'; // 具体会话session

/**
 * 树节点数据
 */
export interface TreeNode {
  /** 节点key（唯一） */
  key: string;
  /** 节点标题 */
  title: string;
  /** 节点类型 */
  type: TreeNodeType;
  /** 关联数据ID */
  dataId?: string;
  /** 子节点 */
  children?: TreeNode[];
}

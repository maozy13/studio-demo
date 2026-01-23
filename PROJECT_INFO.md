# DIP Studio 项目管理 DEMO

DIP Studio 是决策智能型 AI 应用开发平台的项目管理页面。

## 项目架构

```
studio/
├── design/                    # 设计文档
│   ├── DIP Studio.pdf        # 应用元数据
│   └── 项目管理.pdf          # 项目管理功能设计
├── src/
│   ├── types/                # 类型定义
│   │   └── index.ts          # 核心类型(项目、容器、词典、文档)
│   ├── utils/                # 工具函数
│   │   ├── id.ts             # ID生成器
│   │   └── date.ts           # 日期格式化
│   ├── services/             # 服务层
│   │   └── storage.ts        # 本地存储服务(localStorage)
│   ├── components/           # UI组件
│   │   ├── ProjectCard.tsx              # 项目卡片
│   │   ├── ProjectFormModal.tsx         # 项目表单
│   │   ├── ContainerTree.tsx            # 容器树
│   │   ├── ContainerFormModal.tsx       # 容器表单
│   │   └── FeatureDocumentEditor.tsx    # 功能文档编辑器
│   ├── pages/                # 页面
│   │   ├── ProjectList.tsx   # 项目列表页
│   │   └── ProjectDetail.tsx # 项目详情页
│   ├── App.tsx               # 主应用(路由配置)
│   ├── main.tsx              # 应用入口
│   └── index.css             # 全局样式
├── index.html                # HTML入口
├── package.json              # 依赖配置
├── tsconfig.json             # TypeScript配置
├── vite.config.ts            # Vite配置
└── tailwind.config.js        # Tailwind配置
```

## 技术栈

- **语言**: TypeScript
- **框架**: React 18
- **路由**: React Router v7
- **UI组件库**: Ant Design v6
- **CSS**: Tailwind CSS
- **构建工具**: Vite
- **数据存储**: localStorage

## 核心功能

### 1. 项目管理
- 创建、编辑、删除项目
- 项目列表展示(卡片视图)
- 项目基本信息(名称、描述、创建者、时间等)

### 2. 容器架构
- **四级架构**: 应用 → 子应用(可选) → 页面 → 功能
- 树形结构展示
- 容器创建、编辑、删除
- 容器元数据管理

### 3. 功能文档
- 每个功能容器自动创建对应文档
- 简单文本编辑器
- 自动保存(失焦时)

### 4. 项目词典(已设计,待实现)
- 术语定义管理
- 一个术语只能定义一次

## 设计原则

### 界面风格
- **参考**: Notion
- **特点**: 简约、留白
- **配色**: 蓝色主题(#2D9CDB)

### 代码规范
- 每个类、函数、属性都有详细注释
- 高内聚、低耦合的架构设计
- TypeScript 严格类型检查

## 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 后续待实现功能

1. **项目词典管理**
   - 术语添加、编辑、删除
   - 术语唯一性校验

2. **容器模式切换**
   - 编辑模式 vs 开发模式
   - MCP服务集成
   - Prompt复制功能

3. **富文本编辑器**
   - 替换简单文本编辑器
   - 支持插件应用(/指标、/业务知识网络)
   - 所见即所得编辑

4. **容器移动**
   - 拖拽排序
   - 跨层级移动(需遵守架构约束)

5. **数据导入导出**
   - 项目导出为JSON
   - 从JSON导入项目

6. **用户认证**
   - 当前使用固定用户"System User"
   - 需集成实际认证应用

## 数据存储说明

项目使用 localStorage 存储所有数据:
- `dip_projects`: 项目列表
- `dip_containers`: 容器列表
- `dip_terminologies`: 词典列表
- `dip_documents`: 文档列表

注意: localStorage 有容量限制(通常5-10MB),生产环境建议使用后端API。

## 设计文档

详细设计请参考:
- [DIP Studio.pdf](./design/DIP%20Studio.pdf) - 应用元数据和术语定义
- [项目管理.pdf](./design/项目管理.pdf) - 项目管理页面详细设计

## 开发说明

### 新增容器类型
如需新增容器类型,修改以下位置:
1. [src/types/index.ts](src/types/index.ts) - `ContainerLevel` 枚举
2. [src/components/ContainerTree.tsx](src/components/ContainerTree.tsx) - `getLevelLabel` 函数
3. [src/components/ContainerTree.tsx](src/components/ContainerTree.tsx) - `getAddableChildLevels` 函数

### 修改存储方式
如需替换 localStorage:
1. 修改 [src/services/storage.ts](src/services/storage.ts)
2. 实现相同的接口方法
3. 保持类型定义不变

---

**DIP Studio** - 让 AI 应用开发更智能

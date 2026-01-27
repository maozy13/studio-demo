# DIP Studio DEMO

## 介绍

DIP Studio 是一个产品设计文档驱动的 AI 应用开发平台。平台通过 MCP 协议连接了应用设计资料和 Cursor、VS Code 等 IDE。产品经理只需要聚焦 PRD 文档的撰写，其他一切应用开发工作都可以交给 AI 完成。

DIP Studio 能力：

- 管理 AI 应用开发项目
- 一键复制应用开发 Prompt
- 通过插件方式扩展 AI 应用所需的数据资源
- 支持应用级的开发和需求级的迭代
- 内置代码规范、框架选型、架构约束

本项目是 DIP Studio 的 DEMO 演示，本身亦是由文档驱动 — AI 开发，详细设计请参考：design/studio-demo.pdf。

## 启动

1. Clone 仓库到本地

```bash
git clone https://github.com/maozy13/studio-demo.git
```

2. 进入仓库，安装依赖
```bash 
cd /path/to/repo
npm install
```

3. 启动项目
```bash
npm run dev
```

项目启动后会自动打开浏览器访问 DEMO，尽情体验吧。
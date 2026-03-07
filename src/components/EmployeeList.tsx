/**
 * 数字员工列表页面
 * 以卡片形式展示所有数字员工，支持新建、编辑、删除操作
 */

import React, { useState } from 'react';
import {
  Button, Modal, Form, Input, Tooltip, message, Empty,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import type { DigitalEmployee } from '../types';
import { mockEmployees } from '../data';
import { IMToolIcon, SparkLine, UserAvatarGroup, formatRelativeTime } from './shared';

interface EmployeeListProps {
  /** 点击卡片进入详情回调 */
  onEnterDetail: (id: string) => void;
}

/**
 * 新建/编辑数字员工弹窗
 */
const EmployeeFormModal: React.FC<{
  open: boolean;
  editingEmployee?: DigitalEmployee;
  onOk: (values: { name: string; description: string }) => void;
  onCancel: () => void;
}> = ({ open, editingEmployee, onOk, onCancel }) => {
  const [form] = Form.useForm();
  const isEdit = !!editingEmployee;

  React.useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: editingEmployee?.name ?? '',
        description: editingEmployee?.description ?? '',
      });
    }
  }, [open, editingEmployee, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onOk(values);
    form.resetFields();
  };

  return (
    <Modal
      title={isEdit ? '编辑数字员工' : '新建数字员工'}
      open={open}
      onOk={handleOk}
      onCancel={() => { form.resetFields(); onCancel(); }}
      okText={isEdit ? '保存' : '创建'}
      cancelText="取消"
      width={480}
    >
      <Form form={form} layout="vertical" className="mt-4">
        {/* 名称：必填，最多128个字符 */}
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { required: true, message: '请输入数字员工名称' },
            { max: 128, message: '名称最多128个字符' },
          ]}
        >
          <Input placeholder="请输入名称" maxLength={128} showCount />
        </Form.Item>
        {/* 简介：非必填，最多400个字符 */}
        <Form.Item
          name="description"
          label="简介"
          rules={[{ max: 400, message: '简介最多400个字符' }]}
        >
          <Input.TextArea
            placeholder="请输入简介（可选）"
            maxLength={400}
            showCount
            rows={4}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * 删除确认弹窗（需要输入名称二次确认）
 */
const DeleteConfirmModal: React.FC<{
  open: boolean;
  employee: DigitalEmployee | null;
  onOk: () => void;
  onCancel: () => void;
}> = ({ open, employee, onOk, onCancel }) => {
  const [inputName, setInputName] = useState('');

  React.useEffect(() => {
    if (!open) setInputName('');
  }, [open]);

  /** 只有输入名称完全匹配时才允许确认删除 */
  const canDelete = inputName === employee?.name;

  return (
    <Modal
      title="删除数字员工"
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true, disabled: !canDelete }}
      width={440}
    >
      <div className="space-y-4 py-2">
        <p className="text-gray-600 text-sm">
          此操作将删除数字员工及其拥有的所有任务、会话和工件，且<span className="font-medium text-gray-900">不可恢复</span>。
        </p>
        <p className="text-sm text-gray-600">
          请输入 <span className="font-semibold text-gray-900">「{employee?.name}」</span> 以确认删除：
        </p>
        <Input
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="请输入数字员工名称"
        />
      </div>
    </Modal>
  );
};

/**
 * 数字员工卡片组件
 */
const EmployeeCard: React.FC<{
  employee: DigitalEmployee;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ employee, onClick, onEdit, onDelete }) => {
  return (
    <div
      className="group relative bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:border-gray-300 hover:shadow-sm transition-all duration-200"
      onClick={onClick}
    >
      {/* 操作按钮：hover 时显示 */}
      <div
        className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="编辑">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            className="text-gray-400 hover:text-gray-700"
            onClick={onEdit}
          />
        </Tooltip>
        <Tooltip title="删除">
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            className="text-gray-400 hover:text-red-500"
            onClick={onDelete}
          />
        </Tooltip>
      </div>

      {/* 数字员工名称 */}
      <h3 className="text-base font-semibold text-gray-900 mb-1 pr-16">{employee.name}</h3>

      {/* 简介 */}
      <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
        {employee.description || '暂无简介'}
      </p>

      {/* 统计信息区域 */}
      <div className="flex items-center justify-between">
        {/* 集成的 IM 工具图标 */}
        <div className="flex items-center gap-2">
          {employee.integrations.length > 0 ? (
            employee.integrations.map((tool) => (
              <IMToolIcon key={tool} tool={tool} size={18} />
            ))
          ) : (
            <span className="text-xs text-gray-400">暂无集成</span>
          )}
        </div>

        {/* 计划数量 */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <Tooltip title="计划数量">
            <span>{employee.planCount} 个计划</span>
          </Tooltip>
        </div>
      </div>

      {/* 使用者头像组（管理员可见） */}
      {employee.users && employee.users.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <UserAvatarGroup users={employee.users} maxDisplay={3} />
          <span className="text-xs text-gray-400">{employee.users.length} 位使用者</span>
        </div>
      )}

      {/* 最近7天任务成功率折线图 */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">近7天任务成功率</span>
        <div className="flex items-center gap-1.5">
          <SparkLine data={employee.taskStats} color="#22c55e" />
          <span className="text-xs text-gray-500 font-medium">
            {employee.taskStats[employee.taskStats.length - 1]}%
          </span>
        </div>
      </div>

      {/* 最后编辑时间 */}
      <div className="mt-2 text-xs text-gray-300">
        {formatRelativeTime(employee.updatedAt)} 编辑
      </div>
    </div>
  );
};

/**
 * 数字员工列表主页面
 */
const EmployeeList: React.FC<EmployeeListProps> = ({ onEnterDetail }) => {
  const [employees, setEmployees] = useState<DigitalEmployee[]>(mockEmployees);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<DigitalEmployee | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DigitalEmployee | null>(null);

  /** 新建数字员工，创建成功后自动跳转到详情页 */
  const handleCreate = (values: { name: string; description: string }) => {
    const now = new Date().toISOString();
    const newEmployee: DigitalEmployee = {
      id: `emp-${Date.now()}`,
      name: values.name,
      description: values.description,
      createdBy: '当前用户',
      createdAt: now,
      updatedBy: '当前用户',
      updatedAt: now,
      integrations: [],
      planCount: 0,
      taskStats: [100, 100, 100, 100, 100, 100, 100],
    };
    setEmployees((prev) => [newEmployee, ...prev]);
    setFormOpen(false);
    message.success('数字员工创建成功');
    // 创建成功后直接进入数字员工详情页
    onEnterDetail(newEmployee.id);
  };

  /** 编辑数字员工 */
  const handleEdit = (values: { name: string; description: string }) => {
    if (!editingEmployee) return;
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === editingEmployee.id
          ? { ...emp, ...values, updatedAt: new Date().toISOString() }
          : emp
      )
    );
    setEditingEmployee(undefined);
    setFormOpen(false);
    message.success('保存成功');
  };

  /** 确认删除数字员工 */
  const handleDelete = () => {
    if (!deleteTarget) return;
    setEmployees((prev) => prev.filter((emp) => emp.id !== deleteTarget.id));
    setDeleteTarget(null);
    message.success('删除成功');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 页面头部 */}
      <div className="max-w-6xl mx-auto px-8 pt-16 pb-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">数字员工</h1>
            <p className="text-gray-500 text-sm">
              管理配置了专用知识和技能的企业数字助理，实现 human-on-the-loop 管理视角
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingEmployee(undefined); setFormOpen(true); }}
            size="middle"
            className="rounded-lg"
          >
            新建数字员工
          </Button>
        </div>

        {/* 员工数量统计 */}
        <p className="text-xs text-gray-400 mb-6">{employees.length} 个数字员工</p>

        {/* 卡片网格列表 */}
        {employees.length === 0 ? (
          <Empty description="暂无数字员工，点击右上角「新建」创建第一个" className="mt-24" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <EmployeeCard
                key={emp.id}
                employee={emp}
                onClick={() => onEnterDetail(emp.id)}
                onEdit={() => { setEditingEmployee(emp); setFormOpen(true); }}
                onDelete={() => setDeleteTarget(emp)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      <EmployeeFormModal
        open={formOpen}
        editingEmployee={editingEmployee}
        onOk={editingEmployee ? handleEdit : handleCreate}
        onCancel={() => { setFormOpen(false); setEditingEmployee(undefined); }}
      />

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        open={!!deleteTarget}
        employee={deleteTarget}
        onOk={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default EmployeeList;

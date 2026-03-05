/**
 * DIP Studio - 数字员工管理平台
 * 主应用入口，管理页面路由状态：列表页 <-> 详情页
 */

import React, { useState } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';

/** 页面视图类型 */
type View = 'list' | 'detail';

const App: React.FC = () => {
  /** 当前视图 */
  const [view, setView] = useState<View>('list');
  /** 当前查看的数字员工 ID */
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);

  /** 进入数字员工详情 */
  const handleEnterDetail = (id: string) => {
    setCurrentEmployeeId(id);
    setView('detail');
  };

  /** 返回列表 */
  const handleBack = () => {
    setView('list');
    setCurrentEmployeeId(null);
  };

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`,
        },
        components: {
          Tree: {
            nodeHoverBg: '#f3f4f6',
            nodeSelectedBg: '#f3f4f6',
            colorText: '#374151',
          },
          Button: {
            borderRadius: 8,
          },
          Modal: {
            borderRadius: 12,
          },
        },
      }}
    >
      {view === 'list' && (
        <EmployeeList onEnterDetail={handleEnterDetail} />
      )}
      {view === 'detail' && currentEmployeeId && (
        <EmployeeDetail employeeId={currentEmployeeId} onBack={handleBack} />
      )}
    </ConfigProvider>
  );
};

export default App;

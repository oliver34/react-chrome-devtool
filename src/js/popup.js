import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { render } from 'react-dom';
import InjectJsTab from '@/components/InjectJsTab';
import packageJson from '../../package.json';
import '@/css/popup.less';

const { TabPane } = Tabs;

const config = {
  helpUrl: '',
  version: `v${packageJson.version}`,
  repositoryUrl: '',
  privateToken: '',
  ref: '',
};

function Popup() {
  // 当前选中的浏览器tab
  const [activeBrowserTab, setActiveBrowserTab] = useState({});
  // 默认选中的tab
  const [activeTab, setActiveTab] = useState('linkTab');

  // 比较版本
  const compareVersion = (v0, v1) => {
    const versionArr0 = v0.split('.');
    const versionArr1 = v1.split('.');
    for (let i = 0; i < versionArr0.length; i++) {
      if (versionArr0[i] < versionArr1[i]) {
        return true;
      }
    }
    return false;
  };


  // 获取当前的 Tab 信息
  const getCurrentTab = async () => {
    chrome.tabs.getSelected(null, (tab) => {
      setActiveBrowserTab(tab);
    });
  }

  // 获取默认选中的tab
  const getDetfaultActiveTab = async () => {
    chrome.storage.sync.get({ activeTab: 'linkTab' }, items => {
      setActiveTab(items.activeTab)
    });
  };

  // tab切换
  const handleTabChange = (key) => {
    setActiveTab(key);
    chrome.storage.sync.set({ activeTab: key });
  };

  useEffect(() => {
    getCurrentTab();
    getDetfaultActiveTab();
  }, []);

  return (
    <div className="popup-wrapper">
      <div className="popup-header">
        <div className="logo">
          <img src="../../img/r16.png" />
          <span>
            <small>&nbsp;&nbsp;{config.version}</small>
          </span>
        </div>
        <a target="_blank" href={config.helpUrl}>
          <small>插件使用帮助</small>
        </a>
      </div>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="前端快捷导航" key="linkTab">

        </TabPane>
        <TabPane tab="js注入" key="injectJsTab">
          <InjectJsTab />
        </TabPane>
        <TabPane tab="功能区" key="actionTab">

        </TabPane>
      </Tabs>
    </div>
  );
}

render(<Popup />, document.getElementById('popupRoot'));

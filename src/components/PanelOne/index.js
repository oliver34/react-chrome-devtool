import React, { useEffect, useState } from 'react';
import './index.less';

const PanelOne = () => {

  // 监听信息
  const handleListenMessage = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (
          request.source === 'chrome-devtools-bridge' &&
          request.target === 'devtool' && sender?.tab?.id === tabs[0].id
        ) {
         
        }
      });

      chrome.tabs.sendMessage(tabs[0].id, {
        source: 'chrome-devtools-bridge',
        action: 'devtoolInit',
        target: 'contentScript',
      }, (response) => {

      });
    });
  };

  // init
  const init = () => {
    handleListenMessage();
  }

  useEffect(() => {
    init();
  }, []);

  return (
    <div className="tools-view">
      tab1
    </div>
  );
};

export default PanelOne;

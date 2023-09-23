import React from 'react';
import { render } from 'react-dom';
import { Tabs } from 'antd';
import { RocketOutlined, InboxOutlined } from '@ant-design/icons';
import PanelOne from '@/components/PanelOne';
import PanelTwo from '@/components/PanelTwo';
import '@/css/panel.less';

const { TabPane } = Tabs;

function Panel() {
  return (
    <div className="panel-wrapper">
      <Tabs size="small" defaultActiveKey="his">
        <TabPane
          tab={
            <span>
              <InboxOutlined />
              one
            </span>
          }
          key="his"
        >
          <PanelOne />
        </TabPane>
        <TabPane
          tab={
            <span>
              <RocketOutlined />
              two
            </span>
          }
          key="h5"
        >
          <PanelTwo />
        </TabPane>
      </Tabs>
    </div>
  );
}

render(<Panel />, document.getElementById('panelRoot'));

import React, { useEffect, useState, useMemo } from 'react';
import { Button, Tag, Form, Input, Empty, Modal, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import './style.less'

const usualJs = [
  {
    name: 'moment',
    src: 'https://cdn.bootcdn.net/ajax/libs/moment.js/2.29.3/moment.min.js',
    icon: '',
  },
  {
    name: 'jQuery',
    hideName: true,
    color: '#cd201f',
    src: 'https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js',
    icon: '',
  },
  {
    name: 'lodash',
    color: '#bbb',
    src: 'https://cdn.bootcdn.net/ajax/libs/lodash.js/4.17.21/lodash.min.js',
    icon: '',
  },
];

const InjectJsTab = () => {
  const [injectedList, setInjectedList] = useState([]);
  const [form] = Form.useForm();

  const _setInjectedList = list => {
    const maps = new Map();
    // 去重
    const fileterList = list.filter(item => {
      if (maps.has(item.name)) {
        return false;
      } else {
        maps.set(item.name, 1);
        return true;
      }
    });
    setInjectedList(fileterList);
    chrome.storage.sync.set({ injectedList: fileterList });
  };

  const filterInjectList = useMemo(() => {
    return injectedList?.filter(item => !usualJs.find(usual => usual.name === item.name)) || [];
  }, [injectedList])

  const handleRemoveJs = (item, e) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除？',
      onOk: () => {
        const list = [...injectedList];
        const index = list.findIndex(i => i.name === item.name);
        list.splice(index, 1);
        _setInjectedList(list);
      },
    });
  };

  const handleConfirmInject = async () => {
    const res = await form.validateFields();
    handleInjectScript(res);
  };

  // 注入js
  const handleInjectScript = script => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.tabs.sendMessage(tabs[0].id, {
        source: 'chrome-devtools-bridge',
        action: 'injectScripts',
        target: 'contentScript',
        payload: script.src,
      });

      const list = [...injectedList, script];
      _setInjectedList(list);
      message.success('注入成功');
    });
  };

  useEffect(() => {
    chrome.storage.sync.get({ injectedList: [] }, items => {
      setInjectedList(items.injectedList);
    });
  }, []);

  return (
    <div>
      <h4 className="title">常用js</h4>
      <div className="usual-js-list">
        {usualJs.map((item, index) => (
          <Tag className="uaual-js-tag" key={index} color={item.color} onClick={() => handleInjectScript(item)}>
            {item.icon && <img className="js-icon" src={item.icon} />}
            {!item.hideName && item.name}
          </Tag>
        ))}
      </div>
      <h4 className="title">历史</h4>
      <ul className="injected-js-list">
        {filterInjectList.map((item) => (
          <Tag className="uaual-js-tag" key={item.name} color={item.color} onClick={() => handleInjectScript(item)} >
            {item.name}
            <CloseOutlined style={{ marginLeft: '5px' }} onClick={(e) => handleRemoveJs(item, e)}/>
          </Tag>
        ))}
        {!filterInjectList.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无" />}
      </ul>
      <h4 className="title">注入js</h4>
      <Form autoComplete="off" form={form} className="inject-form" layout="inline">
        <Form.Item
          required
          rules={[
            {
              required: true,
              message: 'js名称必填',
            },
          ]}
          name="name"
        >
          <Input placeholder="js名称" />
        </Form.Item>
        <Form.Item
          required
          rules={[
            {
              required: true,
              message: 'js地址必填',
            },
            {
              pattern: /^(https?:){0,1}\/\/.+/,
              message: 'js地址不正确',
            },
          ]}
          name="src"
        >
          <Input placeholder="js地址(在线umd地址)" />
        </Form.Item>
      </Form>
      <Button type="primary" onClick={handleConfirmInject}>
        确认注入
      </Button>
    </div>
  );
};
export default InjectJsTab;

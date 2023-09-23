// 注入的js，在这里可以进行dom操作和通信
(function () {
  try {
    function indexOf(str, key, num = 0) {
      if (!str || num < 0) {
        return -1;
      }
      let count = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === key) {
          if (count === num) {
            return i;
          }
          count++;
        }
      }
      return -1;
    }


    // 发送信息
    function sendMessage(payload) {
      window.postMessage({ source: 'chrome-devtools-bridge', payload, target: 'devtool' }, '*');
    }

    function init() {
      console.log('chrome plugin init');
    }
    init();
  } catch (error) {
    throw error;
  }
})();

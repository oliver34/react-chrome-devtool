(function () {
  try {
    var time1 = new Date().getTime();
    var pageFps = 0;
    var jsErrorNum = 0;
    var pageCanUseTime = 0;
    var countTotalElementNum = 0;
    var iframeNum = 0;
    var imageSrcNull = 0;
    var imageDisplayNoneNum = 0;
    // var styleTransitionPropertyNum = 0;
    var stylePositionNum = 0;
    var notInFirstScreen = 0;
    var baseJsHeapSizeLimit = window.performance.memory.jsHeapSizeLimit;

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    /**
     * generate element mark, eg: div#id.class1.class2
     *
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */
    function generateElementMark(element) {
      var id = element.id;
      var className = element.className;
      if (className && className.baseVal) {
        className = className.baseVal;
      }
      className = typeof className == 'string' ? className.split(' ').join('.') : '';
      return element.tagName.toLowerCase() + (id ? '#' + id : '') + (className ? '.' + className : '');
    }

    function getElementTop(element) {
      var actualTop = element.offsetTop;
      var current = element.offsetParent;
      while (current !== null) {
        actualTop += current.offsetTop;
        current = current.offsetParent;
      }
      return actualTop;
    }

    /** 注入injectJs */
    function injectCustomJs() {
      // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
      const injectScript = chrome.extension.getURL('js/injectScripts.js');
      injectScripts(injectScript);
    }

    /** 监听消息 */
    function listenMessage() {
      let receivedData = {};
      /** 监听PostMessage消息 */
      window.addEventListener(
        'message',
        e => {
          if (e.data && e.data.source !== 'chrome-devtools-bridge') {
            return;
          }
          receivedData = e.data;
          chrome.runtime.sendMessage(e.data, () => { });
        },
        false
      );

      /** 监听插件通信消息 */
      chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        const { target, payload, action } = request;
        if (target !== 'contentScript') {
          return;
        }

        switch (action) {
          case 'reload': // 重新加载
            window.location.reload();
            break;
          case 'devtoolInit': // devtool打开
            sendResponse(receivedData);
            break;
          case 'switchVersion': // 切换资源版本
            switchVersion(payload); 
            break;
          case 'clearSession': // 清除sessionstorage
            sessionStorage.clear(); 
            window.location.reload();
            break;
          case 'injectScripts': // 注入js
            injectScripts(payload);
          default:
            break;
        }
      });
    }

    /** 切换资源版本 */
    function switchVersion(payload) {
      sessionStorage.publicPortalVersion = payload.portalVersion;
      const appsLocalConfig = JSON.parse(sessionStorage.appsLocalConfig || '{}');
      sessionStorage.appsLocalConfig = JSON.stringify({
        ...appsLocalConfig,
        ...payload.applicationInfo,
      });
      window.location.reload();
    }

    /** js注入 */
    function injectScripts(scripts) {
      if(!Array.isArray(scripts)) {
        scripts = [scripts];
      }

      let scriptElement;
      scripts?.forEach(item => {
        scriptElement = document.createElement('script');
        scriptElement.setAttribute('type', 'text/javascript');
        scriptElement.src = item;
        scriptElement.onload = function () {
          this.parentNode.removeChild(this);
        };
        document.head.appendChild(scriptElement);
      });
    }

    /**
     * get max depth(nesting level) of given element
     *
     * @param  {HTMLElement} element [html element]
     */
    function getMaxDepth(element, bgcolor, level) {
      var children = element.children;
      var childrenDepth = 0;
      var childPath = '';
      var path = generateElementMark(element);
      var depth = 1;
      level = level + depth;
      if (level > 14 && bgcolor) {
        // console.log('level', level, element, element.style);
        element.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
      }
      if (element.tagName.toLowerCase() == 'iframe') {
        iframeNum++;
      }
      if (element.tagName.toLowerCase() == 'img') {
        if (!element.src) {
          imageSrcNull++;
        }
        if (element.style.display == 'none') {
          // image display style is none
          imageDisplayNoneNum++;
        }
        // 判断图片是否在首屏，图片 top 不建议大于 2000
        // console.log('image top', getElementTop(element), window.screen.height);
        if (getElementTop(element) > window.screen.height) {
          notInFirstScreen++;
        }
      }
      // 检测特殊样式
      // if (element.style.transitionProperty) {}
      if (element.style.position == 'relative' || element.style.position == 'absolute') {
        stylePositionNum++;
      }
      if (!children || children.length <= 0) {
        return {
          depth: depth,
          // record go through path
          path: path,
        };
      }

      for (var i = 0, len = children.length, depthObj; i < len; i++) {
        depthObj = getMaxDepth(children[i], bgcolor, level);
        if (depthObj.depth > childrenDepth) {
          childrenDepth = depthObj.depth;
          childPath = depthObj.path;
        }
      }

      // if (depth + childrenDepth > 14) {
      //   console.log(path + ' > ' + childPath, depth + childrenDepth);
      // }

      return {
        depth: depth + childrenDepth,
        path: path + ' > ' + childPath,
      };
    }

    // 检查层级
    function check(checkbody, bgcolor) {
      var maxDepthObj = getMaxDepth(checkbody, bgcolor, 0);
      // remove body level
      var maxLevel = maxDepthObj.depth - 1;
      return maxLevel;
    }

    // FPS 检查
    var showFPS = (function () {
      var requestAnimationFrame =
        window.requestAnimationFrame || //Chromium
        window.webkitRequestAnimationFrame || //Webkit
        window.mozRequestAnimationFrame || //Mozilla Geko
        window.oRequestAnimationFrame || //Opera Presto
        window.msRequestAnimationFrame || //IE Trident?
        function (callback) {
          //Fallback function
          window.setTimeout(callback, 1000 / 60);
        };
      var e, pe, pid, fps, last, offset, step, appendFps;

      fps = 0;
      last = Date.now();
      step = function () {
        offset = Date.now() - last;
        fps += 1;
        if (offset >= 1000) {
          last += offset;
          appendFps(fps);
          fps = 0;
        }
        requestAnimationFrame(step);
      };
      //显示fps; 如果未指定元素id，默认<body>标签
      appendFps = function (fps) {
        // pageFps = fps;
        // if(!e) e=document.createElement('span');
        // e.className = 'rax-tools-view-fps';
        // e.id = 'J_RaxToolsViewFPS';
        // pe=pid?document.getElementById(pid):document.getElementsByTagName('body')[0];
        // e.innerHTML = "fps: " + fps;
        // pe.appendChild(e);
      };
      return {
        setParentElementId: function (id) {
          pid = id;
        },
        go: function () {
          step();
        },
      };
    })();

    // 文件资源加载错误
    window.addEventListener(
      'error',
      function (e) {
        jsErrorNum++;
      },
      true
    );

    // 统计页面标签数量
    var elementName = '';
    function countTotalElement(node) {
      ///Attribute  nodeType值为2，表示节点属性
      ///Comment    nodeType值为8，表示注释文本
      ///Document   nodeType值为9，表示Document
      ///DocumentFragment   nodeType值为11，表示Document片段
      ///Element            nodeType值为1，表示元素节点
      ///Text               nodeType值为3，表示文本节点
      var total = 0;
      //1代表节点的类型为Element
      if (node.nodeType == 1) {
        total++;
        elementName = elementName + node.tagName + '\r\n';
      }
      var childrens = node.childNodes;
      for (var i = 0; i < childrens.length; i++) {
        total += countTotalElement(childrens[i]);
      }
      return total;
    }

    window.onload = function () {
      console.log('开始加载contentScripts');
      var document = window.document;
      var body = document ? document.body : null;

      showFPS.go();

      setTimeout(function () {
        // 关闭 fps
        // document.getElementById('J_RaxToolsViewFPS').onclick = function() {
        //   document.getElementById('J_RaxToolsViewFPS').style = "display: none;"
        // }

        injectCustomJs();
        listenMessage();
      }, 1000);

      // 加载时间
      var time2 = new Date().getTime();
      var time = time2 - time1; // 短计时，暂不对外暴露

      // var createDiv = document.createElement('div');
      // createDiv.setAttribute('id', 'J_RaxToolsView');
      // createDiv.setAttribute('class', 'rax-tools-view');
      // document.body.appendChild(createDiv);

      // 统计标签数量
      countTotalElementNum = countTotalElement(document);

      // init
      setTimeout(function () {
        var level = check(body);

        // 加载各时间分析
        var t_prerequestTime = performance.timing.requestStart - performance.timing.navigationStart;
        var t_latencyTime = performance.timing.responseStart - performance.timing.requestStart;
        var t_serverTime = performance.timing.responseEnd - performance.timing.responseStart;
        var t_domLoadingTime = performance.timing.domInteractive - performance.timing.responseEnd;
        var t_domCompleteTime = performance.timing.domComplete - performance.timing.domInteractive;
        var t_loadTime = performance.timing.loadEventEnd - performance.timing.domComplete;
        var t_onloadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        var t_totalTime = t_prerequestTime + t_latencyTime + t_serverTime + t_domLoadingTime + t_domCompleteTime + t_loadTime;

        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
          if (request.type == 'raxpage') {
            sendResponse({
              pageLoadTime: time2 - window.performance.timing.navigationStart,
              pageLevel: level,
              pageFps: pageFps,
              jsErrorNum: jsErrorNum,
              pageCanUseTime: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
              jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit - baseJsHeapSizeLimit,
              countTotalElementNum: countTotalElementNum,
              t_prerequestTime: t_prerequestTime,
              t_latencyTime: t_latencyTime,
              t_serverTime: t_serverTime,
              t_domLoadingTime: t_domLoadingTime,
              t_domCompleteTime: t_domCompleteTime,
              t_loadTime: t_loadTime,
              t_onloadTime: t_onloadTime,
              t_totalTime: t_totalTime,
              iframeNum: iframeNum,
              imageSrcNull: imageSrcNull,
              imageDisplayNoneNum: imageDisplayNoneNum,
              stylePositionNum: stylePositionNum,
              notInFirstScreen: notInFirstScreen,
            });
          } else if (request.type == 'raxlevel') {
            check(body, 'red');
          }
        });
      }, 300);
    };
  } catch (error) {
    console.error('contentScripts error: ', error);
  }
})();

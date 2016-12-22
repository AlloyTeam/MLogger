/**
 * LOG使用方法
 * 引入：在需要使用log的页面引入<script src="js/common/log.js?__inline"></script>放置在body底部的第一个例如index.html
 * 开关：openLog 这个字段存在localStorage里面，目前是写死的打开，关于界面上怎么交互来打开还需要讨论
 * 引入和开关都完成时候就可以使用了，直接用console.log来打印log，级别分为["DEBUG", "LOG", "INFO", "WARN", "ERROR"];分别对应不同的方法例如console.error
 * 目前在model和index的部分逻辑添加了log，在badjs的onerror方法里面也添加了出错的console.error
 *
 */

(function(root, factory) {
    root.Logger['Console'] = factory();
}(this, function() {
    var LOG_ARR = window.Logger.data.CONSOLE_LOG_ARR.reverse();
    var pageNum = 10;
    var toolContainer,
        container,
        toolLogData,
        closeBtn,
        tabContainer,
        toolClearLog,
        showmoreBtn,
        cgiDetail;

    var initDom = function() {
        toolContainer = document.getElementById('mqq-tools');
        container = document.getElementById('tools-log-tab');
        toolLogData = document.getElementById('tools-log-data');
        closeBtn = document.getElementById('tools-close-btn');
        tabContainer = document.getElementById('tools-tab-container');
        toolClearLog = document.getElementById('clear-log');
        showmoreBtn = document.getElementById('tools-log-more');
        clearStorage = document.getElementById('clearStorage');
        cgiDetail = document.getElementById('cgiDetail');
    };

    var util = {
        loadCss: function(href){
            var ss = window.document.createElement("link");
            var ref = window.document.getElementsByTagName("script")[0];
            ss.rel = "stylesheet";
            ss.href = href;
            ss.media = "all";
            ref.parentNode.insertBefore(ss, ref);

            return ss;
        },
        sizeof: function(str){
            var total = 0,
                charCode,
                i,
                len;
            for (i = 0, len = str.length; i < len; i++) {
                charCode = str.charCodeAt(i);
                if (charCode <= 0x007f) {
                    total += 1;
                } else if (charCode <= 0x07ff) {
                    total += 2;
                } else if (charCode <= 0xffff) {
                    total += 3;
                } else {
                    total += 4;
                }
            }
            return total;
        },
        addIntent: function(num, str, useIntent){
            //添加缩进 暂定为2个空格
            if (!useIntent) {
                var result = '';
                for (var i = 0; i < num; i++) {
                    result += '  ';
                }
                return result + str;
            } else {
                return str;
            }
        },
        getUrlParams: function(href, type) {
            var l = document.createElement("a");
            l.href = href;
            return l[type];
        },
        formatDate: function(num, format) { //.format('MM-dd h:mm:ss.S')
            num = new Date(num);
            format = 'MM-dd h:mm:ss.S';
            var date = {
                "M+": num.getMonth() + 1,
                "d+": num.getDate(),
                "h+": num.getHours(),
                "m+": num.getMinutes(),
                "s+": num.getSeconds(),
                "S+": num.getMilliseconds()
            };
            for (var k in date) {
                if (new RegExp("(" + k + ")").test(format)) {
                    format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
                }
            }
            return format;
        },
        nextAll: function(dom,s){
            var els = [],
                el = dom.nextElementSibling;
            while (el) {
                if (el.classList.contains(s)) els.push(el);
                el = el.nextElementSibling;
            }
            return els;
        }
    };



    var formatJSON = function(obj, intent) {

        var html = '';
        var i;

        var type = Object.prototype.toString.call(obj);


        if (type === '[object Array]') {
            if (obj.length === 0) {
                html += util.addIntent(intent, '[]');
            } else {
                html += '[' + '\r\n';
                for (i = 0; i < obj.length; i++) {
                    html += util.addIntent(intent + 1, formatJSON(obj[i], intent + 1) + (i == obj.length - 1 ? '' : ',') + '\r\n'); //递归调用
                }
                html += util.addIntent(intent, ']');
            }

        } else if (type === '[object Object]') {
            try {
                JSON.stringify(obj);
            } catch (e) {
                throw e.message;
            }

            var count = 0;
            var key;

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    count++;
                }
            }
            if (count === 0) {
                html += util.addIntent(intent, '{}');
            } else {
                i = 0;

                html += '{<span class=\'tree-node off\'></span><span class=\'wrapper hidden\'>' + '\r\n';

                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        i++;
                        var objArr = [];
                        html += util.addIntent(intent + 1, '<span class=\'key\'>"' + key + '"</span>' + ':' + formatJSON(obj[key], intent + 1) + (i === count ? '' : ',') + '\r\n'); //递归调用
                    }
                }

                html += util.addIntent(intent, '</span>}');
            }
        } else if (type === '[object Number]') {
            html += '<span class=\'number\'>' + obj + '</span>';
        } else if (type === '[object Boolean]') {
            html += '<span class=\'boolean\'>' + obj + '</span>';
        } else if (type === '[object Undefined]') {
            html += '"undefined"';
        } else if (type === '[object Null]') {
            html += '<span class=\'null\'>' + obj + '</span>';
        } else if (type === '[object String]') {
            html += '<span class=\'string\'>"' + obj.replace('\r\n','').split("<").join("&lt;").split(">").join("&gt;") + '"</span>'; //xss
        } else if (type.match(/^\[object HTML([a-zA-Z]*)Element\]$/)) {
            var attributes = obj.attributes;
            var str = '';
            var isChild;
            for (var i = 0; i < attributes.length; i++) {
                str += '<span class=\'attr-name\'>' + attributes[i].nodeName + '</span><span class=\'tag-name\'>="</span><span class=\'attr-value\'>' + attributes[i].nodeValue + '</span><span class=\'tag-name\'>"</span> ';
            }
            isChild = obj.childElementCount || (obj.nodeName.toLowerCase() === 'script' && !obj.src);
            html += isChild ? '<span class=\'html-node\'></span>' : '';
            html += '<span class=\'tag-name\'>&lt;' + obj.nodeName.toLowerCase() + '</span> ' + str + '<span class=\'tag-name\'>&gt;</span>' + (obj.childElementCount ? '' : '');
            html += isChild ? '<span class=\'quot\'>...</span><span class=\'wrapper hidden\'>' : '';
            var children = obj.children;
            for (var j = 0; j < children.length; j++) {
                html += (isChild ? '\r\n' : '');
                html += util.addIntent(intent + 1, formatJSON(children[j], intent + 1)); //递归调用

            }

            html += obj.childElementCount ? '' : obj.textContent.replace(/</g,'&lt;').replace(/>/g,'&gt;');

            html += (isChild ? '\r\n' : '');
            html += isChild ? util.addIntent(intent, '</span><span class=\'tag-name\'>&lt;/' + obj.nodeName.toLowerCase() + '&gt;</span>') : '<span class=\'tag-name\'>&lt;/' + obj.nodeName.toLowerCase() + '&gt;</span>';


        } else {
            html += '<span class=\'string\'>' + type + '</span>';
        }


        return html;
    };
    // var syntaxHighlight = function(json) {
    //     //json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    //     return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
    //         var cls = 'number';
    //         if (/^"/.test(match)) {
    //             if (/:$/.test(match)) {
    //                 cls = 'key';
    //             } else {
    //                 cls = 'string';
    //             }
    //         } else if (/true|false/.test(match)) {
    //             cls = 'boolean';
    //         } else if (/null/.test(match)) {
    //             cls = 'null';
    //         }
    //         return '<span class="' + cls + '">' + match + '</span>';
    //     });
    // };



    var appendHTML = function() {

        var getCookie = function() {

            var str = "<label>cookie信息</label>" +
                "<div class='info'><table class='cookie-table'>$$cookie</table></div>";

            var arr = document.cookie.split(';');
            var table = document.createElement('table');
            for (var i = 0; i < arr.length; i++) {
                var tr = document.createElement('tr');
                var tdKey = document.createElement('td');
                var tdValue = document.createElement('td');
                tdKey.textContent = arr[i].split('=')[0];
                tdValue.textContent = arr[i].split('=')[1];
                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                table.appendChild(tr);
            }

            return str.replace('$$cookie', table.innerHTML);
        };
        var getCodeEx = function() {
            var str = "<label>codeEx</label>" +
                "<div class='info'>$$codeEx</div>";

            var div = document.createElement('div');
            var ul = document.createElement('ul');
            ul.id = 'codeExUl';
            var input = document.createElement('input');
            var btn = document.createElement('div');
            btn.innerHTML = 'Submit';
            btn.classList.add('eval-btn');
            btn.classList.add('other-btn');
            input.type = 'email';
            input.id = 'evalInput';
            div.appendChild(ul);
            div.appendChild(input);
            div.appendChild(btn);

            return str.replace('$$codeEx', div.innerHTML);

        };
        var getLocation = function() {
            var str = "<label>当前网页链接</label>" +
                "<p class='info'>" + window.location.href + "</p>";
            return str;
        };


        var getCgi = function() {

            var str = "<label>cgi</label>" +
                "<div id='cgiInfo' class='info'><table id='cgiTable' class='cgi-table'>$$cgi</table><div class='hidden log-cgi-detail' id='cgiDetail'></div></div>";


            var arr = window.Logger.data.cgiArr;
            var table = document.createElement('table');
            for (var i = 0; i < arr.length; i++) {
                var tr = document.createElement('tr');
                tr.classList.add('cgi-tr');
                tr.setAttribute('index', i);
                var tdCgi = document.createElement('td');
                var tdTime = document.createElement('td');
                var tdSize = document.createElement('td');
                tdCgi.textContent = util.getUrlParams(arr[i].url, 'pathname');
                tdTime.textContent = arr[i].time + 'ms';
                tdSize.textContent = util.sizeof(arr[i].text) + 'b';
                tr.appendChild(tdCgi);
                tr.appendChild(tdTime);
                tr.appendChild(tdSize);
                table.appendChild(tr);
            }

            return str.replace('$$cgi', table.innerHTML);
        };

        var getResource = function() {
            var str = "<label>资源耗时</label>" +
                "<div id='resourceInfo' class='info'><table id='resourceTable' class='info-table'>$$resource</table></div>";

            var table = document.createElement('table');

            if (window.performance && window.performance.getEntries) {

                var fileRegExp = /([^\/]+\.(js|css))/,
                    dataArr = window.performance.getEntries(),
                    data;

                for (var i = 0; i < dataArr.length; i++) {
                    data = dataArr[i];
                    if (data.initiatorType === 'link' || data.initiatorType === 'script') {
                        var tr = document.createElement('tr');
                        tr.classList.add('resource-tr');
                        tr.setAttribute('index', i);
                        var tdResoure = document.createElement('td');
                        var tdTime = document.createElement('td');
                        tdResoure.textContent = fileRegExp.exec(data.name) ? fileRegExp.exec(data.name)[0] : '';
                        tdTime.textContent = parseInt(data.duration) + 'ms';
                        tr.appendChild(tdResoure);
                        tr.appendChild(tdTime);
                        table.appendChild(tr);
                    }
                }
            }

            return str.replace('$$resource', table.innerHTML);
        };

        var getDomEl = function() {
            var g = formatJSON(document.getElementsByTagName('html')[0], 0);
            var str = "<label>HTML结构</label>" +
                "<div id='htmlInfo' class='info'><pre style='word-wrap: break-word;'>"+g+"</pre></div>";

            return str;
        };
        var getLs = function() {
            var str = "<label>LocalStorage</label>" +
                "<div id='lsInfo' class='info'><div id='lsTable' class='info-table'>$$!!ls</div></div>";
            var table = document.createElement('div');
            for (var key in window.localStorage) {
                var data = window.localStorage.getItem(key);
                if (typeof data === 'string') {
                    var tr = document.createElement('div');

                    tr.classList.add('ls-tr');
                    //tr.setAttribute('index', i);
                    var tdKey = document.createElement('div');
                    var tdData = document.createElement('div');
                    tdKey.classList.add('ls-td');
                    tdKey.classList.add('ls-td-key');
                    tdData.classList.add('ls-td');
                    tdData.classList.add('ls-td-data');
                    tdKey.innerHTML = '<span style="color:#2E507F;">(' + (Number(util.sizeof(data))/1024/1024).toFixed(2) + 'MB) </span>' + key;
                    try {
                        data = JSON.parse(data);
                    }catch(e){
                        tdData.classList.add('ls-td-string');
                        data = data;
                    }
                    tdData.innerHTML = "<pre>" + formatJSON(data, 0) + "</pre>";
                    tr.appendChild(tdKey);
                    tr.appendChild(tdData);
                    table.appendChild(tr);
                }

            }
            return str.replace('$$!!ls', table.innerHTML);
        };

        var getEnv = function() {
            var str = "<label>环境信息</label>" +
                "<p class='info'>$$env</p>";

            var env = {
                'os': window.navigator.userAgent.match(/(Android);?[\s\/]+([\d.]+)?/) ? 'android' : 'ios',
                'network': window.navigator.onLine
            };

            return str.replace('$$env', JSON.stringify(env));
        };
        var getMyWidget = function() {
            var myStr = '';
            var myWidget = window.Logger.data.LoggerOption.myWidget;
            for (var i = 0; i < myWidget.length; i++) {
                myStr += myWidget[i].getHtml() || '';
            }
            return myStr;
        };
        var getOthers = function() {
            //var p1 = "<p class='other-text'>此页面的上报次数："+window.reportCount+"  &nbsp;共消耗流量："+sizeof(window.reportArr.join(''))+" b</p>";
            //var p2 = "<p class='other-text'>此页面的domComplete时间："+(window.performance.timing.domComplete - window.performance.timing.fetchStart)+"ms  &nbsp;</p>";
            //var b1 = "<div class='other-btn' id='clickReport'>一键上报</div>";
            var b2 = "<div class='other-btn' id='clearStorage'>清除localstorage</div>";
            // var b3 = "<div class='other-btn' id='updateOffline'>更新离线包版本</div>";
            // var b4 = "<div class='other-btn' id='getOffline'>离线包版本</div>";
            var myStr = '';
            var myBtn = window.Logger.data.LoggerOption.myButton;
            for (var i = 0; i < myBtn.length; i++) {
                myStr += myBtn[i].getHtml() || '';
            }

            //return b1 + b2 + b4 + b3 + myStr;
            return b2 + myStr;
        };
        var str = "<div class='hidden slideDown' id='mqq-tools'>" +
            "<a id='tools-close-btn'></a>" +
            "<ul id='tools-head'>" +
            "<li id='tools-log-li' class='active-log'>日志</li>" +
            "<li id='tools-func-li'>常用功能</li>" +
            "</ul>" +
            "<div id='tools-tab-container'>" +
            "<div id='tools-log-tab' class='tools-tab active-log'>" +
            // "<div id='tools-log-opera'>"+
            //     "<div class='clear-log' id='clear-log'></div>"+
            // "</div>"+
            "<div id='tools-log-data'>" +
            "</div>" +
            "<div id='tools-log-more' page='1'>暂无数据" +
            "</div>" +
            "</div>" +
            "<div id='tools-func-tab' class='tools-tab'>" +
            "<div id='funcWrap' class='func-wrap'>" +
            "$$widget" +
            "<label>其他功能</label>" +
            "<div class='info'>$$other</div>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";


        var getWidget = function() {

            var widgetList = window.Logger.data.LoggerOption.widgetList;
            var widgetMap = {
                'location': getLocation,
                'env': getEnv,
                'cookie': getCookie,
                'cgi': getCgi,
                'codeEx': getCodeEx,
                'resource': getResource,
                'dom': getDomEl,
                'localStorage': getLs,
            };
            var str = '';
            for (var i = 0; i < widgetList.length; i++) {
                if (widgetMap[widgetList[i]]) {
                    str += widgetMap[widgetList[i]]();
                }
            }
            return str + getMyWidget();
        };
        str = str.replace('$$widget', function(){
            var z = getWidget();
            return z;
        }).replace('$$other', getOthers());

        var div = document.createElement('div');
        div.innerHTML = str;
        document.body.appendChild(div);
    };
    //绑定事件逻辑
    var bindEvent = function() {
        var tabLiHandler = function(e) {
            var target = e.target,
                id = target.id.replace('-li', '-tab'),
                activeDom = document.querySelectorAll('.active-log'),
                i;

            for (i = activeDom.length; i--;) {
                activeDom[i].classList.remove('active-log');
            }
            document.querySelector('#' + id).classList.add('active-log');
            target.classList.add('active-log');
        };

        var tabLiArr = document.querySelectorAll('#tools-head li');
        for (var i = tabLiArr.length; i--;) {
            tabLiArr[i].addEventListener('click', tabLiHandler, false);
        }

        toolContainer.addEventListener('touchmove', function(e) {
            e.stopPropagation(); //阻止后面的dom滚动
            return false;
        });
        closeBtn.addEventListener('touchstart', function() {
            toolContainer.classList.toggle('hide-log');
            closeBtn.classList.toggle('extend');
        }, false);
        //json和dom可展开逻辑
        toolContainer.addEventListener('touchstart', function(e) {
            var target = e.touches[0].target;
            if (target.classList.contains('tree-node') || target.classList.contains('html-node')) {
                target.classList.toggle('off');
                if (target.nextElementSibling.classList.contains('wrapper')) {
                    target.nextElementSibling.classList.toggle('hidden');
                } else {
                    var nextQ = util.nextAll(target,'quot');
                    for (var i = 0 ; i < nextQ.length ; i++) {
                        nextQ[i].classList.toggle('hidden');
                        break;
                    }
                    var nextW = util.nextAll(target,'wrapper');
                    for (var i = 0 ; i < nextW.length ; i++) {
                        nextW[i].classList.toggle('hidden');
                        break;
                    }
                    // $(target).nextAll('.quot').toggleClass('hidden'); //parentElement.querySelector('.quot').classList.toggle('hidden');
                    // //target.parentElement.querySelector('.wrapper').classList.toggle('hidden');
                    // $(target).nextAll('.wrapper').toggleClass('hidden');
                }
                // if (target.nextElementSibling.classList.contains('quot')) {
                //     target.nextElementSibling.nextElementSibling.classList.toggle('hidden');
                // }
            } else if (target.parentElement.classList.contains('cgi-tr')) {
                if (target.parentElement.classList.contains('cgi-tr')) {
                    getCgiDetail(target);
                }
            } else if (target.classList.contains('close-detail')) {
                cgiDetail.classList.add('hidden');
            } else if (target.classList.contains('eval-btn')) {
                getEvalContent();
            }
        });

        // toolClearLog.addEventListener('touchstart', function(){
        //     toolLogData.innerHTML = '';
        //     window.CONSOLE_LOG_ARR = [];

        // });
        //分页逻辑
        showmoreBtn.addEventListener('touchstart', function(e) {

            var page = parseInt(e.target.getAttribute('page'));
            var hasLength = Math.max(0, LOG_ARR.length - (pageNum * page));
            var length = hasLength < pageNum ? hasLength : pageNum;
            for (var i = 0; i < length; i++) {
                renderLog(LOG_ARR[i + pageNum * page]);
            }
            e.target.setAttribute('page', page + 1);
            if (hasLength < pageNum) {
                e.target.innerHTML = '暂无数据';
            }
        });

        clearStorage.addEventListener('touchstart', function() {
            window.localStorage.clear();
            alert('localStorage清除成功。');
        });

        // updateOffline.addEventListener('touchstart', function() {

        //     mqq.offline.checkUpdate({
        //         bid: 128
        //     }, function(obj) {
        //         if (obj.url) {
        //             mqq.offline.downloadUpdate({
        //                 bid: 128,
        //                 url: obj.url
        //             }, function(result) {
        //                 if (result.ret === 0) {
        //                     Tip.show("更新成功" + obj.version);
        //                 } else {
        //                     Tip.show("更新失败");
        //                 }

        //             });
        //         } else {
        //             Tip.show("已经是最新");
        //         }

        //     });
        // });

        // getOffline.addEventListener('touchstart', function() {

        //     mqq.offline.isCached({
        //         bid: 128
        //     }, function(localVersion) {
        //         Tip.show("版本号：" + localVersion);
        //     });
        // });
        // clickReport.addEventListener('touchstart', function() {
        //     var arr = window.Logger.data.CONSOLE_LOG_ARR;
        //     var current = Date.now();
        //     var reportData = [];
        //     for (var i = 0; i < arr.length; i++) {
        //         if (current - arr[i].time < 1000 * 60 * 5) {
        //             reportData.push(arr[i]);
        //         }
        //     }
        //     //reportData.length = 1;
        //     window.Logger.Ajax.request('http://xiaoqu.qq.com/cgi-bin/feedback/re/creport', {
        //         method: 'POST',
        //         data: JSON.stringify(reportData),
        //         success: function(xhr) {
        //             var obj = JSON.parse(xhr.responseText);
        //             if (obj == 0) {
        //                 window.Logger.checkWrightList();
        //                 alert('上报成功');
        //             } else {
        //                 alert('上报失败');
        //             }
        //         },
        //         failure: function() {
        //             //window.localStorage.setItem('hasPid',JSON.stringify({pid:'',keySet:null,ptime:Date.now()}));
        //             alert('上报失败');
        //         }
        //     });
        //     //console.log(reportData);
        // });


        window.Logger.data.LoggerOption.myEvent();
    };
    var getEvalContent = function() {
        var evalInput = document.getElementById('evalInput');
        var li = document.createElement('li');
        li.classList.add('eval-li');
        var p1 = "<p class='exec'>>>>  " + evalInput.value + "</p>";
        var value,
        error = '';
        try {
            value = window.eval(evalInput.value);
        } catch (e) {
            error = 'error';
            value = e.message;
        }

        //if (value)
        var p2 = "<pre class='exec-content "+error+"'>" + (formatJSON(value, 0)) + "</pre>";
        li.innerHTML = p1 + p2;

        document.getElementById('codeExUl').appendChild(li);
    };
    var getCgiDetail = function(target) {
        var tr = target.parentElement;
        var arr = document.getElementsByClassName('cgi-tr');
        for (var i = arr.length - 1; i >= 0; i--) {
            arr[i].classList.remove('active-cgi');
        }
        tr.classList.add('active-cgi');

        var index = tr.getAttribute('index');
        var wrap = document.getElementById('cgiDetail');

        var closeDetail = "<h1 class='title'>详细信息</h1>";
        var headers = "<h3>ResponseHeaders:</h3><pre class='detail-data'>" + window.Logger.data.cgiArr[index].headers + "</pre>";
        var url = "<h3>RequestUrl:</h3><pre class='detail-data'>" + util.getUrlParams(window.Logger.data.cgiArr[index].url, 'pathname') + "</pre>";
        var code = "<h3>Code:</h3><pre class='detail-data'>" + window.Logger.data.cgiArr[index].status + "</pre>";
        var paramsStr = window.Logger.data.cgiArr[index].params;
        var getParamsObj = function(arr) {
            var obj = {};
            for (var i = 0; i < arr.length; i++) {
                obj[arr[i].split('=')[0]] = arr[i].split('=')[1];
            }
            return obj;
        };
        if (paramsStr.lastIndexOf('http://') > -1) {
            arr = util.getUrlParams(paramsStr, 'search').split('&');
        } else {
            arr = paramsStr.split('&');
        }
        var params = "<h3>Params:</h3><pre class='detail-data'>" + JSON.stringify(getParamsObj(arr), null, 2) + "</pre>";
        var response = "<h3>Response:</h3><pre class='detail-data'>" + formatJSON(JSON.parse(window.Logger.data.cgiArr[index].text), 0) + "</pre>";
        wrap.innerHTML = closeDetail + headers + url + code + params + response;

        wrap.classList.remove('hidden');

    };
    var first = true;
    var lastOpenTime = 0;
    var createLog = function() {
        if ((+new Date()) - lastOpenTime < 5000) {
            return;
        }
        if (first) {
            util.loadCss(window.Logger.data.LOG_CSS_URL);
            appendHTML();
            initDom();

            window.Logger.data.IS_CONSOLE_OPEN = true;
            var len = Math.min(pageNum, LOG_ARR.length);
            for (var i = 0; i < len; i++) {
                renderLog(LOG_ARR[i]);
            }

            bindEvent();
            first = false;

        } else {

            if (window.Logger.data.IS_CONSOLE_OPEN) {
                toolContainer.style.display = 'none';
            } else {
                toolContainer.style.display = 'block';
            }
            window.Logger.data.IS_CONSOLE_OPEN = !window.Logger.data.IS_CONSOLE_OPEN;
        }
        lastOpenTime = +new Date();
        document.getElementById('log-preload').style.display = 'none';
        toolContainer.classList.remove('hidden');

    };


    var renderLog = function(obj, front) {

        var contentStr,
            content;


        var contents = obj.content;
        var arr = [];
        for (var i = 0; i < contents.length; i++) {
            content = contents[i];
            try {
                //contents[i] = formatJSON(content, 0);
                arr[i] = formatJSON(content, 0);
            } catch (e) {
                obj.level = 'ERROR';
                //contents[i] = e;
                arr[i] = e;
            }

        }
        contentStr = "<div class='log-content one-line more-content'>" + arr.join('|') + "</div>";
        if (front) {
            toolLogData.innerHTML = "<div class='log-line " + obj.level + "'><p class='log-toptext'><span>" + util.formatDate(obj.time) + "</span><span class='log-copy'></span></p>" + contentStr + "</div>" + toolLogData.innerHTML;
        } else {
            toolLogData.innerHTML += "<div class='log-line " + obj.level + "'><p class='log-toptext'><span>" + util.formatDate(obj.time) + "</span><span class='log-copy'></span></p>" + contentStr + "</div>";
        }

    };
    var renderCgi = function(index) {

        var arr = window.Logger.data.cgiArr;
        var table = document.getElementById('cgiTable');
        for (var i = index; i < arr.length; i++) {
            var tr = document.createElement('tr');
            tr.classList.add('cgi-tr');
            tr.setAttribute('index', i);
            var tdCgi = document.createElement('td');
            var tdTime = document.createElement('td');
            var tdSize = document.createElement('td');
            tdCgi.textContent = util.getUrlParams(arr[i].url, 'pathname');
            tdTime.textContent = arr[i].time + 'ms';
            tdSize.textContent = util.sizeof(arr[i].text) + 'b';
            tr.appendChild(tdCgi);
            tr.appendChild(tdTime);
            tr.appendChild(tdSize);
            table.appendChild(tr);
        }

    };
    return {
        createLog: createLog,
        renderLog: renderLog,
        renderCgi: renderCgi
    };

}));

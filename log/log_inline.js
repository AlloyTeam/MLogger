/**
 * LOG使用方法
 * 引入：在需要使用log的页面引入<script src="js/common/log.js?__inline"><\/script>放置在body底部的第一个例如index.html 如果不需要log立即生效 则在需要的地方调用MLogger.init
 * 开关：openLog 这个字段存在localStorage里面，目前是写死的打开，关于界面上怎么交互来打开还需要讨论
 * 引入和开关都完成时候就可以使用了，直接用console.log来打印log，级别分为["LOG", "INFO",  "ERROR"];分别对应不同的方法例如console.error
 * 
 *
 */


(function(root, factory) {
    root['MLogger'] = factory();
}(this, function() {

    var option = {
        'useLogLine': false,
        'logExtJs': 'js/log.min.js',
        'logExtCss': 'css/log.min.css'
    };


    //日志级别
    var LOG_LEVELS = [
        "DEBUG",
        "LOG",
        "INFO",
        "REPORT",
        "ERROR"
    ];
    window.Logger = {
        'data': {}
    };
    window.Logger.data.IS_CONSOLE_OPEN = false;
    window.Logger.data.CONSOLE_LOG_ARR = [];

    var firstLoad = true;
    var secondLoad = false;

    // 展示UI前将log信息存入内存
    var saveLog = function(log) {
        window.Logger.data.CONSOLE_LOG_ARR.push(log);
    };

    // 解析log坐在脚本与行号
    // var getConsoleLocation = function() {
    //     try {
    //         throw new Error();
    //     }catch(e){
    //         if(!e.stack) {
    //             return '';
    //         }
    //         var arr = e.stack.replace(/Error\n/).split(/\n/);
    //         arr = arr[6].replace(/^\s+|\s+$/, "").split('/');
    //         var lineArr = arr[arr.length-1].split(':');
    //         var fileArr = lineArr[0].split('.');
    //         return fileArr[0] + '.js ' + lineArr[1];
    //     }
    // };


    /**
     * 自定义日志对象
     * @type {{DELIMITER: string, _record: _record, log: log, info: info, error: error}}
     */
    var _Console = {
        _record: function(logLevel) {

            var log = {
                "level": logLevel, //日志级别
                "time": Date.now() //日志时间，时间戳
            };

            var content = []; //日志内容

            for (var i = 1; i < arguments.length; i++) {
                content.push(arguments[i]);
            }

            log["content"] = content;
            if (window.Logger.data.IS_CONSOLE_OPEN) {
                window.Logger.Console.renderLog(log, true);
            } else {
                saveLog(log);
            }

        },
        log: function() {
            Array.prototype.unshift.call(arguments, LOG_LEVELS[1]);
            _Console._record.apply(_Console, arguments);
        },
        info: function() {
            Array.prototype.unshift.call(arguments, LOG_LEVELS[2]);
            _Console._record.apply(_Console, arguments);
        },
        report: function() {
            Array.prototype.unshift.call(arguments, LOG_LEVELS[3]);
            _Console._record.apply(_Console, arguments);
        },
        error: function() {
            Array.prototype.unshift.call(arguments, LOG_LEVELS[4]);
            _Console._record.apply(_Console, arguments);
        }
    };
    var extendMyObj = function() {
        window.Logger.data.reportCount = 0;
        window.Logger.data.reportArr = [];
        window.Logger.data.cgiArr = [];
        var myopen = window.XMLHttpRequest.prototype.open;
        window.XMLHttpRequest.prototype.open = function() {
            var _arguments = arguments;
            var temp = this.onreadystatechange || function() {}; // 有的XMLHttpRequest请求没有写onreadystatechange回调
            this.start = Date.now();
            this.onreadystatechange = function(e) {

                if (e.target.readyState == 4) {

                    var obj = {
                        'url': _arguments[1],
                        'time': Date.now() - e.target.start,
                        'text': e.target.responseText, //e.target.responseText
                        'status': e.target.status,
                        'headers': e.target.getAllResponseHeaders(),
                        'params': _arguments[1]
                    };

                    delete e.target.start;
                    if (window.Logger.data.IS_CONSOLE_OPEN) {
                        var index = window.Logger.data.cgiArr.length;
                        window.Logger.data.cgiArr.push(obj);
                        window.Logger.Console.renderCgi(index);
                    } else {
                        window.Logger.data.cgiArr.push(obj);
                    }
                    
                }
                return temp.apply(this, arguments);
            };

            return myopen.apply(this, arguments);
        };

        // try{
        //     var myimage = window.Image;

        //     window.Image = function(){
        //         var image = new myimage();
        //         var image2 = new myimage();

        //         Object.defineProperty(image,'src',{
        //             set:function(newValue){
        //                 image2.src = newValue;
        //                 var arr = ['http://isdspeed.qq.com/cgi-bin/r.cgi?','http://cgi.connect.qq.com/report/report_vm?','http://xiaoqu.qq.com/cgi-bin/bar/tdw/report?','http://wspeed.qq.com/w.cgi?'];
        //                 for (var i = 0 ; i < arr.length ; i++) {
        //                     if (newValue.indexOf(arr[i]) > -1) {
        //                         reportCount++;
        //                         reportArr.push(newValue);
        //                     }
        //                 }
        //             }
        //         });

        //         return image;
        //     }
        // }catch(e){
        //     window.Image = myimage;
        // }

    };

    var _extendObj = function(obj) {
        if (typeof obj !== 'object') {
            return obj;
        }
        var source, prop;
        for (var i = 1, len = arguments.length; i < len; i++) {
            source = arguments[i];
            for (prop in source) {
                if (source.hasOwnProperty(prop)) {
                    // 不覆盖原方法执行，只是加个壳
                    (function(obj, prop) {
                        if (typeof obj[prop] === "function") {
                            var oldFun = obj[prop];
                            obj[prop] = function() {
                                source[prop].apply(source, arguments);
                                oldFun.apply(obj, arguments);
                            };
                        } else {
                            obj[prop] = source[prop];
                        }
                    })(obj, prop);
                }
            }
        }
        return obj;
    };
    
    var loadLogResource = function() {
        
        if (firstLoad) {
            firstLoad = false;
            var btnStyle = 'display: inline-block;width: 33px;height: 20px;line-height: 20px;border: 1px solid #ccc;';
            var html = "<div id='log-preload' style='position: fixed;top: 45px;left: 50%;z-index: 1209;width: 150px;height: 90px;line-height: 45px;-webkit-transform: translateX(-50%);text-align: center;background-color: #fff;box-shadow: 0 0 10px #888;' class='log-preload slideLeft'><p style='margin:0;'>启用log?</p><div><div style='"+btnStyle+"margin-right:20px;' id='yesLog'>yes</div><div style='"+btnStyle+"' id='noLog'>no</div></div></div>";
            var div = document.createElement('div');
            div.innerHTML = html;
            document.body.appendChild(div);
            document.getElementById('yesLog').addEventListener('touchstart', function() {
                document.getElementById('log-preload').innerHTML = "<div class='spinner'></div>";
                var script = document.createElement('script');
                script.src = option.logExtJs;
                window.Logger.data.LOG_CSS_URL = option.logExtCss;
                document.body.appendChild(script);
                script.onload = function() {
                    secondLoad = true;
                    window.Logger.Console.createLog();
                };
            });
            document.getElementById('noLog').addEventListener('touchstart', function() {
                document.getElementById('log-preload').style.display = 'none';
            });
        } else {
            if (secondLoad) {
                secondLoad = true;
                window.Logger.Console.createLog();
            } else {
                document.getElementById('log-preload').style.display = 'block';
            }
        }
    };


    var triggerLog = function(callback) {
        var first = {
            x: 0,
            y: document.documentElement.clientHeight
        };
        var second = {
            x: document.documentElement.clientWidth / 2,
            y: 0
        };
        var third = {
            x: document.documentElement.clientWidth,
            y: document.documentElement.clientHeight
        };
        var flag1;
        var flag2;
        var distance = 50;

        document.addEventListener('touchmove', function(e) {
            if (flag1 && Math.abs(e.targetTouches[0].clientX - second.x) < distance && Math.abs(e.targetTouches[0].clientY - second.y) < distance) {
                flag2 = true;
            }
            if (flag2 && Math.abs(e.targetTouches[0].clientX - third.x) < distance && Math.abs(e.targetTouches[0].clientY - third.y) < distance) {

                callback();
                flag1 = flag2 = false;
            }
        });
        document.addEventListener('touchend', function() {

            flag1 = flag2 = false;
        });
        document.addEventListener('touchstart', function(e) {

            flag1 = flag2 = false;
            if (Math.abs(e.targetTouches[0].clientX - first.x) < distance && Math.abs(e.targetTouches[0].clientY - first.y) < distance) {
                flag1 = true;
                e.preventDefault();
            }
        });
    };



    var init = function(opt) {
        option.logExtJs = opt.logExtJs;
        option.logExtCss = opt.logExtCss;
        option.triggerLog = opt.triggerLog || triggerLog;
        option.beforeInit = opt.beforeInit || function() {};
        option.myEvent = opt.myEvent || function() {};
        option.widgetList = opt.widgetList || ['dom', 'location', 'env', 'cgi', 'resource', 'codeEx', 'localStorage']; //'cookie',
        option.myWidget = opt.myWidget || [{
            'getHtml': function() {}
        }];
        option.myButton = opt.myButton || [{
            'getHtml': function() {}
        }];
        option.beforeInit();


        //将自定义的日志API覆盖到原生console中

        _extendObj(window.console, _Console);

        //拦截ajax
        extendMyObj();

        option.triggerLog(function() {

            loadLogResource();

        });
        window.Logger.data.LoggerOption = option;

    };
    

    return {
        'init': init
    };
}));
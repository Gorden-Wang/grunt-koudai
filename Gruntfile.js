
var path = require('path'),
    clamUtil = require('clam-util'),
    exec = require('child_process').exec;

module.exports = function (grunt) {

    var file = grunt.file;
    var task = grunt.task;
    var pathname = path.basename(__dirname);
    var source_files = clamUtil.walk('src',
        clamUtil.NORMAL_FILTERS,
        clamUtil.NORMAL_EXFILTERS);
    var all_files = (source_files.css || [])
        .concat(source_files.eot || [])
        .concat(source_files.otf || [])
        .concat(source_files.svg || [])
        .concat(source_files.ttf || [])
        .concat(source_files.woff || [])
        .concat(source_files.html || [])
        .concat(source_files.htm || [])
        .concat(source_files.js || [])
        .concat(source_files.less || [])
        .concat(source_files.css || [])
        .concat(source_files.png || [])
        .concat(source_files.gif || [])
        .concat(source_files.jpg || [])
        .concat(source_files.scss || [])
        .concat(source_files.php || [])
        .concat(source_files.swf || []);

    all_files = all_files.concat('!**/*/build/**');

    var relative = '';
    var base = 'http://s.youshop.com';
    var pkg = grunt.file.readJSON('abc.json');
    var daily = true;//是否解析css中的image
    var version = pkg.version;
    if (pkg.env === 'daily') base = 'http://s.test.youshop.com';
    relative = [base, "ushop" + '/'].join('/');

    // -------------------------------------------------------------
    // 任务配置
    // -------------------------------------------------------------

    // 如果 Gruntfile.js 编码为 gbk，打开此注释
    // grunt.file.defaultEncoding = 'gbk';
    grunt.initConfig({

        // 从 abc.json 中读取配置项
        pkg: grunt.file.readJSON('abc.json'),

        // 配置默认分支
        currentBranch: 'master',

        // 对build目录进行清理
        clean: {
            mods: {
                src: 'src/mods.js'
            },
            sass: {
                src: 'build/**/*.scss'
            },
            build: {
                src: ['build/**/*','!build/**/.svn'],
                filter: 'isFile'
            }
        },

        template: {
            //本地
            server: {
                options:{
                    data:{
                        version:'?vdev=<%= pkg.version %>',
                        original_version: '<%= pkg.version %>',
                        staticBase:daily?relative.substring(0,relative.length-1):"",

                        baseUrl : 'http://wd.test.youshop.com/vshop/1/H5',
                        h5Port : 'http://wd.test.youshop.com/vshop/1/H5',
                        pubPort : 'http://wd.test.youshop.com/vshop/1/public',
                        pubPort2 : 'http://wd.test.youshop.com/ushop',

                    }
                },
                files:[
                    {
                        expand:true,
                        src:['build/**/*.js','!build/lib/juicer.js'],
                        dest:''
                    },
                    {
                        expand:true,
                        src:['build/**/*.html'],
                        dest:''
                    },
                    {
                        expand:true,
                        src:['build/**/*.css'],
                        dest:''
                    }
                ]
            },
            //测试
            test:{
                options:{
                    data:{
                        version:'?vdev=<%= pkg.version %>',
                        original_version: '<%= pkg.version %>',
                        staticBase:"../../",

                        baseUrl : 'http://wd.test.youshop.com/vshop/1/H5',
                        h5Port : 'http://wd.test.youshop.com/vshop/1/H5',
                        pubPort : 'http://wd.test.youshop.com/vshop/1/public',
                        pubPort2 : 'http://wd.test.youshop.com/ushop'
                    }
                },
                files:[
                    {
                        expand:true,
                        src:['build/**/*.js','!build/lib/juicer.js'],
                        dest:''
                    },
                    {
                        expand:true,
                        src:['build/**/*.html'],
                        dest:''
                    },
                    {
                        expand:true,
                        src:['build/**/*.css'],
                        dest:''
                    }
                ]
            },
            //发布
            product:{
                options:{
                    data:{
                        version:'?vdev=<%= pkg.version %>',
                        original_version: '<%= pkg.version %>',
                        staticBase:daily?relative.substring(0,relative.length-1):"",

                        baseUrl : 'http://wd.youshop.com/vshop/1/H5',
                        h5Port : 'http://wd.youshop.com/vshop/1/H5',
                        pubPort : 'http://wd.youshop.com/vshop/1/public',
                        pubPort2 : 'http://wd.youshop.com/ushop',
                    }
                },
                files:[
                    {
                        expand:true,
                        src:['build/**/*.js','!build/lib/juicer.js'],
                        dest:''
                    },
                    {
                        expand:true,
                        src:['build/**/*.css'],
                        dest:''
                    }
                ]
            }
        },
        kmc: {
            options: {
                depFilePath: 'build/mods.js',
                comboOnly: true,
                fixModuleName: true,
                comboMap: true,
                packages: [
                    {
                        ignorePackageNameInUri: true,
                        name: '<%= pkg.name %>',
                        path: '../',
                        charset: 'utf-8'
                    }
                ],
                //map: [['<%= pkg.name %>/src/', '<%= pkg.name %>/']]
                map: [
                    ['<%= pkg.name %>/build/', '<%= pkg.name %>/']
                ]
            },
            main: {
                files: [
                    {
                        expand: true,
                        //cwd: 'src/',
                        cwd: 'build/',
                        src: source_files.js,
                        //dest: 'build/'
                        dest: 'src/'
                    }
                ]
            }
            // 若有新任务，请自行添加
            /*
             "simple-example": {
             files: [
             {
             src: "a.js",
             dest: "build/index.js"
             }
             ]
             }
             */
        },

        // 将css文件中引用的本地图片上传CDN并替换url，默认不开启
        mytps: {
            options: {
                argv: "--inplace"
            },
            expand: true,
            cwd: 'src',
            all: source_files.css
        },

        // 静态合并HTML和抽取JS/CSS，解析juicer语法到vm/php
        // https://npmjs.org/package/grunt-combohtml
        combohtml: {
            options: {
                encoding: 'utf8',
                replacement: {
                    from: /src\//,
                    to: 'build/'
                },
                // 本地文件引用替换为线上地址
                relative: 'http://g.tbcdn.cn/<%= pkg.group %>/<%= pkg.name %>/<%= pkg.version %>/',
                tidy: false,  // 是否重新格式化HTML
                comboJS: false, // 是否静态合并当前页面引用的本地js
                comboCSS: false, // 是否静态合并当前页面引用的css
                convert2vm: false,// 是否将juicer语法块转换为vm格式
                convert2php: false // 是否将juicer语法块转换为php格式
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build',
                        // 对'*.php'文件进行HTML合并解析
                        src: ['**/*.php'],
                        dest: 'build/'
                    }

                ]
            }
        },

        relativeurl: {
            options: {
                encoding: 'utf8',
                replacement: {
                    from: /src\//,
                    to: 'build/'
                },
                relative: relative,
                combo: false
            },

            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build',
                        // 对'*.htm'文件进行HTML合并解析
                        src: ['**/*.html'],
                        dest: 'build/',
                        ext: '.html'
                    }
                ]
            }
        },


        // FlexCombo服务配置
        // https://npmjs.org/package/grunt-flexcombo
        //
        // 注意：urls 字段末尾不能有'/'
        flexcombo: {
            // 源码调试服务
            server: {
                options: {
                    proxyport: '<%= pkg.proxyPort %>',
                    target: 'src/',
                    urls: '/<%= pkg.group %>/<%= pkg.name %>',
                    port: '<%= pkg.port %>',
                    proxyHosts: ['demo', 'wd.youshop.com'],
                    servlet: '?',
                    separator: ',',
                    charset: 'utf8'
                }
            }
        },

        less: {
            options: {
                paths: './'
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.less'],
                        dest: 'build/',
                        ext: '.less.css'
                    }
                ]
            }
        },

        sass: {
            src: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.scss'],
                        dest: 'src/',
                        ext: '.css'
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.scss'],
                        dest: 'build/',
                        ext: '.scss.css'
                    }
                ]
            }
        },

        // 压缩JS https://github.com/gruntjs/grunt-contrib-uglify
        uglify: {
            options: {
                banner: '/*! Generated by Clam: <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n',
                beautify: {
                    ascii_only: true
                }
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.js', '!**/*-min.js'],
                        dest: 'build/',
                        // ext: '-min.js'
                        ext: '.js'
                    }
                ]
            }
        },

        // 压缩CSS https://github.com/gruntjs/grunt-contrib-cssmin
        cssmin: {
            scss: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.scss.css', '!**/*.scss-min.css'],
                        dest: 'build/',
                        ext: '.scss-min.css'
                    }
                ]
            },
            less: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.less.css', '!**/*.less-min.css'],
                        dest: 'build/',
                        ext: '.less-min.css'
                    }
                ]
            },
            main: {
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        src: ['**/*.css', '!**/*-min.css', '!**/*.less.css', '!**/*.scss.css'],
                        dest: 'build/',
                        ext: '.css'
                        //ext: '.css'
                    }
                ]
            }
        },

        // 监听JS、CSS、LESS文件的修改
        watch: {
            'style': {
                files: ['src/**/*.scss'],
                tasks: ['newer:sass:src']
            },

            'all': {
                files: ['src/**/*.js',
                    'src/**/*.css',
                    'src/**/*.less',
                    'src/**/*.php',
                    'src/**/*.html',
                    'src/**/*.htm',
                    'src/**/*.scss'],
                //files: [],
                tasks: [ 'build' ]
            },
            'daily':{
                files: ['src/**/*.js',
                    'src/**/*.css',
                    'src/**/*.less',
                    'src/**/*.php',
                    'src/**/*.html',
                    'src/**/*.htm',
                    'src/**/*.scss'],
                //files: [],
                tasks: [ 'daily' ]
            }
        },

        // 发布命令
        exec: {
            tag: {
                command: 'git tag publish/<%= currentBranch %>'
            },
            publish: {
                command: 'git push origin publish/<%= currentBranch %>:publish/<%= currentBranch %>'
            },
            commit: {
                command: function (msg) {
                    console.log(grunt.config.get('currentBranch'))
                    var command = 'git commit -m "' + grunt.config.get('currentBranch') + ' - ' + grunt.template.today("yyyy-mm-dd HH:MM:ss") + ' ' + msg + '"';
                    return command;
                }
            },
            mastercommit: {
                command: function (msg) {

                    var command = 'git commit -m "' +'' + ' - ' + grunt.template.today("yyyy-mm-dd HH:MM:ss") + ' ' + msg + '"';
                    return command;
                }
            },
            push:{
                command :'git push origin master'
            },
            add: {
                command: 'git add .'
            },
            prepub: {
                command: 'git push origin daily/<%= currentBranch %>:daily/<%= currentBranch %>'
            },
            grunt_publish: {
                command: 'grunt default:publish'
            },
            grunt_prepub: {
                command: function (msg) {
                    return 'grunt default:prepub:' + msg;
                }
            },
            new_branch: {
                command: 'git checkout -b daily/<%= currentBranch %>'
            },
            master : {
                command : 'git checkout master'
            },

            merge : {
                command : 'git merge daily/<%= currentBranch %>'
            },
            deletebranch : {
                command : 'git push origin --delete  daily/<%= currentBranch %> '
            },
            daily : {
                command : 'grunt daily'
            }


            // task.run(['exec:tag', 'exec:publish','exec:master','exec:merge','exec:add','exec:commit:merge','exec:deletebranch']);

        },

        // 拷贝文件
        copy: {
            mods: {
                files: [
                    {
                        expand: true,
                        src: 'mods.js',
                        dest: 'src/',
                        cwd: 'build/',
                        filter: 'isFile'
                    }
                ]
            },
            main: {
                files: [
                    {
                        expand: true,
                        src: all_files,
                        dest: 'build/',
                        cwd: 'src/',
                        filter: 'isFile'
                    }
                ]
            }
        },
        // 替换config中的版本号@@version
        replace: {
            dist: {
                options: {
                    variables: {
                        'version': '<%= pkg.version %>'
                    },
                    prefix: '@@'
                },
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        dest: 'build/',
                        src: ['**/*']
                    }
                ]
            },
            script: {
                options: {
                    patterns: [
                        {
                            match: /<script[^>]+?src="([^"]+)"><\/script>/igm,
                            replacement: function(tag){
                                var tt = tag.match(/<script[^>]+?src="([^"]+)"><\/script>/)[1];
                                return '<script src="'+tt+'?version='+version+'"></script>'
                            }
                        }
                    ]
                },
                files: [
                    {
                        expand: true,
                        cwd: 'build/',
                        dest: 'build/',
                        src: ['**/*.html']
                    }
                ]
            },
            css :{
                //<link[^>]+?href="([^"]+?)"[^>]*\/
                options: {
                    patterns: [
                        {
                            match: /<link[^>]+?href="([^"]+?)"[^>]*\/\s*>/gi,
                            //'<link href="$1?version='+version+'" type="text/css" rel="stylesheet"/>'
                            replacement: function(tag){
                                console.log(tag)
                                var tt = tag.match(/<link[^>]+?href="([^"]+?)"[^>]*\/\s*>/)[1];
                                return '<link href="'+tt+'?version='+version+'" type="text/css" rel="stylesheet"/>'
                                //return 123;
                            }

                        }
                    ]
                },
                files: [
                    {
                        expand: true,
                        //flatten : true,
                        cwd: 'build/',
                        dest: 'build/',
                        src: ['**/*.html']
                    }
                ]
            },
            img:{
                options: {
                    patterns: [
                        {
                            match: /url\s*\(["{0,1}](\S*)\s*["{0,1}]\)/gi,
                            //'<link href="$1?version='+version+'" type="text/css" rel="stylesheet"/>'
                            replacement: function(tag){
                                console.log(tag)
                                var tt = tag.match(/url\s*\(["{0,1}](\S*)\s*["{0,1}]\)/)[1];
                                return tt.replace('../',relative);
                                //return 123;
                            }

                        }
                    ]
                },
                files: [
                    {
                        expand: true,
                        //flatten : true,
                        cwd: 'build/',
                        dest: 'build/',
                        src: ['**/*.css']
                    }
                ]
            }

        },
        prompt: {
            grunt_default: {
                options: {
                    questions: [
                        {
                            config: 'grunt_default',
                            type: 'list',
                            message: '是否对JS和CSS进行Combo?',
                            default: base.valueOf(),
                            choices: [
                                {
                                    value: 'yes',
                                    name: '合并JS和CSS'
                                },
                                {
                                    value: 'no',
                                    name: '不合并JS和CSS'
                                }
                            ]
                        }
                    ]
                }
            },
            uglify: {
                options: {
                    questions: [
                        {
                            config: 'grunt_uglify',
                            type: 'list',
                            message: '是否对静态资源进行压缩?',
                            default: "no",
                            choices: [
                                {
                                    value: 'yes',
                                    name: '压缩JS和CSS'
                                },
                                {
                                    value: 'no',
                                    name: '不压缩JS和CSS'
                                }
                            ]
                        }
                    ]
                }
            }
        }



    });

    // -------------------------------------------------------------
    // 载入模块
    // -------------------------------------------------------------

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mytps');
    grunt.loadNpmTasks('grunt-flexcombo');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-combohtml');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-prompt');
    grunt.loadNpmTasks('grunt-template');

    grunt.loadNpmTasks('grunt-relativeurl');


    // 根据需要打开这些配置
    //grunt.loadNpmTasks('grunt-kissy-template');
    //grunt.loadNpmTasks('grunt-contrib-connect');
    //grunt.loadNpmTasks('grunt-contrib-concat');

    // -------------------------------------------------------------
    // 注册Grunt子命令
    // -------------------------------------------------------------


    /**
     * 启动Demo调试时的本地服务
     */
    grunt.registerTask('server', '开启Demo调试模式', function () {
        task.run(['flexcombo:server', 'watch:style']);
    });

    // 默认构建任务
    grunt.registerTask('exec_build', '默认构建任务', function () {

        base = grunt.config('grunt_default') || base;



        console.log("======" + base);
        var action =
            ['clean:build',
                'clean:mods',
                'copy:main',
                'sass',
                'copy:mods'
            ];



        if(base == "yes"){
            action.push("relativeurl");
        }

//        action.push('replace');
        action.push("clean:sass");

        var uglify = grunt.config('grunt_uglify') || 'no';

        if (uglify == "yes") {

            action.push("uglify");
            action.push("cssmin");
        }


        if(pkg.env == "daily"){
            action.push("template:server");
        }else{
            action.push("template:product");
        }
        action.push("replace:css");
        action.push("replace:script");
        task.run(action);

    });


    // 默认构建任务
    grunt.registerTask('build', ['prompt:grunt_default','prompt:uglify', 'exec_build']);

    grunt.registerTask('daily', 'daily调试', function () {
        daily = false;
        var action =
            ['clean:build',
                'clean:mods',
                'copy:main',
                'sass',
                'copy:mods'
            ];

        action.push("relativeurl");
        action.push("clean:sass");



        action.push("template:server");
        action.push("replace:css");
        action.push("replace:script");
        task.run(action);
    });




    grunt.registerTask('svninit', '初始化svn', function (type, msg) {
        var done = this.async();
        var username = pkg.author.name;
        var password = pkg.author.password;
        var remote = pkg.repository.url;

        exec('svn checkout ' + remote + " --username=" + username + " --password=" + password, function (err, stdout, stderr, cb) {
            grunt.log.write(("初始化成功,更新版本号为" + stdout.replace(/\D/g, "")).red);
            done();
        });
    });

    grunt.registerTask('newbranch', '创建新的分支', function(type, msg) {
        var done = this.async();
        exec('git branch -a & git tag', function(err, stdout, stderr, cb) {
            var r = clamUtil.getBiggestVersion(stdout.match(/\d+\.\d+\.\d+/ig));
            if(!r){
                r = '0.1.0';
            } else {
                r[2]++;
                r = r.join('.');
            }
            grunt.log.write(('新分支：daily/' + r).green);


            console.log(r);
            grunt.config.set('currentBranch', r);
            console.log(r);
            task.run(['exec:new_branch']);
            // 回写入 abc.json 的 version
            try {
                abcJSON = require(path.resolve(process.cwd(), 'abc.json'));
                abcJSON.version = r;
                clamUtil.fs.writeJSONFile("abc.json", abcJSON, function(err){
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("update abc.json.");
                    }
                });
            } catch (e){
                console.log('未找到abc.json');
            }
            done();
        });
    });


    grunt.registerTask('prepub', '提交代码仓库', function( msg) {
        task.run('exec:grunt_prepub:' + (msg || ''));
    });
    grunt.registerTask('prepub', '提交代码仓库', function( msg) {
        task.run('exec:grunt_prepub:' + (msg || ''));
    });

    /*
     * 获取当前最大版本号，并创建新分支
     **/
    grunt.registerTask('newbranch', '创建新的分支', function(type, msg) {
        var done = this.async();
        exec('git branch -a & git tag', function(err, stdout, stderr, cb) {
            var r = clamUtil.getBiggestVersion(stdout.match(/\d+\.\d+\.\d+/ig));
            if(!r){
                r = '0.1.0';
            } else {
                r[2]++;
                r = r.join('.');
            }
            grunt.log.write(('新分支：daily/' + r).green);
            grunt.config.set('currentBranch', r);
            task.run(['exec:new_branch']);
            // 回写入 abc.json 的 version
            try {
                abcJSON = require(path.resolve(process.cwd(), 'abc.json'));
                abcJSON.version = r;
                clamUtil.fs.writeJSONFile("abc.json", abcJSON, function(err){
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("update abc.json.");
                    }
                });
            } catch (e){
                console.log('未找到abc.json');
            }
            done();
        });
    });

    /**
     * 正式发布
     */
    grunt.registerTask('publish', 'clam 正式发布', function() {
        task.run('exec:grunt_publish');
    });
    grunt.registerTask('pub', 'clam 正式发布', function() {
        task.run('exec:grunt_publish');
    });

    /**
     * 预发布
     */
    grunt.registerTask('prepub', 'clam pre publish...', function(msg) {
        task.run('exec:grunt_prepub:' + (msg || ''));
    });




    // -------------------------------------------------------------
    // 注册Grunt主流程
    // -------------------------------------------------------------

    return grunt.registerTask('default', 'Clam 默认流程', function (type, msg) {

        var done = this.async();

        // 获取当前分支asdf
        exec('git branch', function (err, stdout, stderr, cb) {

            var reg = /\*\s+daily\/(\S+)/,
                match = stdout.match(reg);

            if (!match) {
                grunt.log.error('当前分支为 master 或者名字不合法(daily/x.y.z)，请切换到daily分支'.red);
                grunt.log.error('创建新daily分支：grunt newbranch'.yellow);
                grunt.log.error('只执行构建：grunt build'.yellow);
                return;
            }
            grunt.log.write(('当前分支：' + match[1]).green);
            grunt.config.set('currentBranch', match[1]);
            done();
        });

        // 构建和发布任务
        if (!type) {
            task.run(['build']);
        } else if ('publish' === type || 'pub' === type) {
            task.run(['exec:tag', 'exec:publish','exec:master','exec:merge','exec:push','exec:deletebranch']);
        } else if ('prepub' === type) {
            task.run(['exec:add', 'exec:commit:' + msg]);
            task.run(['exec:prepub']);
        }

    });

};

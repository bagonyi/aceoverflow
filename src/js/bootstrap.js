;(function () {
    'use strict';

    var injectScripts = function inject (scripts) {
        var s = document.createElement('script');
        s.src = chrome.extension.getURL(scripts[0]);
        s.onload = function () {
            this.parentNode.removeChild(this);
            if (scripts.length > 1) {
                inject(scripts.slice(1));
            }
        };
        (document.head || document.documentElement).appendChild(s);
    };

    injectScripts([
        'vendor/ace/ace.js',
        'vendor/ace/theme-textmate.js',
        'vendor/ace/mode-markdown.js',
        'vendor/jquery-textrange.js',
        'js/linked-editor.js',
        'js/main.js'
    ]);
}());
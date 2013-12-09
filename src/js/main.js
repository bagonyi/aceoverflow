;(function ($, LinkedEditor) {
    'use strict';

    $('textarea.wmd-input.processed').each(function () {
        var linkedEditor = new LinkedEditor($(this), {
            mode: 'markdown',
            theme: 'textmate'
        });
    });
}(window.jQuery, window.LinkedEditor));
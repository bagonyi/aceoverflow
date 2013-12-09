;(function (global, $) {
    'use strict';

    var LinkedEditor = function ($textarea, options) {
        var config = $.extend(true, {
                theme: 'textmate',
                mode: 'markdown'
            }, options),

            $editDiv = $('<div/>', {
                    width: $textarea.width(),
                    height: $textarea.height(),
                    css: {
                        margin: '8px 0 0 0'
                    }
                }).insertAfter($textarea),

            editor = ace.edit($editDiv[0]);

        $textarea.css({
            width: '1px',
            height: '1px',
            padding: 0,
            margin: 0,
            display: 'none'
        });

        editor.getSession().setUseSoftTabs(true);
        editor.getSession().setMode('ace/mode/' + config.mode);
        editor.setTheme('ace/theme/' + config.theme);
        editor.getSession().setValue($textarea.val());

        this.$textarea = $textarea;
        this.editor = editor;
        this.$editDiv = $editDiv;

        window.editor = editor;

        this.setupListeners();
    };

    LinkedEditor.prototype.setupListeners = function () {
        var _this = this,
            $textarea = this.$textarea,
            editor = this.editor,
            $editDiv = this.$editDiv,
            $container = $textarea.parent(),
            $buttonRow = $container.find('.wmd-button-row'),
            $grippie = $container.find('.grippie'),
            keyCommands = {
                bold:    'Ctrl-b',
                italic:  'Ctrl-i',
                link:    'Ctrl-l',
                quote:   'Ctrl-q',
                code:    'Ctrl-k',
                image:   'Ctrl-g',
                olist:   'Ctrl-o',
                ulist:   'Ctrl-u',
                heading: 'Ctrl-h',
                hr:      'Ctrl-r',
                undo:    'Ctrl-z',
                redo:    'Ctrl-Shift-z'
            },

            resizeListener = function (e) {
                var height = e.data.originalHeight + (e.clientY - e.data.draggedAt);

                if (height > 64) {
                    $editDiv.height(height);
                }
            },

            undoButton = (function () {
                var $undoButton,
                    enabled = false;

                $buttonRow.find('#wmd-undo-button').replaceWith(
                    '<li class="wmd-button" id="wmd-undo-button" title="Undo - Ctrl+Z" style="left: 325px;">' +
                        '<span style="background-position: -200px -20px;"></span>' +
                    '</li>'
                );

                $undoButton = $buttonRow.find('#wmd-undo-button');

                $undoButton.on('mouseover', function () {
                    if (enabled) {
                        $(this).find('span').css('background-position', '-200px -40px');
                    }
                });

                $undoButton.on('mouseout', function () {
                    if (enabled) {
                        $(this).find('span').css('background-position', '-200px 0');
                    } else {
                        $(this).find('span').css('background-position', '-200px -20px');
                    }
                });

                $undoButton.on('click', function () {
                    if (enabled) {
                        editor.focus();
                        editor.undo();
                    }
                });

                return {
                    enable: function () {
                        enabled = true;
                        $buttonRow.find('#wmd-undo-button span').css('background-position', '-200px 0');
                    },

                    disable: function () {
                        enabled = false;
                        $buttonRow.find('#wmd-undo-button span').css('background-position', '-200px -20px');
                    }
                };
            }()),

            redoButton = (function () {
                var $redoButton,
                    enabled = false;

                $buttonRow.find('#wmd-redo-button').replaceWith(
                    '<li class="wmd-button" id="wmd-redo-button" title="Redo - Ctrl+Shift+Z" style="left: 350px;">' +
                        '<span style="background-position: -220px -20px;"></span>' +
                    '</li>'
                );

                $redoButton = $buttonRow.find('#wmd-redo-button');

                $redoButton.on('mouseover', function () {
                    if (enabled) {
                        $(this).find('span').css('background-position', '-220px -40px');
                    }
                });

                $redoButton.on('mouseout', function () {
                    if (enabled) {
                        $(this).find('span').css('background-position', '-220px 0');
                    } else {
                        $(this).find('span').css('background-position', '-220px -20px');
                    }
                });

                $redoButton.on('click', function () {
                    if (enabled) {
                        editor.focus();
                        editor.redo();
                    }
                });

                return {
                    enable: function () {
                        enabled = true;
                        $buttonRow.find('#wmd-redo-button span').css('background-position', '-220px 0');
                    },

                    disable: function () {
                        enabled = false;
                        $buttonRow.find('#wmd-redo-button span').css('background-position', '-220px -20px');
                    }
                };
            }()),

            updateUndoRedoButtonState = function () {
                var t;

                global.clearTimeout(t);

                t = global.setTimeout(function () {
                    if (editor.getSession().getUndoManager().hasUndo()) {
                        undoButton.enable();
                    } else {
                        undoButton.disable();
                    }

                    if (editor.getSession().getUndoManager().hasRedo()) {
                        redoButton.enable();
                    } else {
                        redoButton.disable();
                    }
                }, 100);
            };

        // On editor change update textarea value
        editor.getSession().on('change', function () {
            $textarea.val(editor.getSession().getValue());
            $textarea.trigger('paste');
            updateUndoRedoButtonState();
        });

        // On textarea input update editor value
        $textarea.on('keypress', function () {
            editor.getSession().setValue($textarea.val());
        });

        // Update text from textarea on image upload dialog close
        $(document).on('submit', '#image-upload #upload-form', function () {
            var originalCloseDialog = window.closeDialog;

            window.closeDialog = function (url) {
                originalCloseDialog(url);

                setTimeout(function () {
                    _this.copyTextareaSelectionToEditor();
                }, 100);
            };

            setTimeout(function () {
                _this.copyTextareaSelectionToEditor();
            }, 0);
        });

        // Update text from textarea on url dialog form submit (eg. close)
        $(document).on('submit', '.wmd-prompt-dialog form', function () {
            setTimeout(function () {
                _this.copyTextareaSelectionToEditor();
            }, 0);
        });
        // Clicking OK in url dialog not firing form submit event, so listen to OK's mouseup...
        $(document).on('mouseup', '.wmd-prompt-dialog form :button:first', function () {
            setTimeout(function () {
                _this.copyTextareaSelectionToEditor();
            }, 0);
        });

        // Proxy key commands from editor to textarea
        _this.setupEditorKeyCommands(keyCommands);

        // Disable button bar buttons default behaviour and replace with
        // manually triggered key commands.
        $buttonRow.find('.wmd-button:not(#wmd-help-button)').each(function () {
            this.onclick = null;
        });

        $buttonRow.find('.#wmd-help-button').on('mouseup', function () {
            $textarea.show();
        });

        $buttonRow.on('click', '.wmd-button:not(#wmd-undo-button, #wmd-redo-button)', function (e) {
            var commandName = this.id.match(/wmd-(.+)-button/)[1];

            _this.copyEditorSelectionToTextarea();

            if (commandName in keyCommands) {
                _this.triggerKeydownEvent($textarea, keyCommands[commandName])
            }

            _this.copyTextareaSelectionToEditor();
        });

        $textarea.closest('form').on('submit', function () {
            $textarea.val(editor.getSession().getValue());
        });

        if ($grippie.length > 0) {
            $grippie.off('mousedown');

            $grippie.on('mousedown', function (e) {
                $editDiv.css('opacity', 0.25);

                $('body').on(
                    'mousemove',
                    {
                        draggedAt: e.clientY,
                        originalHeight: $editDiv.height()
                    },
                    resizeListener
                );
            });

            $grippie.on('mouseup', function () {
                editor.resize();
                $editDiv.css('opacity', 1);
                editor.focus();
                $('body').off('mousemove', resizeListener);
            });
        }
    };

    LinkedEditor.prototype.createSelectionFromRange = function () {
        var session = this.editor.getSession(),
            numberOfLines = session.getLength(),
            i,
            count = 0,
            start,
            end,
            newLineCharacterLength = session.getDocument().getNewLineCharacter().length,
            text = session.getLines(0, numberOfLines),
            range = session.selection.getRange();

        for (i = 0; i <= range.start.row; i++) {
            count += text[i].length + newLineCharacterLength;
        }

        start = count - (text[range.start.row].length - range.start.column) - newLineCharacterLength;

        for (i = range.start.row + 1; i <= range.end.row; i++) {
            count += text[i].length + newLineCharacterLength;
        }

        end = count - (text[range.end.row].length - range.end.column) - newLineCharacterLength;

        return {
            start: start,
            end: end
        };
    };

    LinkedEditor.prototype.createRangeFromSelection = function (start, end) {
        var editor = this.editor,
            session = editor.getSession(),
            numberOfLines = session.getLength(),
            i,
            count = 0,
            newLineCharacterLength = session.getDocument().getNewLineCharacter().length,
            text = session.getLines(0, numberOfLines),
            range = session.selection.getRange();

        for (i = 0; i < numberOfLines; i++) {
            count += text[i].length + newLineCharacterLength;
            if (count > start) {
                break;
            }
        }

        range.start = {
            row: i,
            column: (text[i].length + newLineCharacterLength) - (count - start)
        };

        if (count < end) {
            for (i = range.start.row + 1; i < numberOfLines; i++) {
                count += text[i].length + newLineCharacterLength;

                if (count >= end) {
                    break;
                }
            }
        }

        range.end = {
            row: i,
            column: (text[i].length + newLineCharacterLength) - (count - end)
        };

        return range;
    };

    LinkedEditor.prototype.triggerKeydownEvent = function (element, keyCombination) {
        var eventObj = document.createEventObject ? document.createEventObject() : document.createEvent("Events"),
            ctrl = /[Cc]trl/.test(keyCombination),
            shift = /[Ss]hift/.test(keyCombination),
            keyCode = keyCombination.match(/.$/)[0].charCodeAt(0);

        if (element instanceof $) {
            element = element.get(0);
        }

        if (eventObj.initEvent) {
            eventObj.initEvent("keydown", true, true);
        }

        eventObj.keyCode = keyCode;
        eventObj.which = keyCode;
        eventObj.ctrlKey = ctrl;
        eventObj.shiftKey = shift;

        element.dispatchEvent ? element.dispatchEvent(eventObj) : element.fireEvent("onkeydown", eventObj);
    };

    LinkedEditor.prototype.copyEditorSelectionToTextarea = function () {
        var selection = this.createSelectionFromRange();

        this.$textarea
            .show()
            .focus()
            .textrange('set', selection.start, selection.end - selection.start);
    };

    LinkedEditor.prototype.copyTextareaSelectionToEditor = function () {
        var $textarea = this.$textarea,
            editor = this.editor,
            textareaRange = $textarea.textrange('get');

        editor.getSession().setValue($textarea.val());
        editor.getSelection().setSelectionRange(
            this.createRangeFromSelection(textareaRange.start, textareaRange.end)
        );

        editor.focus();
        $textarea.hide();
    };

    LinkedEditor.prototype.setupEditorKeyCommands = function (keyCombinations) {
        var _this = this,
            editor = this.editor,
            $textarea = this.$textarea;

        for (var i in keyCombinations) {
            if (keyCombinations.hasOwnProperty(i)) {
                (function (i) {
                    editor.commands.addCommand({
                        name: keyCombinations[i],
                        bindKey: {
                            win: keyCombinations[i],
                            mac: keyCombinations[i]
                        },
                        exec: function () {
                            if (i === 'undo') {
                                editor.undo();
                            } else if (i === 'redo') {
                                editor.redo();
                            } else {
                                _this.copyEditorSelectionToTextarea();
                                _this.triggerKeydownEvent($textarea.get(0), keyCombinations[i]);
                                _this.copyTextareaSelectionToEditor();
                            }
                        }
                    });
                }(i));
            }
        }
    };

    global.LinkedEditor = LinkedEditor;
}(window, window.jQuery));
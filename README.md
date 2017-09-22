### About

Ace Overflow is a Google Chrome extension that replaces WMD Editor with on all Stack Exchange sites.
The reason I created it because I found it hard to write quick answers that included some code without copy pasting between the editor and an IDE.
The way it works is kinda.. tricky. As Ace does not support converting a textarea into an editor I had to
create a link between the two. WMD textarea is still on the page, but hidden, everything is proxied into it.

### Change tab size

Focus the editor and hit Ctrl+Alt+t. Enter the desired tab size in the prompt dialog. (Settings are remembered in local storage for now, so you will need to configure it for each individual site).

### License

MIT

### Install

Download the crx and drop it onto the `chrome://extensions/` page. You need to be logged in to see the Ace editor.

**Please note that the extension is at an early stage, thus might have (it has -> undo / redo) some bugs. If you are writing a lengthy answer make sure to save it to the clipboard first! I am not responsible for lost questions / answers.**

### Platform

Google Chrome

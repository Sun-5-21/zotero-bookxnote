# Zotero × BookxNote Pro

让 Zotero 文献可以直接使用 **BookxNote Pro** 打开，并提供一个 AutoHotkey v2 脚本，解决从 BookxNote Pro/PDF 复制文字时行内换行过多的问题。

> 本项目为第三方开源工具，与 Zotero、BookxNote Pro 官方无隶属关系。

## 功能

### Zotero 插件

- 选中 Zotero 中的 PDF 附件，右键选择 **使用 BookxNote Pro 打开**。
- 选中包含 PDF 附件的文献条目，也可以直接打开其 PDF。
- 首次使用时自动查找 `BookxNotePro.exe`；找不到时会弹出文件选择窗口。
- 可通过 **工具 → 设置 BookxNote Pro 路径…** 重新指定程序路径。
- 当前测试目标：Zotero 9.0.x、Windows、BookxNote Pro。

### AutoHotkey 剪贴板清理脚本

`scripts/bookxnote-clipboard-cleaner.ahk` 会在 BookxNote Pro 为当前窗口时监听剪贴板：

- 将 PDF 排版产生的普通换行替换为空格；
- 保留真正的段落空行；
- 兼容 `CRLF`、`CR`、`LF`、Unicode 行分隔符；
- 清理多余连续空格；
- 仅处理 BookxNote Pro 中复制出的文本，不影响其他软件。

## 安装 Zotero 插件

1. 下载 Release 中的 `bookxnote-zotero-opener.xpi`。
2. 打开 Zotero。
3. 进入 **工具 → 插件**。
4. 点击右上角齿轮，选择 **从文件安装插件**；也可以将 `.xpi` 拖入插件窗口。
5. 安装后，在文献或 PDF 附件上点击右键，选择 **使用 BookxNote Pro 打开**。

首次使用若没有自动找到程序，请选择 BookxNote Pro 的可执行文件，例如：

```text
C:\Program Files\BookxNote Pro\BookxNotePro.exe
```

实际路径以你的安装位置为准。

## 使用 AutoHotkey 脚本

该脚本使用 **AutoHotkey v2** 语法。

1. 安装 AutoHotkey v2。
2. 下载 `scripts/bookxnote-clipboard-cleaner.ahk`。
3. 双击运行脚本。
4. 在 BookxNote Pro 中复制 PDF 文本，剪贴板中的普通换行会自动合并为空格。

需要开机自动运行时，可按 `Win + R`，输入：

```text
shell:startup
```

然后将脚本或脚本快捷方式放入打开的启动文件夹。

## 从源码构建 XPI

### Windows PowerShell

```powershell
./build.ps1
```

### Linux / macOS / Git Bash

```bash
./build.sh
```

生成文件位于：

```text
dist/bookxnote-zotero-opener.xpi
```

XPI 本质上是 ZIP 文件，但 `manifest.json`、`bootstrap.js` 和 `bookxnote.js` 必须直接位于压缩包根目录。

## 目录结构

```text
.
├── plugin/
│   ├── manifest.json
│   ├── bootstrap.js
│   └── bookxnote.js
├── scripts/
│   └── bookxnote-clipboard-cleaner.ahk
├── dist/
│   └── bookxnote-zotero-opener.xpi
├── .github/workflows/release.yml
├── updates.json
├── build.ps1
├── build.sh
└── README.md
```

## 常见问题

### Zotero 提示插件可能不兼容

在 Zotero 9.0.6 中，`manifest.json` 的 `applications.zotero` 需要包含有效的 `update_url`。本仓库已经提供 `updates.json` 并在插件清单中引用它。

### 右键菜单没有出现

请确认选中的是：

- PDF 附件；或
- 至少包含一个 PDF 附件的普通文献条目。

### BookxNote Pro 没有启动

进入 **工具 → 设置 BookxNote Pro 路径…**，重新选择 `BookxNotePro.exe`。

### 脚本运行时报语法错误

请确认安装的是 AutoHotkey v2，而不是 v1。

## 许可证

本项目采用 [MIT License](LICENSE)。

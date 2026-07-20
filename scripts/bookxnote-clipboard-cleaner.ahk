#Requires AutoHotkey v2.0
#SingleInstance Force
Persistent

; 监听剪贴板变化
OnClipboardChange(FixBookxNoteText)

FixBookxNoteText(DataType)
{
    ; 只处理文本
    if DataType != 1
        return

    ; 只在 BookxNote Pro 是当前窗口时处理
    if !WinActive("ahk_exe BookxNotePro.exe")
        return

    text := A_Clipboard

    if text = ""
        return

    ; 兼容各种换行符
    text := StrReplace(text, "`r`n", "`n")
    text := StrReplace(text, "`r", "`n")
    text := StrReplace(text, Chr(0x2028), "`n")
    text := StrReplace(text, Chr(0x2029), "`n`n")

    ; 保护真正的段落空行
    paragraphMark := Chr(0xE000)
    cleaned := RegExReplace(text, "\n[ \t]*\n+", paragraphMark)

    ; 把普通换行替换为空格
    cleaned := RegExReplace(cleaned, "[ \t]*\n[ \t]*", " ")

    ; 恢复段落空行
    cleaned := StrReplace(cleaned, paragraphMark, "`r`n`r`n")

    ; 清理连续空格
    cleaned := RegExReplace(cleaned, "[ \t]{2,}", " ")
    cleaned := Trim(cleaned)

    ; 内容没有变化时退出，避免重复触发
    if cleaned = text
        return

    A_Clipboard := cleaned

    ToolTip "已自动合并 PDF 换行"
    SetTimer HideToolTip, -1000
}

HideToolTip()
{
    ToolTip
}

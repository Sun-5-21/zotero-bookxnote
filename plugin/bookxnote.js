BookxNoteOpener = {
  id: null,
  version: null,
  rootURI: null,
  initialized: false,

  PREF_EXE: "extensions.zotero.bookxnote-opener.executablePath",
  ITEM_MENU_ID: "bookxnote-opener-item-menu",
  TOOLS_MENU_ID: "bookxnote-opener-tools-menu",

  strings: {
    zh: {
      open: "使用 BookxNote Pro 打开",
      configure: "设置 BookxNote Pro 路径…",
      pickerTitle: "选择 BookxNote Pro 程序",
      notFoundTitle: "未找到 BookxNote Pro",
      notFoundBody: "请选择 BookxNotePro.exe（或 BookxNote.exe）的位置。",
      noPDFTitle: "没有可打开的 PDF",
      noPDFBody: "请选中 PDF 附件，或选中含有 PDF 附件的文献条目。",
      openFailedTitle: "打开失败",
      invalidExeBody: "BookxNote Pro 程序路径无效，请重新设置。",
      configuredTitle: "设置完成",
      configuredBody: "已保存 BookxNote Pro 程序路径。",
      cancelledTitle: "未更改设置",
      openedTitle: "已交给 BookxNote Pro 打开",
      openedBody: "已处理 {count} 个 PDF。"
    },
    en: {
      open: "Open with BookxNote Pro",
      configure: "Set BookxNote Pro Path…",
      pickerTitle: "Select BookxNote Pro",
      notFoundTitle: "BookxNote Pro Not Found",
      notFoundBody: "Select BookxNotePro.exe (or BookxNote.exe).",
      noPDFTitle: "No PDF Available",
      noPDFBody: "Select a PDF attachment or a library item with a PDF attachment.",
      openFailedTitle: "Could Not Open PDF",
      invalidExeBody: "The saved BookxNote Pro path is invalid. Set it again.",
      configuredTitle: "Path Saved",
      configuredBody: "The BookxNote Pro executable path has been saved.",
      cancelledTitle: "Settings Unchanged",
      openedTitle: "Sent to BookxNote Pro",
      openedBody: "Processed {count} PDF file(s)."
    }
  },

  init({ id, version, rootURI }) {
    if (this.initialized) return;
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.initialized = true;
  },

  log(message, error) {
    Zotero.debug("BookxNote Pro Opener: " + message);
    if (error) Zotero.logError(error);
  },

  locale() {
    let value = String(
      Zotero.locale ||
      (Services.locale && Services.locale.appLocaleAsBCP47) ||
      "en"
    ).toLowerCase();
    return value.startsWith("zh") ? "zh" : "en";
  },

  t(key, variables) {
    let text = this.strings[this.locale()][key] || this.strings.en[key] || key;
    for (let [name, value] of Object.entries(variables || {})) {
      text = text.replaceAll("{" + name + "}", String(value));
    }
    return text;
  },

  async startup() {
    this.registerMenus();
    this.log("Started");
  },

  async shutdown() {
    this.initialized = false;
    this.log("Stopped");
  },

  registerMenus() {
    Zotero.MenuManager.registerMenu({
      menuID: this.ITEM_MENU_ID,
      pluginID: this.id,
      target: "main/library/item",
      menus: [
        {
          menuType: "menuitem",
          onShowing: async (_event, context) => {
            context.menuElem.setAttribute("label", this.t("open"));
            let paths = await this.getSelectedPDFPaths();
            context.setVisible(paths.length > 0);
          },
          onCommand: async () => {
            await this.openSelectedPDFs();
          }
        }
      ]
    });

    Zotero.MenuManager.registerMenu({
      menuID: this.TOOLS_MENU_ID,
      pluginID: this.id,
      target: "main/menubar/tools",
      menus: [
        {
          menuType: "menuitem",
          enableForTabTypes: ["library", "reader/*"],
          onShowing: (_event, context) => {
            context.menuElem.setAttribute("label", this.t("configure"));
          },
          onCommand: async () => {
            await this.configureExecutable(true);
          }
        }
      ]
    });
  },

  async getSelectedPDFPaths() {
    let pane = Zotero.getActiveZoteroPane && Zotero.getActiveZoteroPane();
    if (!pane) return [];

    let selected = pane.getSelectedItems ? pane.getSelectedItems() : [];
    let paths = [];

    for (let item of selected) {
      try {
        let attachment = null;

        if (item.isAttachment && item.isAttachment()) {
          attachment = item;
        }
        else if (item.getBestAttachment) {
          attachment = await item.getBestAttachment();

          if ((!attachment || !attachment.isPDFAttachment || !attachment.isPDFAttachment()) && item.getAttachments) {
            let attachmentIDs = item.getAttachments();
            let attachments = await Zotero.Items.getAsync(attachmentIDs);
            attachment = attachments.find(candidate =>
              candidate && candidate.isPDFAttachment && candidate.isPDFAttachment()
            ) || null;
          }
        }

        if (!attachment || !attachment.isPDFAttachment || !attachment.isPDFAttachment()) {
          continue;
        }

        let path = attachment.getFilePath && attachment.getFilePath();
        if (!path) continue;

        let file = Zotero.File.pathToFile(path);
        if (file && file.exists()) paths.push(path);
      }
      catch (error) {
        this.log("Could not resolve selected attachment", error);
      }
    }

    return [...new Set(paths)];
  },

  getSavedExecutable() {
    try {
      return String(Zotero.Prefs.get(this.PREF_EXE, true) || "");
    }
    catch (error) {
      this.log("Could not read executable preference", error);
      return "";
    }
  },

  saveExecutable(path) {
    Zotero.Prefs.set(this.PREF_EXE, path, true);
  },

  fileExists(path) {
    if (!path) return false;
    try {
      return Zotero.File.pathToFile(path).exists();
    }
    catch (_error) {
      return false;
    }
  },

  joinPath(base, relative) {
    if (!base) return "";
    let separator = base.includes("\\") ? "\\" : "/";
    return base.replace(/[\\/]+$/, "") + separator + relative.replace(/[\\/]/g, separator);
  },

  environment(name) {
    try {
      let env = Components.classes["@mozilla.org/process/environment;1"]
        .getService(Components.interfaces.nsIEnvironment);
      return env.exists(name) ? env.get(name) : "";
    }
    catch (_error) {
      return "";
    }
  },

  autoDetectExecutable() {
    let localAppData = this.environment("LOCALAPPDATA");
    let programFiles = this.environment("ProgramFiles") || this.environment("PROGRAMFILES");
    let programFilesX86 = this.environment("ProgramFiles(x86)") || this.environment("PROGRAMFILES(X86)");
    let home = this.environment("HOME");

    let candidates = [
      this.joinPath(localAppData, "Programs/BookxNote Pro/BookxNotePro.exe"),
      this.joinPath(localAppData, "Programs/BookxNotePro/BookxNotePro.exe"),
      this.joinPath(localAppData, "BookxNote Pro/BookxNotePro.exe"),
      this.joinPath(localAppData, "BookxNotePro/BookxNotePro.exe"),
      this.joinPath(localAppData, "Microsoft/WindowsApps/BookxNotePro.exe"),
      this.joinPath(programFiles, "BookxNote Pro/BookxNotePro.exe"),
      this.joinPath(programFiles, "BookxNotePro/BookxNotePro.exe"),
      this.joinPath(programFilesX86, "BookxNote Pro/BookxNotePro.exe"),
      this.joinPath(programFilesX86, "BookxNotePro/BookxNotePro.exe"),
      this.joinPath(home, ".local/bin/BookxNotePro"),
      this.joinPath(home, ".local/bin/bookxnotepro")
    ].filter(Boolean);

    for (let candidate of candidates) {
      if (this.fileExists(candidate)) return candidate;
    }
    return "";
  },

  async chooseExecutable() {
    let win = Zotero.getMainWindow();
    let fp = Components.classes["@mozilla.org/filepicker;1"]
      .createInstance(Components.interfaces.nsIFilePicker);

    fp.init(
      win.browsingContext,
      this.t("pickerTitle"),
      Components.interfaces.nsIFilePicker.modeOpen
    );
    fp.appendFilter("BookxNote Pro", "*.exe; BookxNotePro; bookxnotepro");
    fp.appendFilters(
      Components.interfaces.nsIFilePicker.filterApps |
      Components.interfaces.nsIFilePicker.filterAll
    );

    let result = await new Promise(resolve => fp.open(resolve));
    if (
      result !== Components.interfaces.nsIFilePicker.returnOK &&
      result !== Components.interfaces.nsIFilePicker.returnReplace
    ) {
      return "";
    }
    return fp.file && fp.file.path ? fp.file.path : "";
  },

  async configureExecutable(showConfirmation) {
    let path = await this.chooseExecutable();
    if (!path) {
      if (showConfirmation) this.flash(this.t("cancelledTitle"));
      return "";
    }

    if (!this.fileExists(path)) {
      this.flash(this.t("openFailedTitle"), this.t("invalidExeBody"));
      return "";
    }

    this.saveExecutable(path);
    if (showConfirmation) {
      this.flash(this.t("configuredTitle"), this.t("configuredBody") + "\n" + path);
    }
    return path;
  },

  async resolveExecutable() {
    let saved = this.getSavedExecutable();
    if (this.fileExists(saved)) return saved;

    let detected = this.autoDetectExecutable();
    if (detected) {
      this.saveExecutable(detected);
      return detected;
    }

    this.flash(this.t("notFoundTitle"), this.t("notFoundBody"), 4);
    return await this.configureExecutable(false);
  },

  launch(executable, pdfPath) {
    let file = Zotero.File.pathToFile(executable);
    let process = Components.classes["@mozilla.org/process/util;1"]
      .createInstance(Components.interfaces.nsIProcess);
    process.init(file);
    process.startHidden = false;
    process.runw(false, [pdfPath], 1);
  },

  async openSelectedPDFs() {
    let pdfPaths = await this.getSelectedPDFPaths();
    if (!pdfPaths.length) {
      this.flash(this.t("noPDFTitle"), this.t("noPDFBody"));
      return;
    }

    let executable = await this.resolveExecutable();
    if (!executable) return;

    try {
      for (let path of pdfPaths) {
        this.launch(executable, path);
      }
      this.flash(
        this.t("openedTitle"),
        this.t("openedBody", { count: pdfPaths.length }),
        3
      );
    }
    catch (error) {
      this.log("Launch failed", error);
      this.flash(
        this.t("openFailedTitle"),
        this.t("invalidExeBody") + "\n" + String(error)
      );
    }
  },

  flash(title, body, seconds) {
    try {
      let progressWindow = new Zotero.ProgressWindow();
      progressWindow.changeHeadline("BookxNote Pro");
      progressWindow.addDescription(body ? title + "\n" + body : title);
      progressWindow.show();
      progressWindow.startCloseTimer((seconds || 6) * 1000);
    }
    catch (error) {
      this.log(title + (body ? ": " + body : ""), error);
    }
  }
};

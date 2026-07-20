var BookxNoteOpener;

function log(message) {
  Zotero.debug("BookxNote Pro Opener: " + message);
}

function install() {
  log("Installed");
}

async function startup({ id, version, resourceURI, rootURI }) {
  log("Starting " + version);
  await Zotero.initializationPromise;
  if (Zotero.uiReadyPromise) {
    await Zotero.uiReadyPromise;
  }

  rootURI = rootURI || (resourceURI && resourceURI.spec);
  if (!rootURI) {
    throw new Error("Cannot determine plugin root URI");
  }

  Services.scriptloader.loadSubScript(rootURI + "bookxnote.js");
  BookxNoteOpener.init({ id, version, rootURI });
  await BookxNoteOpener.startup();
}

function onMainWindowLoad({ window }) {}
function onMainWindowUnload({ window }) {}

async function shutdown() {
  log("Shutting down");
  if (BookxNoteOpener) {
    await BookxNoteOpener.shutdown();
    BookxNoteOpener = undefined;
  }
}

function uninstall() {
  log("Uninstalled");
}

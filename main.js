// === main.js ===
import { BUTTON_LABELS } from './ui/buttonLabels.js';
import { createFolder, createParamGroup, createParamItem } from './ui/createElements.js';
import { bindFolderEvents, bindGroupEvents, bindParamEvents, bindAllAddButtons } from './ui/bindEvents.js';
import './ui/live2dParamBinder.js';
import { setCollapseState } from './ui/helpers.js';
import { saveAppState, loadAppState } from './ui/storageManager.js';

document.addEventListener("DOMContentLoaded", () => {
  const collapseAllBtn = document.getElementById("collapseAllBtn");
  const addFolderButton = document.getElementById("addFolderBtn");

  collapseAllBtn.onclick = () => {
    const folders = document.querySelectorAll(".folder");
    const allCollapsed = [...folders].every(f => f.classList.contains("collapsed"));
    const targetState = !allCollapsed;

    folders.forEach(folder => {
      const toggleBtn = folder.querySelector(".toggle-btn");
      setCollapseState(folder, "collapsed", toggleBtn, targetState, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
    });

    saveAppState();
  };

  addFolderButton.onclick = () => {
    const appBlock = document.createElement("div");
    appBlock.className = "app-block";

    const folder = createFolder();

    const allFolders = document.querySelectorAll(".folder");
    const shouldBeCollapsed = allFolders.length > 0 && [...allFolders].every(f => f.classList.contains("collapsed"));
    if (shouldBeCollapsed) {
      folder.classList.add("collapsed");
    }

    appBlock.appendChild(folder);
    document.getElementById("app").appendChild(appBlock);

    bindFolderEvents(folder);
    bindAllAddButtons(folder);
    saveAppState();
  };

  // 將舊節點包進 .app-block 並綁定事件
  document.querySelectorAll(".folder").forEach(folder => {
    if (!folder.parentElement.classList.contains("app-block")) {
      const appBlock = document.createElement("div");
      appBlock.className = "app-block";
      folder.parentNode.insertBefore(appBlock, folder);
      appBlock.appendChild(folder);
    }

    bindFolderEvents(folder);
    bindAllAddButtons(folder);
  });

  // ✅ 嘗試還原儲存的狀態（會自動覆蓋 app 區塊）
  loadAppState({
    createFolder,
    createParamGroup,
    createParamItem,
    bindFolderEvents,
    bindGroupEvents,
    bindParamEvents,
    bindAllAddButtons
  });
});

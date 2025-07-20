// === main.js ===
import { BUTTON_LABELS } from './ui/buttonLabels.js';
import { createFolder,createAppBlockWithFolder  } from './ui/createElements.js';
import { bindFolderEvents, bindAllAddButtons } from './ui/bindEvents.js';
import './ui/live2dParamBinder.js';
import { setCollapseState } from './ui/helpers.js';
import {
  exportStateToJSON,
  importStateFromJSON,
  autoSaveState,
  tryLoadAutoSavedState,
  resetAllState,
  
} from './ui/stateManager.js';

document.addEventListener("DOMContentLoaded", async () => {
  const collapseAllBtn = document.getElementById("collapseAllBtn");
  const addFolderButton = document.getElementById("addFolderBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFileInput = document.getElementById("importFileInput");
  const app = document.getElementById("app");
  const resetBtn = document.getElementById("resetBtn");
  const container = document.getElementById("container");

waitForPluginConnected().then(async () => {
  const restored = await tryLoadAutoSavedState();
  if (!restored) {
    console.log("尚無儲存資料，自動載入略過。");
  }
});

  // ✅ 摺疊/展開所有資料夾
  collapseAllBtn.onclick = () => {
    const folders = document.querySelectorAll(".folder");
    const allCollapsed = [...folders].every(f => f.classList.contains("collapsed"));
    const targetState = !allCollapsed;

    folders.forEach(folder => {
      const toggleBtn = folder.querySelector(".toggle-btn");
      setCollapseState(folder, "collapsed", toggleBtn, targetState, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
    });

    autoSaveState();
  };

  // ✅ 新增資料夾
addFolderButton.onclick = () => {
  // ✅ 檢查是否已連線，未連線則提示
  if (window.cePlugin?.state !== 3) {
    const proceed = confirm("尚未連上 Cubism Editor，確定仍要新增資料夾嗎？\n新增的話，自動保存的網頁資料將會消失。");
    if (!proceed) return;
  }

  const appBlock = createAppBlockWithFolder();
  app.appendChild(appBlock);
  autoSaveState();
};



  // ✅ 匯出 JSON
  exportBtn.onclick = exportStateToJSON;

  // ✅ 載入 JSON（打開檔案）
  importBtn.onclick = () => {
    importFileInput.click();
  };

  resetBtn.onclick = () => {
  if (confirm("確定要清除所有設定？不會影響Live2D檔案，只是清除網頁資料")) {
    resetAllState();
    location.reload(); // 重新整理畫面
  }
};

  // ✅ 載入 JSON（還原畫面）
  importFileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const jsonData = JSON.parse(reader.result);
        await importStateFromJSON(jsonData);
        autoSaveState(); // 立即更新快取
      } catch (err) {
        alert("載入失敗，檔案格式可能錯誤。");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // ✅ 自動儲存：監聽 DOM 變更
  const observer = new MutationObserver(() => {
    autoSaveState();
  });
  observer.observe(app, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  });

  // ✅ 監聽值變更（滑桿、輸入框）
  app.addEventListener("input", autoSaveState);
  app.addEventListener("change", autoSaveState);
});

function waitForPluginConnected(timeout = 10000) {
  return new Promise((resolve, reject) => {
    const checkInterval = 100;
    let waited = 0;

    const check = () => {
      if (window.cePlugin?.state === 3) { // CEPlugin.CONNECTED
        resolve();
      } else if ((waited += checkInterval) >= timeout) {
        reject("等待 Cubism Editor 連線逾時");
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}

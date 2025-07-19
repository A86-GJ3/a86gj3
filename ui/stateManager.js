import { createFolder, createParamGroup, createParamItem } from './createElements.js';
import { bindFolderEvents, bindGroupEvents, bindParamEvents, bindAllAddButtons } from './bindEvents.js';
import { updateAllParamDropdowns,updateParamSelectOptions,updateSliderFromParameter   } from './live2dParamBinder.js';


/**
 * 匯出目前 UI 狀態為 JSON 檔案
 */
export function exportStateToJSON() {
  const folders = document.querySelectorAll(".folder");
  const state = [];

  folders.forEach(folder => {
    const folderData = {
      title: folder.querySelector(".folder-title")?.textContent || "",
      collapsed: folder.classList.contains("collapsed"),
      locked: folder.classList.contains("locked"),
      groups: []
    };

    const groups = folder.querySelectorAll(".group");
    groups.forEach(group => {
      const groupData = {
        title: group.querySelector(".group-title")?.textContent || "",
        collapsed: group.classList.contains("collapsed"),
        locked: group.classList.contains("locked"),
        params: []
      };

      const items = group.querySelectorAll(".param-item");
      items.forEach(item => {
        const select = item.querySelector(".param-name");
        const value = item.querySelector(".param-value")?.value;
        const locked = item.classList.contains("locked");

        groupData.params.push({
          id: select?.value || "",
          name: select?.selectedOptions[0]?.textContent || "",
          value: value != null ? parseFloat(value) : null,
          locked: locked
        });
      });

      folderData.groups.push(groupData);
    });

    state.push(folderData);
  });

  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "live2d_ui_state.json";
  a.click();
  URL.revokeObjectURL(url);
}


/**
 * 載入 JSON 狀態並重建 UI 結構
 * @param {Array} jsonData - 匯入的 JSON 陣列
 */
export async function importStateFromJSON(jsonData) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  for (const folderData of jsonData) {
    const appBlock = document.createElement("div");
    appBlock.className = "app-block";

    const folder = createFolder();
    const folderTitle = folder.querySelector(".folder-title");
    if (folderTitle) folderTitle.textContent = folderData.title;
    if (folderData.collapsed) folder.classList.add("collapsed");
    if (folderData.locked) folder.classList.add("locked");

    const groupList = folder.querySelector(".group-list");
    groupList.innerHTML = "";

    for (const groupData of folderData.groups) {
      const group = createParamGroup();
      const groupTitle = group.querySelector(".group-title");
      if (groupTitle) groupTitle.textContent = groupData.title;
      if (groupData.collapsed) group.classList.add("collapsed");
      if (groupData.locked) group.classList.add("locked");

      const paramList = group.querySelector(".param-list");
      paramList.innerHTML = "";

      for (const paramData of groupData.params) {
        const paramItem = createParamItem();
        const select = paramItem.querySelector(".param-name");
        const number = paramItem.querySelector(".param-value");
        const slider = paramItem.querySelector(".param-slider");

        // 等待 DOM 渲染後填值
        await new Promise(resolve => setTimeout(resolve, 10));

await updateParamSelectOptions(select);
select.value = paramData.id;
select.setAttribute("data-prev-id", paramData.id);

// 正確刷新 min/max/value
const approved = await window.cePlugin.sendMessage("GetIsApproval", {});
if (approved.Data.Result) {
  const uidRes = await window.cePlugin.sendMessage("GetCurrentModelUID", {});
  const modelUID = uidRes.Data.ModelUID;
  await updateSliderFromParameter(select, modelUID, paramData.id);
}

// 再手動套用指定的值
number.value = slider.value = paramData.value;


        if (paramData.locked) paramItem.classList.add("locked");

        bindParamEvents(paramItem);
        paramList.appendChild(paramItem);
      }

      // 加上新增按鈕
      const addBtn = document.createElement("button");
      addBtn.className = "btn add-param";
      addBtn.textContent = "➤ 新增參數";
      paramList.appendChild(addBtn);

      bindGroupEvents(group);
      bindAllAddButtons(group);
      groupList.appendChild(group);
    }

    bindFolderEvents(folder);
    bindAllAddButtons(folder);
    appBlock.appendChild(folder);
    app.appendChild(appBlock);
  }

  await updateAllParamDropdowns();
}


const LOCAL_STORAGE_KEY = "Live2D_UI_State";

/** 儲存目前狀態到 localStorage */
export function autoSaveState() {
  const folders = document.querySelectorAll(".folder");
  const state = [];

  folders.forEach(folder => {
    const folderData = {
      title: folder.querySelector(".folder-title")?.textContent || "",
      collapsed: folder.classList.contains("collapsed"),
      locked: folder.classList.contains("locked"),
      groups: []
    };

    const groups = folder.querySelectorAll(".group");
    groups.forEach(group => {
      const groupData = {
        title: group.querySelector(".group-title")?.textContent || "",
        collapsed: group.classList.contains("collapsed"),
        locked: group.classList.contains("locked"),
        params: []
      };

      const items = group.querySelectorAll(".param-item");
      items.forEach(item => {
        const select = item.querySelector(".param-name");
        const value = item.querySelector(".param-value")?.value;
        const locked = item.classList.contains("locked");

        groupData.params.push({
          id: select?.value || "",
          name: select?.selectedOptions[0]?.textContent || "",
          value: value != null ? parseFloat(value) : null,
          locked: locked
        });
      });

      folderData.groups.push(groupData);
    });

    state.push(folderData);
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
}


/** 嘗試從 localStorage 載入狀態 */
export async function tryLoadAutoSavedState() {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return false;

  try {
    const json = JSON.parse(raw);
    await importStateFromJSON(json);
    return true;
  } catch (err) {
    console.warn("自動載入失敗：", err);
    return false;
  }
}


/** 清除畫面與自動儲存狀態 */
export function resetAllState() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  localStorage.removeItem("Live2D_UI_State");
}

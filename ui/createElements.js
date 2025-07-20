import { BUTTON_LABELS } from './buttonLabels.js';
import { bindParamEvents, bindGroupEvents, bindAllAddButtons,bindFolderEvents } from './bindEvents.js';
import { moveUp, moveDown } from './helpers.js'; // 放在檔案頂部

export function createAppBlockWithFolder() {
  const appBlock = document.createElement("div");
  appBlock.className = "app-block";

  const folder = createFolder();
  appBlock.appendChild(folder);

  // 綁定事件
  bindFolderEvents(folder);
  bindAllAddButtons(folder);

  return appBlock;
}

export function createParamItem() {
  const div = document.createElement("div");
  div.className = "param-item";
  div.innerHTML = `
    <button class="btn sort-up-btn">${BUTTON_LABELS.sortUp}</button>
    <button class="btn sort-down-btn">${BUTTON_LABELS.sortDown}</button>
    <button class="btn lock-btn">${BUTTON_LABELS.lock}</button>
    <select class="param-name">
      <option>Test01</option>
      <option>Test02</option>
    </select>
    <input type="range" class="param-slider" min="0" max="1" step="0.01" value="1">
    <input type="number" class="param-value" min="0" max="1" step="0.01" value="1">
    <button class="btn delete-btn">${BUTTON_LABELS.delete}</button>
  `;
  return div;
}

export function createParamGroup(parentFolder = null) {
  const div = document.createElement("div");
  div.className = "group";

  // 如果未指定父層資料夾，就取最近的 group-list 往上找 .folder
  if (!parentFolder) {
    const groupList = document.querySelector(".group-list:last-child");
    if (groupList) {
      parentFolder = groupList.closest(".folder");
    }
  }

  // 預設為展開，除非父層資料夾中所有 group 都是 collapsed
  let groupName = `${BUTTON_LABELS.newGroup}`;
  if (parentFolder) {
    const existingGroups = parentFolder.querySelectorAll(".group");
    const allCollapsed = existingGroups.length > 0 && [...existingGroups].every(g => g.classList.contains("collapsed"));
    if (allCollapsed) div.classList.add("collapsed");

    const groupIndex = existingGroups.length + 1;
    const paddedNumber = String(groupIndex).padStart(2, '0');
    groupName = `${BUTTON_LABELS.newGroup} (${paddedNumber})`;
  } else {
    // 如果真的找不到父層（極端 fallback）
    console.warn("⚠️ createParamGroup: 無法判定父層資料夾，將使用全域 fallback 編號。");
    const index = document.querySelectorAll(".group").length + 1;
    const paddedNumber = String(index).padStart(2, '0');
    groupName = `${BUTTON_LABELS.newGroup} (${paddedNumber})`;
  }

  div.innerHTML = `
    <div class="group-header">
      <button class="btn toggle-btn">${BUTTON_LABELS.collapse}</button>
      <button class="btn sort-up-btn">${BUTTON_LABELS.sortUp}</button>
      <button class="btn sort-down-btn">${BUTTON_LABELS.sortDown}</button>
      <button class="btn lock-btn">${BUTTON_LABELS.lock}</button>
      <button class="btn apply-btn">${BUTTON_LABELS.apply}</button>
      <span class="group-title" contenteditable="true">${groupName}</span>
      <button class="btn duplicate-group-btn">${BUTTON_LABELS.duplicateGroup}</button>
      <button class="btn auto-create-group-btn">${BUTTON_LABELS.autoCreate}</button>
      <button class="btn delete-btn">${BUTTON_LABELS.delete}</button>
    </div>
    <div class="param-list"></div>
  `;

  const paramList = div.querySelector(".param-list");
  const item = createParamItem();
  const addBtn = document.createElement("button");
  addBtn.className = "btn add-param";
  addBtn.textContent = BUTTON_LABELS.addParam;

  paramList.appendChild(item);
  paramList.appendChild(addBtn);

  bindParamEvents(item);

  return div;
}




export function createFolder() {
  const folder = document.createElement("div");
  folder.className = "folder";

  const allFolders = document.querySelectorAll(".folder");
  const allCollapsed = allFolders.length > 0 && [...allFolders].every(f => f.classList.contains("collapsed"));
  if (allCollapsed) folder.classList.add("collapsed");

  const index = allFolders.length + 1;
  const paddedNumber = String(index).padStart(2, '0');
  const folderName = `${BUTTON_LABELS.newFolder} (${paddedNumber})`;

  folder.innerHTML = `
    <div class="folder-header">
      <button class="btn toggle-btn">${BUTTON_LABELS.collapse}</button>
      <button class="btn collapse-groups-btn">摺疊組</button>
      <button class="btn sort-up-btn">${BUTTON_LABELS.sortUp}</button>
      <button class="btn sort-down-btn">${BUTTON_LABELS.sortDown}</button>
      <span class="folder-title" contenteditable="true">${folderName}</span>
      <button class="btn delete-btn">${BUTTON_LABELS.delete}</button>
    </div>
    <div class="group-list"></div>
    <button class="btn add-group">${BUTTON_LABELS.addGroup}</button>
  `;

  const groupList = folder.querySelector(".group-list");

  // ✅ 傳入 parentFolder，讓編號正確從1開始
  const group = createParamGroup(folder);
  groupList.appendChild(group);

  bindGroupEvents(group);
  bindAllAddButtons(folder);

  return folder;
}






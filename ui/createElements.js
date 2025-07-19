import { BUTTON_LABELS } from './buttonLabels.js';
import { bindParamEvents, bindGroupEvents, bindAllAddButtons } from './bindEvents.js';

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

export function createParamGroup() {
  const div = document.createElement("div");
  div.className = "group";

  // 檢查是否要初始為摺疊狀態
  const parentFolder = document.querySelector(".folder:last-child");
  if (parentFolder) {
    const existingGroups = parentFolder.querySelectorAll(".group");
    const allCollapsed = [...existingGroups].length > 0 && [...existingGroups].every(g => g.classList.contains("collapsed"));
    if (allCollapsed) div.classList.add("collapsed");
  }

  div.innerHTML = `
    <div class="group-header">
      <button class="btn toggle-btn">${BUTTON_LABELS.collapse}</button>
      <button class="btn sort-up-btn">${BUTTON_LABELS.sortUp}</button>
      <button class="btn sort-down-btn">${BUTTON_LABELS.sortDown}</button>
      <button class="btn lock-btn">${BUTTON_LABELS.lock}</button>
      <button class="btn apply-btn">${BUTTON_LABELS.apply}</button>
      <span class="group-title" contenteditable="true">新參數組</span>
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

  // 若目前所有資料夾都摺疊，則這個新建資料夾也預設摺疊
  const allFolders = document.querySelectorAll(".folder");
  const allCollapsed = [...allFolders].length > 0 && [...allFolders].every(f => f.classList.contains("collapsed"));
  if (allCollapsed) folder.classList.add("collapsed");

  folder.innerHTML = `
    <div class="folder-header">
      <button class="btn toggle-btn">${BUTTON_LABELS.collapse}</button>
      <button class="btn collapse-groups-btn">摺疊組</button>
      <button class="btn sort-up-btn">${BUTTON_LABELS.sortUp}</button>
      <button class="btn sort-down-btn">${BUTTON_LABELS.sortDown}</button>
      <span class="folder-title" contenteditable="true">新資料夾</span>
      <button class="btn delete-btn">${BUTTON_LABELS.delete}</button>
    </div>
    <div class="group-list"></div>
    <button class="btn add-group">${BUTTON_LABELS.addGroup}</button>
  `;

  const groupList = folder.querySelector(".group-list");
  const group = createParamGroup();
  groupList.appendChild(group);

  bindGroupEvents(group);
  bindAllAddButtons(folder);

  return folder;
}

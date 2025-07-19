import { BUTTON_LABELS } from './buttonLabels.js';
import { createParamItem, createParamGroup } from './createElements.js';
import { toggleCollapse, moveUp, moveDown, updateParamLockVisuals, setCollapseState } from './helpers.js';

import { bindParamDropdown } from './live2dParamBinder.js';

export function bindAllAddButtons(scope = document) {
  scope.querySelectorAll(".add-param").forEach(btn => {
    btn.onclick = () => {
      const list = btn.closest(".param-list");
      const newItem = createParamItem();
      list.insertBefore(newItem, btn);
      bindParamEvents(newItem);

      const group = btn.closest(".group");
      if (group?.classList.contains("locked")) {
        updateParamLockVisuals(group);
      }
    };
  });

  scope.querySelectorAll(".add-group").forEach(btn => {
    btn.onclick = () => {
      const folder = btn.closest(".folder");
      const groupList = folder.querySelector(".group-list");
      const group = createParamGroup();
      groupList.appendChild(group);
      bindGroupEvents(group);

      if (folder.classList.contains("collapsed")) {
        group.classList.add("collapsed");
        group.querySelector(".toggle-btn").textContent = BUTTON_LABELS.expand;
      }

      bindAllAddButtons(group);
    };
  });
}

export function bindParamEvents(item) {
  const slider = item.querySelector(".param-slider");
  const number = item.querySelector(".param-value");
  const select = item.querySelector(".param-name");

  slider.oninput = () => number.value = slider.value;
  number.oninput = () => slider.value = number.value;

  // 🔗 綁定 Live2D 參數下拉行為
  bindParamDropdown(select);

  item.querySelector(".lock-btn").onclick = e => {
    if (item.classList.contains("parent-locked")) return;
    e.stopPropagation();
    item.classList.toggle("locked");
  };

  item.querySelector(".delete-btn").onclick = () => {
    if (confirm("確定要刪除這個參數條？")) item.remove();
  };

  item.querySelector(".sort-up-btn")?.addEventListener("click", () => moveUp(item, ".param-item"));
  item.querySelector(".sort-down-btn")?.addEventListener("click", () => moveDown(item, ".param-item"));
}

export function bindGroupEvents(group) {
  const toggleBtn = group.querySelector(".toggle-btn");
  const lockBtn = group.querySelector(".lock-btn");
  const delBtn = group.querySelector(".delete-btn");
  const applyBtn = group.querySelector(".apply-btn");
  const title = group.querySelector(".group-title");

  toggleBtn.onclick = () => {
  const isCollapsed = group.classList.contains("collapsed");
  setCollapseState(group, "collapsed", toggleBtn, !isCollapsed, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
};


  lockBtn.onclick = e => {
    e.stopPropagation();
    group.classList.toggle("locked");
    title.contentEditable = !group.classList.contains("locked");
    updateParamLockVisuals(group);
  };

  delBtn.onclick = () => {
    if (confirm("確定要刪除這個參數組？")) group.remove();
  };

  applyBtn.onclick = async () => {
    const approved = await window.cePlugin.sendMessage("GetIsApproval", {});
    if (!approved.Data.Result) {
      console.warn("尚未獲得 Cubism Editor 權限");
      return;
    }

    const uidRes = await window.cePlugin.sendMessage("GetCurrentModelUID", {});
    const modelUID = uidRes.Data.ModelUID;

    const paramItems = group.querySelectorAll(".param-item");
    const paramList = [];

    paramItems.forEach(item => {
      const select = item.querySelector(".param-name");
      const valueInput = item.querySelector(".param-value");
      const id = select.value;
      const value = parseFloat(valueInput.value);

      if (id && !isNaN(value)) {
        paramList.push({ Id: id, Value: value });
      }
    });

    if (paramList.length > 0) {
      await window.cePlugin.sendMessage("SetParameterValues", {
        ModelUID: modelUID,
        Parameters: paramList
      });
      console.log("已套用參數：", paramList);
    } else {
      console.warn("沒有有效的參數可套用");
    }
  };

  group.querySelector(".sort-up-btn")?.addEventListener("click", () => moveUp(group, ".group"));
  group.querySelector(".sort-down-btn")?.addEventListener("click", () => moveDown(group, ".group"));
}


export function bindFolderEvents(folder) {
  const toggleBtn = folder.querySelector(".toggle-btn");
  const delBtn = folder.querySelector(".delete-btn");

  const collapseGroupsBtn = folder.querySelector(".collapse-groups-btn");
  collapseGroupsBtn.onclick = () => {
  const groups = folder.querySelectorAll(".group");
  const allCollapsed = [...groups].every(g => g.classList.contains("collapsed"));
  const targetState = !allCollapsed;

  groups.forEach(group => {
    const toggleBtn = group.querySelector(".toggle-btn");
    setCollapseState(group, "collapsed", toggleBtn, targetState, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
  });
};



  toggleBtn.onclick = () => {
  const isCollapsed = folder.classList.contains("collapsed");
  setCollapseState(folder, "collapsed", toggleBtn, !isCollapsed, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
};


delBtn.onclick = () => {
  if (confirm("確定要刪除這個組資料夾？")) {
    const appBlock = folder.closest(".app-block");
    if (appBlock) appBlock.remove();
    else folder.remove(); // fallback
  }
};


  folder.querySelector(".sort-up-btn")?.addEventListener("click", () => moveUp(folder, ".folder"));
  folder.querySelector(".sort-down-btn")?.addEventListener("click", () => moveDown(folder, ".folder"));
}

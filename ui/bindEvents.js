import { BUTTON_LABELS } from './buttonLabels.js';
import { createParamItem, createParamGroup } from './createElements.js';
import { toggleCollapse, moveUp, moveDown, updateParamLockVisuals, setCollapseState } from './helpers.js';
import { bindParamDropdown ,updateParamSelectOptions ,updateSliderFromParameter } from './live2dParamBinder.js';

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

    // ✅ 修正：傳入父層資料夾，讓編號正確
    const group = createParamGroup(folder);
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
  const dupBtn = group.querySelector(".duplicate-group-btn");
  const autoBtn = group.querySelector(".auto-create-group-btn");

  toggleBtn.onclick = () => {
    const isCollapsed = group.classList.contains("collapsed");
    setCollapseState(group, "collapsed", toggleBtn, !isCollapsed, BUTTON_LABELS.expand, BUTTON_LABELS.collapse);
  };

  autoBtn.onclick = async () => {
    if (!confirm("自動建立將會清空此參數組。\n並新增所有在Live2D中，目前不為預設值的參數。\n是否繼續？")) return;

    const approved = await window.cePlugin.sendMessage("GetIsApproval", {});
    if (!approved.Data.Result) {
      alert("尚未獲得 Cubism Editor 權限");
      return;
    }

    const uidRes = await window.cePlugin.sendMessage("GetCurrentModelUID", {});
    const modelUID = uidRes.Data.ModelUID;

    const paramRes = await window.cePlugin.sendMessage("GetParameters", { ModelUID: modelUID });
    const valueRes = await window.cePlugin.sendMessage("GetParameterValues", { ModelUID: modelUID });

    const allParams = paramRes.Data.Parameters;
    const allValues = valueRes.Data.Parameters;
    const valueMap = new Map(allValues.map(p => [p.Id, p.Value]));

    const paramList = group.querySelector(".param-list");
    [...paramList.querySelectorAll(".param-item")].forEach(el => el.remove());

    const EPSILON = 0.001;
    console.log("🔍 自動建立檢查開始");

    for (const param of allParams) {
      const current = valueMap.get(param.Id);
      const def = param.Default;
      const diff = Math.abs(current - def);
      const skipByValue = diff < EPSILON;

      console.log(`參數 ID: ${param.Id}`);
      console.log(`  ➤ 名稱: ${param.Name}`);
      console.log(`  ➤ 預設值: ${def}`);
      console.log(`  ➤ 目前值: ${current}`);
      console.log(`  ➤ 差值: ${diff}`);
      console.log(`  ➤ 差值 < ε (${EPSILON}): ${skipByValue}`);
      console.log(`  ➤ 結論: ${skipByValue ? "略過" : "✅ 新增"}`);
      console.log("-------------------------------");

      if (skipByValue) continue;

      const item = createParamItem();
      const select = item.querySelector(".param-name");
      const number = item.querySelector(".param-value");
      const slider = item.querySelector(".param-slider");

      paramList.insertBefore(item, paramList.querySelector(".add-param"));

      await updateParamSelectOptions(select);
      select.value = param.Id;
      select.setAttribute("data-prev-id", param.Id);
      await updateSliderFromParameter(select, modelUID, param.Id);
      number.value = slider.value = current;
      bindParamEvents(item);
    }

    console.log("✅ 自動建立完成");
  };

  dupBtn.onclick = async () => {
    const clone = group.cloneNode(true);
    const paramItems = clone.querySelectorAll(".param-item");

    for (const item of paramItems) {
      const select = item.querySelector(".param-name");
      const number = item.querySelector(".param-value");
      const slider = item.querySelector(".param-slider");

      await updateParamSelectOptions(select);

      const originalItem = group.querySelectorAll(".param-item")[Array.from(paramItems).indexOf(item)];
      const originalSelect = originalItem.querySelector(".param-name");
      const prevValue = originalSelect?.value || "";
      select.value = prevValue;
      select.setAttribute("data-prev-id", prevValue);

      slider.oninput = () => number.value = slider.value;
      number.oninput = () => slider.value = number.value;

      bindParamEvents(item);
    }

    bindAllAddButtons(clone);
    bindGroupEvents(clone);
    group.parentNode.insertBefore(clone, group.nextSibling);
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
  const appBlock = folder.closest(".app-block");

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
      if (appBlock) appBlock.remove();
      else folder.remove();
    }
  };

  const header = folder.querySelector(".folder-header");
header.querySelector(".sort-up-btn")?.addEventListener("click", () => {
  const appBlock = folder.closest(".app-block");
  console.log("🔼 資料夾排序：上移");
  moveUp(appBlock, ".app-block");
});

header.querySelector(".sort-down-btn")?.addEventListener("click", () => {
  const appBlock = folder.closest(".app-block");
  console.log("🔽 資料夾排序：下移");
  moveDown(appBlock, ".app-block");
});

}

// === live2dParamBinder.js ===
const cePlugin = window.cePlugin;

// 初始化/刷新下拉選單內容
export async function updateParamSelectOptions(selectElem) {
  try {
    const approved = await cePlugin.sendMessage("GetIsApproval", {});
    if (!approved.Data.Result) {
      console.warn("Cubism Editor 未授權");
      return;
    }

    const uidRes = await cePlugin.sendMessage("GetCurrentModelUID", {});
    const modelUID = uidRes.Data.ModelUID;

    const paramRes = await cePlugin.sendMessage("GetParameters", { ModelUID: modelUID });
    const paramList = paramRes.Data.Parameters;

    const previousValue = selectElem.value;
    selectElem.innerHTML = "";

    // 取得同一組內，其他 param-item 已選的 Id
    const group = selectElem.closest(".group");
    const usedIds = new Set();

    group.querySelectorAll(".param-item .param-name").forEach(otherSelect => {
      if (otherSelect !== selectElem) {
        const id = otherSelect.value;
        if (id) usedIds.add(id);
      }
    });

    // 名稱統計（避免重名）
    const nameCount = {};
    for (const param of paramList) {
      nameCount[param.Name] = (nameCount[param.Name] || 0) + 1;
    }

    // 插入預設空選項 ---
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "---";
    selectElem.appendChild(defaultOption);

    // 插入可用參數
    for (const param of paramList) {
      const id = param.Id;

      // 排除其他項已選、但保留自己目前已選的 id
      if (usedIds.has(id) && id !== previousValue) continue;

      const option = document.createElement("option");
      option.value = id;
      option.textContent = nameCount[param.Name] > 1
        ? `${param.Name} (${param.Id})`
        : param.Name;

      selectElem.appendChild(option);
    }

    // 還原之前選擇（若還在名單內）
    if ([...selectElem.options].some(o => o.value === previousValue)) {
      selectElem.value = previousValue;
      selectElem.setAttribute("data-prev-id", previousValue);
    } else {
      selectElem.value = "";
      selectElem.setAttribute("data-prev-id", "");
    }

  } catch (err) {
    console.error("取得參數失敗", err);
  }
}


// 批次刷新所有下拉選單（可用於全域更新）
export async function updateAllParamDropdowns() {
  const selects = document.querySelectorAll("select.param-name");
  for (const select of selects) {
    await updateParamSelectOptions(select);
  }
}

// 綁定單一下拉選單：點開刷新、變更選擇時更新 slider
export function bindParamDropdown(selectElem) {
  updateParamSelectOptions(selectElem);

  selectElem.addEventListener("mousedown", () => {
    updateParamSelectOptions(selectElem); // 只更新名單
  });

  selectElem.addEventListener("change", async () => {
    const newValue = selectElem.value;
    const prevValue = selectElem.getAttribute("data-prev-id") || "";

    // 不更新空值或相同選項
    if (!newValue || newValue === prevValue) return;

    const approved = await cePlugin.sendMessage("GetIsApproval", {});
    if (!approved.Data.Result) return;

    const uidRes = await cePlugin.sendMessage("GetCurrentModelUID", {});
    const modelUID = uidRes.Data.ModelUID;

    await updateSliderFromParameter(selectElem, modelUID, newValue);
    selectElem.setAttribute("data-prev-id", newValue);
  });
}

// 更新 slider 和數值輸入框的 min/max/value
async function updateSliderFromParameter(selectElem, modelUID, paramId) {
  try {
    const paramRes = await cePlugin.sendMessage("GetParameters", { ModelUID: modelUID });
    const param = paramRes.Data.Parameters.find(p => p.Id === paramId);
    if (!param) return;

    const parent = selectElem.closest(".param-item");
    const slider = parent.querySelector(".param-slider");
    const number = parent.querySelector(".param-value");

    slider.min = number.min = param.Min;
    slider.max = number.max = param.Max;

    // 獲取目前參數值
    const valueRes = await cePlugin.sendMessage("GetParameterValues", { ModelUID: modelUID });
    const match = valueRes.Data.Parameters.find(p => p.Id === paramId);
    const value = match?.Value ?? param.DefaultValue;

    slider.value = number.value = value;
  } catch (err) {
    console.error("更新滑桿失敗：", err);
  }
}

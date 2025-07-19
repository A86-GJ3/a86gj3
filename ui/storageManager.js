// === storageManager.js ===

export function saveAppState() {
  const folders = [...document.querySelectorAll(".folder")];
  const data = folders.map(folder => {
    const folderData = {
      title: folder.querySelector(".folder-title")?.textContent || "",
      collapsed: folder.classList.contains("collapsed"),
      groups: []
    };

    folder.querySelectorAll(".group").forEach(group => {
      const groupData = {
        title: group.querySelector(".group-title")?.textContent || "",
        collapsed: group.classList.contains("collapsed"),
        locked: group.classList.contains("locked"),
        params: []
      };

      group.querySelectorAll(".param-item").forEach(param => {
        const id = param.querySelector(".param-name")?.value || "";
        const value = parseFloat(param.querySelector(".param-value")?.value || "0");
        const locked = param.classList.contains("locked");

        groupData.params.push({ id, value, locked });
      });

      folderData.groups.push(groupData);
    });

    return folderData;
  });

  localStorage.setItem("live2dParamState", JSON.stringify(data));
}

export function loadAppState({ createFolder, createParamGroup, createParamItem, bindFolderEvents, bindGroupEvents, bindParamEvents, bindAllAddButtons }) {
  const saved = localStorage.getItem("live2dParamState");
  if (!saved) return;

  const container = document.getElementById("app");
  container.innerHTML = "";

  const state = JSON.parse(saved);

  state.forEach(folderData => {
    const appBlock = document.createElement("div");
    appBlock.className = "app-block";

    const folder = createFolder();
    const folderTitle = folder.querySelector(".folder-title");
    if (folderTitle) folderTitle.textContent = folderData.title;
    if (folderData.collapsed) folder.classList.add("collapsed");

    const groupList = folder.querySelector(".group-list");
    groupList.innerHTML = "";

    folderData.groups.forEach(groupData => {
      const group = createParamGroup();
      const groupTitle = group.querySelector(".group-title");
      if (groupTitle) groupTitle.textContent = groupData.title;
      if (groupData.collapsed) group.classList.add("collapsed");
      if (groupData.locked) group.classList.add("locked");

      const paramList = group.querySelector(".param-list");
      paramList.innerHTML = "";

      groupData.params.forEach(paramData => {
        const param = createParamItem();
        const select = param.querySelector(".param-name");
        const value = param.querySelector(".param-value");
        const slider = param.querySelector(".param-slider");

        if (select) select.value = paramData.id;
        if (value) value.value = paramData.value;
        if (slider) slider.value = paramData.value;
        if (paramData.locked) param.classList.add("locked");

        paramList.appendChild(param);
        bindParamEvents(param);
      });

      const addBtn = document.createElement("button");
      addBtn.className = "btn add-param";
      addBtn.textContent = BUTTON_LABELS.addParam;
      paramList.appendChild(addBtn);

      groupList.appendChild(group);
      bindGroupEvents(group);
      bindAllAddButtons(group);
    });

    appBlock.appendChild(folder);
    container.appendChild(appBlock);

    bindFolderEvents(folder);
    bindAllAddButtons(folder);
  });
}

export function toggleCollapse(container, collapsedClass = "collapsed", toggleBtn, labelExpand = "▶", labelCollapse = "▼") {
  container.classList.toggle(collapsedClass);
  if (toggleBtn) {
    toggleBtn.textContent = container.classList.contains(collapsedClass) ? labelExpand : labelCollapse;
  }
}

export function moveUp(element, selector) {
  const prev = element.previousElementSibling;
  if (prev?.matches(selector)) {
    element.parentNode.insertBefore(element, prev);
    console.log("🔼 moved up:", element);
  } else {
    console.log("🚫 cannot move up");
  }
}

export function moveDown(element, selector) {
  const next = element.nextElementSibling;
  if (next?.matches(selector)) {
    element.parentNode.insertBefore(next, element);
    console.log("🔽 moved down:", element);
  } else {
    console.log("🚫 cannot move down");
  }
}


export function updateParamLockVisuals(group) {
  const locked = group.classList.contains("locked");
  const paramItems = group.querySelectorAll(".param-item");
  paramItems.forEach(item => {
    item.classList.toggle("parent-locked", locked);
  });
}

export function setCollapseState(target, collapsedClass, button, isCollapsed, labelExpand, labelCollapse) {
  if (isCollapsed) {
    target.classList.add(collapsedClass);
    button.textContent = labelExpand;
  } else {
    target.classList.remove(collapsedClass);
    button.textContent = labelCollapse;
  }
}

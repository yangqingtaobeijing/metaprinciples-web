const STORAGE_KEY = "metaprinciples.v1";

const dimensions = ["全部", "工作", "生活", "健康", "家庭关系"];

const seedPrinciples = [
  {
    id: "seed-work-energy",
    dimension: "工作",
    title: "能量先于效率",
    statement: "先保护深度工作的能量，再谈工具和流程优化。",
    why: "复杂工作真正稀缺的是稳定注意力，不是待办数量。",
    signals: "连续切换任务、会议后迟迟无法开始、用整理工具替代产出。",
    antiPattern: "把日程填满，用忙碌证明价值，却没有交付关键成果。",
    actionPrompt: "先锁定一段 90 分钟无打扰时间，只推进最重要的问题。",
    cadence: "每周",
    priority: 5,
    lastReviewedAt: "2026-04-01",
    reviewNotes: "本周需要减少上午的即时消息打断。",
    status: "active"
  },
  {
    id: "seed-life-default",
    dimension: "生活",
    title: "默认值决定人生走向",
    statement: "与其依赖意志力，不如设计让正确选择自动发生的环境。",
    why: "大多数行为来自默认路径，环境摩擦比临时决心更稳定。",
    signals: "同一个问题反复出现，靠提醒和自责仍然失败。",
    antiPattern: "只写目标，不改变触发行为的环境。",
    actionPrompt: "移除一个坏默认，增加一个好默认。",
    cadence: "每月",
    priority: 4,
    lastReviewedAt: "2026-03-18",
    reviewNotes: "",
    status: "active"
  },
  {
    id: "seed-health-sleep",
    dimension: "健康",
    title: "睡眠是底层预算",
    statement: "任何计划都不能长期透支睡眠来换取表面进度。",
    why: "判断力、情绪稳定和身体恢复都建立在睡眠上。",
    signals: "晚上继续硬撑、白天靠咖啡补偿、运动意愿明显下降。",
    antiPattern: "把熬夜当成努力，把第二天的低效当成意志不够。",
    actionPrompt: "今晚先确定停止工作时间，再安排睡前 30 分钟降噪。",
    cadence: "每周",
    priority: 5,
    lastReviewedAt: "2026-03-30",
    reviewNotes: "",
    status: "active"
  },
  {
    id: "seed-family-listen",
    dimension: "家庭关系",
    title: "先理解，再修正",
    statement: "亲密关系中的第一反应应该是确认对方感受，而不是立刻给方案。",
    why: "关系先需要安全感，问题解决才有空间。",
    signals: "对方表达委屈、自己急着解释、沟通开始变成辩论。",
    antiPattern: "用讲道理替代倾听，让对方感到被审判。",
    actionPrompt: "先复述对方的感受，再问：你现在更需要我听，还是一起想办法？",
    cadence: "每两周",
    priority: 5,
    lastReviewedAt: "2026-03-12",
    reviewNotes: "",
    status: "active"
  }
];

let principles = loadPrinciples();
let selectedDimension = "全部";
let editingReviewId = null;

const elements = {
  activeCount: document.querySelector("#activeCount"),
  antiPatternInput: document.querySelector("#antiPatternInput"),
  cancelEditorButton: document.querySelector("#cancelEditorButton"),
  cadenceInput: document.querySelector("#cadenceInput"),
  cancelReviewButton: document.querySelector("#cancelReviewButton"),
  clearFormButton: document.querySelector("#clearFormButton"),
  closeEditorButton: document.querySelector("#closeEditorButton"),
  currentDimensionLabel: document.querySelector("#currentDimensionLabel"),
  dimensionInput: document.querySelector("#dimensionInput"),
  dimensionList: document.querySelector("#dimensionList"),
  editorDialog: document.querySelector("#editorDialog"),
  editorTitle: document.querySelector("#editorTitle"),
  emptyState: document.querySelector("#emptyState"),
  exportButton: document.querySelector("#exportButton"),
  focusReviewButton: document.querySelector("#focusReviewButton"),
  focusText: document.querySelector("#focusText"),
  newButton: document.querySelector("#newButton"),
  principleForm: document.querySelector("#principleForm"),
  principleGrid: document.querySelector("#principleGrid"),
  principleId: document.querySelector("#principleId"),
  priorityInput: document.querySelector("#priorityInput"),
  resetButton: document.querySelector("#resetButton"),
  reviewDialog: document.querySelector("#reviewDialog"),
  reviewDialogStatement: document.querySelector("#reviewDialogStatement"),
  reviewDialogTitle: document.querySelector("#reviewDialogTitle"),
  reviewForm: document.querySelector("#reviewForm"),
  reviewNotesInput: document.querySelector("#reviewNotesInput"),
  searchInput: document.querySelector("#searchInput"),
  signalsInput: document.querySelector("#signalsInput"),
  sortSelect: document.querySelector("#sortSelect"),
  statementInput: document.querySelector("#statementInput"),
  statusInput: document.querySelector("#statusInput"),
  titleInput: document.querySelector("#titleInput"),
  toast: document.querySelector("#toast"),
  totalCount: document.querySelector("#totalCount"),
  whyInput: document.querySelector("#whyInput"),
  actionPromptInput: document.querySelector("#actionPromptInput")
};

function loadPrinciples() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return structuredClone(seedPrinciples);
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : structuredClone(seedPrinciples);
  } catch {
    return structuredClone(seedPrinciples);
  }
}

function savePrinciples() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(principles));
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function daysSince(dateString) {
  if (!dateString) return 9999;

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 9999;

  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

function dimensionClass(dimension) {
  return {
    工作: "work",
    生活: "life",
    健康: "health",
    家庭关系: "family"
  }[dimension] || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function filteredPrinciples() {
  const query = elements.searchInput.value.trim().toLowerCase();

  return principles.filter((principle) => {
    const matchesDimension = selectedDimension === "全部" || principle.dimension === selectedDimension;
    const haystack = [
      principle.title,
      principle.statement,
      principle.why,
      principle.signals,
      principle.antiPattern,
      principle.actionPrompt
    ]
      .join(" ")
      .toLowerCase();

    return matchesDimension && (!query || haystack.includes(query));
  });
}

function sortedPrinciples(items) {
  const sortMode = elements.sortSelect.value;
  const copy = [...items];

  if (sortMode === "review") {
    return copy.sort((a, b) => daysSince(b.lastReviewedAt) - daysSince(a.lastReviewedAt));
  }

  if (sortMode === "dimension") {
    return copy.sort((a, b) => a.dimension.localeCompare(b.dimension, "zh-CN") || b.priority - a.priority);
  }

  return copy.sort((a, b) => b.priority - a.priority || daysSince(b.lastReviewedAt) - daysSince(a.lastReviewedAt));
}

function renderDimensions() {
  const counts = principles.reduce(
    (acc, principle) => {
      acc["全部"] += 1;
      acc[principle.dimension] = (acc[principle.dimension] || 0) + 1;
      return acc;
    },
    { 全部: 0 }
  );

  elements.dimensionList.innerHTML = dimensions
    .map((dimension) => {
      const selected = dimension === selectedDimension;
      return `
        <button class="dimension-tab" type="button" role="tab" aria-selected="${selected}" data-dimension="${dimension}">
          <span>${dimension}</span>
          <span class="dimension-count">${counts[dimension] || 0}</span>
        </button>
      `;
    })
    .join("");
}

function renderMetrics() {
  elements.totalCount.textContent = principles.length;
  elements.activeCount.textContent = principles.filter((principle) => principle.status === "active").length;
}

function renderFocus() {
  const focus = [...principles]
    .filter((principle) => principle.status === "active")
    .sort((a, b) => daysSince(b.lastReviewedAt) - daysSince(a.lastReviewedAt) || b.priority - a.priority)[0];

  if (!focus) {
    elements.focusText.textContent = "暂无需要复盘的原则。";
    elements.focusReviewButton.disabled = true;
    elements.focusReviewButton.dataset.id = "";
    return;
  }

  const lastReviewText = focus.lastReviewedAt ? `${daysSince(focus.lastReviewedAt)} 天未复盘` : "从未复盘";
  elements.focusText.textContent = `${focus.title}：${focus.statement}（${lastReviewText}）`;
  elements.focusReviewButton.disabled = false;
  elements.focusReviewButton.dataset.id = focus.id;
}

function renderPrinciples() {
  const items = sortedPrinciples(filteredPrinciples());
  elements.currentDimensionLabel.textContent = selectedDimension === "全部" ? "全部维度" : selectedDimension;
  elements.emptyState.hidden = items.length > 0;

  elements.principleGrid.innerHTML = items
    .map((principle) => {
      const reviewedText = principle.lastReviewedAt
        ? `${principle.lastReviewedAt}，${daysSince(principle.lastReviewedAt)} 天前`
        : "尚未复盘";
      const notes = principle.reviewNotes
        ? `<div class="detail-block"><strong>最近复盘</strong><p>${escapeHtml(principle.reviewNotes)}</p></div>`
        : "";

      return `
        <article class="principle-card ${principle.status === "paused" ? "paused" : ""}">
          <div class="card-kicker">
            <span class="pill ${dimensionClass(principle.dimension)}">${escapeHtml(principle.dimension)}</span>
            <span class="pill">优先级 ${escapeHtml(principle.priority)}</span>
            <span class="pill">${principle.status === "active" ? "正在使用" : "暂存观察"}</span>
          </div>
          <h3>${escapeHtml(principle.title)}</h3>
          <p class="statement">${escapeHtml(principle.statement)}</p>
          <div class="detail-block">
            <strong>底层原因</strong>
            <p>${escapeHtml(principle.why || "尚未记录")}</p>
          </div>
          <div class="detail-block">
            <strong>调用信号</strong>
            <p>${escapeHtml(principle.signals || "尚未记录")}</p>
          </div>
          <div class="detail-block">
            <strong>反例</strong>
            <p>${escapeHtml(principle.antiPattern || "尚未记录")}</p>
          </div>
          ${notes}
          <div class="card-meta">
            <span>${escapeHtml(principle.cadence || "按需")}</span>
            <span>${reviewedText}</span>
          </div>
          <div class="card-actions">
            <button class="icon-button" type="button" data-action="edit" data-id="${principle.id}">编辑</button>
            <button class="icon-button" type="button" data-action="review" data-id="${principle.id}">复盘</button>
            <button class="icon-button warn" type="button" data-action="delete" data-id="${principle.id}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function render() {
  renderDimensions();
  renderMetrics();
  renderFocus();
  renderPrinciples();
}

function clearForm() {
  elements.principleForm.reset();
  elements.principleId.value = "";
  elements.editorTitle.textContent = "新增原则";
  elements.priorityInput.value = "5";
  elements.statusInput.value = "active";
  elements.cadenceInput.value = "每周";
}

function openEditor() {
  if (!elements.editorDialog.open) {
    elements.editorDialog.showModal();
  }

  requestAnimationFrame(() => {
    elements.titleInput.focus();
  });
}

function closeEditor() {
  elements.editorDialog.close();
  clearForm();
}

function fillForm(principle) {
  elements.principleId.value = principle.id;
  elements.dimensionInput.value = principle.dimension;
  elements.titleInput.value = principle.title;
  elements.statementInput.value = principle.statement;
  elements.whyInput.value = principle.why || "";
  elements.signalsInput.value = principle.signals || "";
  elements.antiPatternInput.value = principle.antiPattern || "";
  elements.actionPromptInput.value = principle.actionPrompt || "";
  elements.cadenceInput.value = principle.cadence || "每周";
  elements.priorityInput.value = String(principle.priority || 3);
  elements.statusInput.value = principle.status || "active";
  elements.editorTitle.textContent = "编辑原则";
  openEditor();
}

function formToPrinciple(existing) {
  return {
    id: elements.principleId.value || crypto.randomUUID(),
    dimension: elements.dimensionInput.value,
    title: elements.titleInput.value.trim(),
    statement: elements.statementInput.value.trim(),
    why: elements.whyInput.value.trim(),
    signals: elements.signalsInput.value.trim(),
    antiPattern: elements.antiPatternInput.value.trim(),
    actionPrompt: elements.actionPromptInput.value.trim(),
    cadence: elements.cadenceInput.value,
    priority: Number(elements.priorityInput.value),
    lastReviewedAt: existing?.lastReviewedAt || "",
    reviewNotes: existing?.reviewNotes || "",
    status: elements.statusInput.value
  };
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    elements.toast.classList.remove("visible");
  }, 2200);
}

function openReview(id) {
  const principle = principles.find((item) => item.id === id);
  if (!principle) return;

  editingReviewId = id;
  elements.reviewDialogTitle.textContent = principle.title;
  elements.reviewDialogStatement.textContent = principle.statement;
  elements.reviewNotesInput.value = principle.reviewNotes || "";
  elements.reviewDialog.showModal();
  elements.reviewNotesInput.focus();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(principles, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `metaprinciples-${getToday()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("已导出 JSON");
}

elements.dimensionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-dimension]");
  if (!button) return;

  selectedDimension = button.dataset.dimension;
  render();
});

elements.principleGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  const principle = principles.find((item) => item.id === id);
  if (!principle) return;

  if (action === "edit") {
    fillForm(principle);
  }

  if (action === "review") {
    openReview(id);
  }

  if (action === "delete") {
    const shouldDelete = window.confirm(`确定删除「${principle.title}」吗？`);
    if (!shouldDelete) return;

    principles = principles.filter((item) => item.id !== id);
    savePrinciples();
    render();
    showToast("已删除原则");
  }
});

elements.principleForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const existing = principles.find((item) => item.id === elements.principleId.value);
  const nextPrinciple = formToPrinciple(existing);

  if (existing) {
    principles = principles.map((item) => (item.id === existing.id ? nextPrinciple : item));
    showToast("已更新原则");
  } else {
    principles = [nextPrinciple, ...principles];
    selectedDimension = "全部";
    showToast("已新增原则");
  }

  savePrinciples();
  clearForm();
  elements.editorDialog.close();
  render();
});

elements.reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!editingReviewId) return;

  principles = principles.map((principle) => {
    if (principle.id !== editingReviewId) return principle;

    return {
      ...principle,
      lastReviewedAt: getToday(),
      reviewNotes: elements.reviewNotesInput.value.trim()
    };
  });

  savePrinciples();
  elements.reviewDialog.close();
  editingReviewId = null;
  render();
  showToast("已完成复盘");
});

elements.cancelReviewButton.addEventListener("click", () => {
  elements.reviewDialog.close();
  editingReviewId = null;
});

elements.clearFormButton.addEventListener("click", clearForm);
elements.closeEditorButton.addEventListener("click", closeEditor);
elements.cancelEditorButton.addEventListener("click", closeEditor);
elements.newButton.addEventListener("click", () => {
  clearForm();
  openEditor();
});
elements.searchInput.addEventListener("input", renderPrinciples);
elements.sortSelect.addEventListener("change", renderPrinciples);
elements.focusReviewButton.addEventListener("click", () => openReview(elements.focusReviewButton.dataset.id));
elements.exportButton.addEventListener("click", exportJson);
elements.resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("恢复示例数据会覆盖当前本地原则，确定继续吗？");
  if (!shouldReset) return;

  principles = structuredClone(seedPrinciples);
  selectedDimension = "全部";
  savePrinciples();
  clearForm();
  render();
  showToast("已恢复示例数据");
});

clearForm();
savePrinciples();
render();

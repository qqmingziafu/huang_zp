const titles = {
  dashboard: "首页",
  workspace: "客服中心",
  ai: "AI中心",
  tickets: "工单中心",
  customers: "客户中心",
  growth: "运营增长",
  analytics: "数据分析",
  settings: "系统设置",
};

const startupSplash = document.querySelector("#startup-splash");
if (startupSplash) {
  window.addEventListener("load", () => {
    const authedProvider = new URLSearchParams(window.location.search).get("auth");
    if (authedProvider) {
      startupSplash.remove();
      showApp();
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }
    window.setTimeout(() => {
      startupSplash.classList.add("is-fading");
      window.setTimeout(() => startupSplash.remove(), 760);
    }, 4200);
  });
}

const conversationsByStatus = {
  waiting: [
    { id: "U10086", tag: "VIP", text: "课程退费问题，已购课程未开始", wait: "排队中 00:01:32" },
    { id: "U10023", tag: "新客", text: "如何修改上课时间？", wait: "排队中 00:02:15" },
    { id: "U10058", tag: "风险", text: "课程有效期是多久？", wait: "排队中 00:03:45" },
  ],
  active: [
    { id: "U20018", tag: "售后", text: "退款凭证已提交，等待财务确认", wait: "进行中 12:20" },
    { id: "U20025", tag: "课程", text: "正在确认换课时间", wait: "进行中 08:46" },
    { id: "U20031", tag: "技术", text: "APP登录异常，已收集设备信息", wait: "进行中 05:18" },
    { id: "U20039", tag: "转化", text: "优惠活动咨询，等待报名确认", wait: "进行中 03:02" },
  ],
  closed: [
    { id: "U30011", tag: "已解决", text: "退款说明已确认，用户5星评价", wait: "已结束 10:42" },
    { id: "U30026", tag: "已建单", text: "技术问题已转工单处理", wait: "已结束 09:15" },
    { id: "U30049", tag: "已转接", text: "课程顾问已完成后续跟进", wait: "已结束 08:30" },
  ],
};

const initialMessages = [
  { role: "user", text: "我想申请退课，买的Python入门课还没开始学，可以退费吗？" },
  { role: "agent", text: "您好，已收到您的退课申请。我先为您核实课程订单情况，请稍等。" },
  { role: "user", text: "好的，谢谢。" },
];

let waitingCount = 3;
let activeCount = 8;
let currentConversationStatus = "waiting";
const currentConversationId = "U10086";
let aiTransferCreated = false;

const knowledgeRows = [
  ["退款流程复杂，如何退费？", "退款问题", "高频未解决", "建议补充3条知识", "待审核"],
  ["课程有效期多久？", "课程咨询", "命中偏低", "拆分课程类型", "待审核"],
  ["发票如何申请？", "售后服务", "表达不完整", "补充企业开票规则", "待审核"],
  ["如何更换上课时间？", "教务安排", "转人工较高", "优化话术", "待审核"],
];

const ticketRows = [
  ["TK20240521001", "退款未到账问题", "高", "售后组", "处理中"],
  ["TK20240521002", "APP登录异常", "高", "技术支持", "待处理"],
  ["TK20240521003", "发票信息修改", "中", "财务组", "已完成"],
  ["TK20240521004", "课程有效期争议", "中", "教务组", "超时预警"],
];

const notificationItems = [
  { type: "预警", title: "转人工率异常升高", detail: "APP渠道较昨日升高 15%，建议检查知识库命中率。", unread: true },
  { type: "工单", title: "退款未到账问题待处理", detail: "TK20240521001 已进入售后组，SLA剩余 2小时。", unread: true },
  { type: "会话", title: "VIP用户等待接入", detail: "U10086 已排队 1分32秒，推荐张伟接入。", unread: true },
  { type: "系统", title: "知识库同步完成", detail: "新增 12 条退款规则知识，等待运营审核。", unread: true },
];

const searchDocuments = [
  ...Object.values(conversationsByStatus).flat().map((item) => ({ type: "会话", title: item.id, detail: `${item.tag} · ${item.text} · ${item.wait}` })),
  ...ticketRows.map((row) => ({ type: "工单", title: row[0], detail: `${row[1]} · ${row[2]}优先级 · ${row[3]} · ${row[4]}` })),
  { type: "客户", title: "张女士", detail: "VIP用户 · 138****8888 · 退款问题 · 已购课程" },
  { type: "知识", title: "退款流程复杂，如何退费？", detail: "高频未解决问题 · 建议补充3条知识" },
  { type: "模块", title: "客服中心", detail: "会话接入、AI摘要、用户画像、结束会话打标签" },
  { type: "模块", title: "工单中心", detail: "识别问题、创建工单、分配处理、用户确认、关闭沉淀" },
];

const ticketSteps = [
  {
    title: "识别问题",
    role: "客服人员 / AI识别",
    status: "复杂问题已识别",
    action: "AI识别到用户多次追问退款到账时间，判定当前会话无法即时解决，建议创建工单。",
    kind: "identify",
    button: "确认识别并建单",
  },
  {
    title: "创建工单",
    role: "客服人员 / 系统",
    status: "工单信息待提交",
    action: "系统已从会话中提取标题、用户、订单号、附件和AI摘要，客服只需补充优先级后提交。",
    kind: "create",
    button: "提交工单",
  },
  {
    title: "分配处理人",
    role: "系统 / 管理员",
    status: "智能分配处理中",
    action: "系统根据技能组、负载、优先级推荐售后组张伟处理，并支持管理员手动调整。",
    kind: "assign",
    button: "确认分配",
  },
  {
    title: "问题处理与协同",
    role: "相关业务人员",
    status: "跨部门协同中",
    action: "售后、财务和客服在工单内同步处理进展，所有评论与操作记录自动沉淀。",
    kind: "collaborate",
    button: "更新协同进展",
  },
  {
    title: "处理结果回填",
    role: "处理人",
    status: "处理结果待回填",
    action: "处理人填写解决方案、处理方式、附件和处理时间，结果将同步给客服与用户。",
    kind: "result",
    button: "提交处理结果",
  },
  {
    title: "用户通知与确认",
    role: "系统 / 客服",
    status: "等待用户确认",
    action: "系统通过站内信、短信、邮件和微信通知用户处理结果，并收集用户确认反馈。",
    kind: "notify",
    button: "发送通知",
  },
  {
    title: "工单关闭",
    role: "系统",
    status: "工单已关闭",
    action: "用户确认后工单自动关闭，满意度与案例内容回流数据分析和知识库优化。",
    kind: "close",
    button: "关闭并沉淀知识",
  },
];

const ticketState = {
  title: "退款未到账问题",
  status: "复杂问题已识别",
  timeline: ["AI识别：用户多轮咨询退款仍未解决，建议创建工单"],
  drafts: {},
  created: false,
  closed: false,
};

function showTicketSuccessModal(title = "提交成功", desc = "操作已完成，系统已同步更新处理记录。") {
  const successModal = document.querySelector("#ticket-success-modal");
  if (!successModal) return;
  document.querySelector("#ticket-success-title").textContent = title;
  document.querySelector("#ticket-success-desc").textContent = desc;
  successModal.showModal();
}

function updateCurrentTicketStatus(status) {
  const row = ticketRows.find((item) => item[1] === ticketState.title) || ticketRows[0];
  if (!row) return;
  row[4] = status;
  renderTable("#ticket-table", ["工单号", "标题", "优先级", "处理组", "状态"], ticketRows);
}

function showApp() {
  document.querySelector("#login-screen").classList.add("is-hidden");
  document.querySelector("#app-shell").classList.remove("is-hidden");
}

function showLogin() {
  document.querySelector("#app-shell").classList.add("is-hidden");
  document.querySelector("#login-screen").classList.remove("is-hidden");
}

function switchView(viewId) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
  document.querySelector("#page-title").textContent = titles[viewId];
}

function updateConversationCounts() {
  waitingCount = conversationsByStatus.waiting.length;
  activeCount = conversationsByStatus.active.length;
  document.querySelector("#waiting-count").textContent = waitingCount;
  document.querySelector("#active-count").textContent = activeCount;
}

function setConversationTab(status) {
  currentConversationStatus = status;
  document.querySelectorAll("[data-conversation-status]").forEach((item) => {
    item.classList.toggle("active", item.dataset.conversationStatus === status);
  });
  renderConversations(status);
}

function moveConversation(fromStatus, toStatus, patch = {}) {
  const source = conversationsByStatus[fromStatus];
  const index = source.findIndex((item) => item.id === currentConversationId);
  if (index === -1) return;
  const [item] = source.splice(index, 1);
  conversationsByStatus[toStatus].unshift({ ...item, ...patch });
  updateConversationCounts();
  setConversationTab(toStatus);
}

function renderConversations(status = currentConversationStatus) {
  const root = document.querySelector("#conversation-items");
  root.innerHTML = conversationsByStatus[status]
    .map(
      (item, index) => `
        <div class="conversation-item ${index === 0 ? "active" : ""}">
          <strong>${item.id}<span>${item.tag}</span></strong>
          <span>${item.text}</span>
          <span>${item.wait}</span>
        </div>
      `,
    )
    .join("");
  if (!root.innerHTML) {
    root.innerHTML = `<div class="empty-result">当前没有${status === "waiting" ? "待接入" : status === "active" ? "进行中" : "已结束"}会话</div>`;
  }
}

function renderMessages() {
  const root = document.querySelector("#messages");
  root.innerHTML = initialMessages
    .map((message) => `<div class="message ${message.role === "agent" ? "agent" : ""}">${message.text}</div>`)
    .join("");
  root.scrollTop = root.scrollHeight;
}

function addAgentMessage(text) {
  if (!text.trim()) return;
  initialMessages.push({ role: "agent", text: text.trim() });
  renderMessages();
}

function renderTable(selector, headers, rows) {
  const root = document.querySelector(selector);
  root.innerHTML = [
    `<div class="table-row head">${headers.map((item) => `<span>${item}</span>`).join("")}</div>`,
    ...rows.map((row) => `<div class="table-row">${row.map((item) => `<span>${item}</span>`).join("")}</div>`),
  ].join("");
}

function renderNotifications() {
  const list = document.querySelector("#notify-list");
  const unreadCount = notificationItems.filter((item) => item.unread).length;
  document.querySelector("#notify-count").textContent = unreadCount;
  document.querySelector("#notify-count").classList.toggle("is-hidden", unreadCount === 0);
  list.innerHTML = notificationItems
    .map(
      (item, index) => `
        <button class="notify-item ${item.unread ? "unread" : ""}" data-notify-index="${index}">
          <strong>${item.type} · ${item.title}</strong>
          <span>${item.detail}</span>
        </button>
      `,
    )
    .join("");
  document.querySelectorAll("[data-notify-index]").forEach((button) => {
    button.addEventListener("click", () => {
      notificationItems[Number(button.dataset.notifyIndex)].unread = false;
      renderNotifications();
    });
  });
}

function renderSearchResults(keyword) {
  const panel = document.querySelector("#search-results");
  const term = keyword.trim().toLowerCase();
  if (!term) {
    panel.classList.add("is-hidden");
    panel.innerHTML = "";
    return;
  }
  const results = searchDocuments.filter((item) => `${item.type} ${item.title} ${item.detail}`.toLowerCase().includes(term)).slice(0, 8);
  panel.classList.remove("is-hidden");
  panel.innerHTML = `
    <div class="panel-head"><h2>搜索结果</h2><span>${results.length} 条</span></div>
    ${
      results.length
        ? results.map((item) => `<button class="search-result-item"><strong>${item.type} · ${item.title}</strong><span>${item.detail}</span></button>`).join("")
        : `<div class="empty-result">没有找到与“${keyword}”相关的会话、客户或工单</div>`
    }
  `;
}

function getTicketStepBody(kind) {
  const templates = {
    identify: `
      <div class="decision-card">
        <strong>AI判断卡片：建议创建工单</strong>
        <p>用户连续 3 轮追问退款到账时间，知识库命中但未解决；情绪从中性变为焦急，复杂度评分 86/100。</p>
        <div class="ticket-fields">
          <div>问题类型：退款问题</div>
          <div>未解决原因：多轮沟通仍需后台核实</div>
          <div>建议动作：创建退款跟进工单</div>
        </div>
      </div>
    `,
    create: `
      <form class="ticket-form" id="ticket-create-form">
        <label>工单标题<input id="ticket-title-input" required value="退款未到账问题" /></label>
        <label>来源渠道<select id="ticket-source-input" required><option>智能客服会话</option><option>APP用户提交</option><option>客服手动创建</option></select></label>
        <label>优先级<select id="ticket-priority-input" required><option>高</option><option>中</option><option>低</option></select></label>
        <label class="span-2">问题描述<textarea id="ticket-desc-input" required>用户申请课程退款，订单已支付，课程未开始，要求确认退款到账时间。</textarea></label>
        <label>附件<input id="ticket-attach-input" value="订单截图.png" /></label>
      </form>
    `,
    assign: `
      <div class="assignee-grid">
        <label class="assignee-card active"><input type="radio" name="assignee" checked /><strong>张伟</strong><span>售后组 · 退款专员 · 负载 30%</span></label>
        <label class="assignee-card"><input type="radio" name="assignee" /><strong>李娜</strong><span>售后组 · 投诉处理 · 负载 50%</span></label>
        <label class="assignee-card"><input type="radio" name="assignee" /><strong>王强</strong><span>教务组 · 课程问题 · 负载 80%</span></label>
      </div>
      <div class="ticket-fields">
        <div>技能组：退款专员</div>
        <div>SLA：4小时内响应</div>
        <div>分配策略：高优先级 + 低负载</div>
      </div>
    `,
    collaborate: `
      <div class="collab-layout">
        <div class="comment-list">
          <article><strong>张伟 · 售后</strong><span>已核实用户订单，符合退款条件。</span></article>
          <article><strong>财务专员</strong><span>退款已提交，预计 1-3 个工作日到账。</span></article>
          <article><strong>客服人员</strong><span>@张伟 请同步最终处理结果，便于回访用户。</span></article>
        </div>
        <label>新增内部评论<textarea id="ticket-comment-input">已与财务确认退款批次，等待支付渠道回执。</textarea></label>
      </div>
    `,
    result: `
      <form class="ticket-form" id="ticket-result-form">
        <label>处理方式<select id="ticket-result-type" required><option>已退款</option><option>补偿优惠券</option><option>转技术处理</option></select></label>
        <label>处理人<input required value="张伟" /></label>
        <label>处理时间<input required value="2026-05-06 18:30" /></label>
        <label class="span-2">处理说明<textarea id="ticket-result-desc" required>用户退款申请已审核通过，全额 ¥299 已发起，预计 1-3 个工作日到账。</textarea></label>
        <label>结果附件<input value="退款凭证.pdf" /></label>
      </form>
    `,
    notify: `
      <div class="notify-grid">
        <label><input type="checkbox" checked /> 站内信</label>
        <label><input type="checkbox" checked /> 短信</label>
        <label><input type="checkbox" checked /> 邮件</label>
        <label><input type="checkbox" checked /> 微信</label>
      </div>
      <label class="full-label">通知内容<textarea id="ticket-notify-content">尊敬的用户您好，您的退款问题已处理完成，退款金额 ¥299 已发起，预计 1-3 个工作日到账。如有疑问，请联系在线客服。</textarea></label>
      <div class="confirm-actions">
        <button class="primary-btn" id="user-confirm-resolved" type="button">模拟用户确认已解决</button>
        <button class="danger-btn" id="user-confirm-unresolved" type="button">模拟用户反馈未解决</button>
      </div>
    `,
    close: `
      <form class="ticket-form" id="ticket-close-form">
        <label>关闭原因<select id="ticket-close-reason" required><option>用户确认解决</option><option>客服确认关闭</option><option>重复工单合并</option></select></label>
        <label>满意度<select id="ticket-close-score" required><option>5星</option><option>4星</option><option>3星</option></select></label>
        <label>知识库沉淀<select id="ticket-close-knowledge" required><option>生成退款标准案例</option><option>进入待审核知识建议</option><option>不沉淀</option></select></label>
        <label class="span-2">关闭备注<textarea id="ticket-close-note" required>本次问题已解决，处理过程和退款说明将进入知识库待审核队列，用于优化AI退款问答。</textarea></label>
      </form>
      <div class="ticket-fields">
        <div>关闭后状态：已关闭</div>
        <div>数据沉淀：同步至数据分析</div>
        <div>知识流转：进入知识库待审核</div>
      </div>
    `,
  };
  return templates[kind];
}

function completeTicketStep(activeIndex) {
  const step = ticketSteps[activeIndex];

  if (step.kind === "close" && ticketState.closed) {
    showTicketSuccessModal("工单已关闭", "当前工单已经关闭并完成知识沉淀，无需重复提交。");
    return activeIndex;
  }

  if (step.kind === "close") {
    const noteInput = document.querySelector("#ticket-close-note");
    if (!noteInput.value.trim()) {
      document.querySelector("#ticket-form-error").textContent = "请填写关闭备注后再关闭工单。";
      return activeIndex;
    }
  }

  if (step.kind === "create") {
    const titleInput = document.querySelector("#ticket-title-input");
    const descInput = document.querySelector("#ticket-desc-input");
    if (!titleInput.value.trim() || !descInput.value.trim()) {
      document.querySelector("#ticket-form-error").textContent = "请填写工单标题和问题描述后再提交。";
      return activeIndex;
    }
    ticketState.title = titleInput.value.trim();
    if (!ticketState.created) {
      ticketRows.unshift(["TK20260506001", ticketState.title, document.querySelector("#ticket-priority-input").value, "售后组", "待分配"]);
      ticketState.created = true;
    }
    renderTable("#ticket-table", ["工单号", "标题", "优先级", "处理组", "状态"], ticketRows);
    showTicketSuccessModal("提交工单成功", "工单已创建并进入待分配列表，可在工单列表中继续跟进处理进度。");
  }

  const timelineText = {
    identify: "AI判断：复杂退款问题已识别，建议转入工单闭环",
    create: "创建工单：表单校验通过，工单已追加到列表",
    assign: "分配处理人：已确认张伟负责，SLA 4小时内响应",
    collaborate: "协同处理：内部评论已更新，处理记录已留痕",
    result: "结果回填：退款方案、凭证和处理时间已提交",
    notify: "用户通知：站内信、短信、邮件和微信已发送，用户确认已解决",
    close: "工单关闭：满意度5星，案例进入知识库待审核",
  }[step.kind];

  ticketState.status = step.status;
  ticketState.timeline.push(timelineText);
  if (step.kind === "identify") {
    ticketState.status = "复杂问题已识别 · 待创建工单";
    showTicketSuccessModal("问题识别完成", "AI已识别当前会话无法即时解决，建议进入创建工单步骤。");
  }
  if (step.kind === "assign") {
    ticketState.status = "已分配 · 张伟";
    updateCurrentTicketStatus("处理中");
    showTicketSuccessModal("分配处理人成功", "工单已分配给张伟，SLA 4小时内响应，后续可进入协同处理。");
  }
  if (step.kind === "collaborate") {
    ticketState.status = "协同处理中 · 已更新";
    updateCurrentTicketStatus("协同处理中");
    showTicketSuccessModal("协同进展已更新", "内部评论和跨部门处理记录已保存，售后与财务处理信息已留痕。");
  }
  if (step.kind === "result") {
    ticketState.status = "处理结果已回填";
    updateCurrentTicketStatus("待通知用户");
    showTicketSuccessModal("提交处理结果成功", "处理结果已回填到当前工单，客服和用户通知流程可以继续推进。");
  }
  if (step.kind === "notify") {
    ticketState.status = "已通知用户 · 待确认";
    updateCurrentTicketStatus("待用户确认");
    showTicketSuccessModal("发送通知成功", "处理结果已通过选中的通知渠道发送给用户，可等待用户确认反馈。");
  }
  if (step.kind === "close") {
    const knowledgeSelect = document.querySelector("#ticket-close-knowledge");
    const scoreSelect = document.querySelector("#ticket-close-score");
    ticketState.closed = true;
    ticketState.status = "已关闭 · 知识已沉淀";
    updateCurrentTicketStatus("已关闭");
    knowledgeRows.unshift(["退款到账时间如何说明？", "退款问题", "工单沉淀", "补充退款到账时效与通知话术", "待审核"]);
    renderTable("#knowledge-table", ["问题", "分类", "数据状态", "优化建议", "状态"], knowledgeRows);
    showTicketSuccessModal("工单关闭成功", `工单已关闭，满意度为${scoreSelect.value}，知识沉淀方式：${knowledgeSelect.value}。`);
  }
  return Math.min(activeIndex + 1, ticketSteps.length - 1);
}

function saveTicketDraft(activeIndex) {
  const step = ticketSteps[activeIndex];
  const draftText = {
    identify: "草稿已保存：AI识别判断卡片已保留",
    create: "草稿已保存：工单标题、来源、优先级、描述和附件已保留",
    assign: "草稿已保存：处理人推荐和SLA策略已保留",
    collaborate: "草稿已保存：内部评论和协同记录已保留",
    result: "草稿已保存：处理方式、说明和附件已保留",
    notify: "草稿已保存：通知渠道和通知文案已保留",
    close: "草稿已保存：关闭原因、满意度和知识沉淀设置已保留",
  }[step.kind];

  ticketState.drafts[activeIndex] = true;
  ticketState.status = `${step.title}草稿已保存`;
  ticketState.timeline[activeIndex] = draftText;
  document.querySelector("#ticket-status-text").textContent = ticketState.status;
  document.querySelector("#ticket-form-error").textContent = draftText;
  document.querySelector("#ticket-timeline").innerHTML = ticketSteps
    .map((item, index) => `<li class="${index <= activeIndex ? "done" : ""}">${item.title}<span>${ticketState.timeline[index] || "待处理"}</span></li>`)
    .join("");
}

function renderTicketStep(activeIndex = 0) {
  const stepsRoot = document.querySelector("#ticket-steps");
  const actionRoot = document.querySelector("#ticket-action");
  const timelineRoot = document.querySelector("#ticket-timeline");
  const statusRoot = document.querySelector("#ticket-status-text");
  const titleRoot = document.querySelector("#ticket-current-title");
  const activeStep = ticketSteps[activeIndex];

  stepsRoot.innerHTML = ticketSteps
    .map(
      (step, index) => `
        <button class="ticket-step ${index === activeIndex ? "active" : ""}" data-ticket-step="${index}">
          <b>${index + 1}</b>
          <strong>${step.title}</strong>
          <span>${step.role}</span>
        </button>
      `,
    )
    .join("");

  actionRoot.innerHTML = `
    <div class="ticket-action-head">
      <span>步骤 ${activeIndex + 1}</span>
      <h2>${activeStep.title}</h2>
      <p>${activeStep.action}</p>
    </div>
    ${getTicketStepBody(activeStep.kind)}
    <p class="form-error" id="ticket-form-error"></p>
    <div class="ticket-actions">
      <button id="ticket-save-draft" type="button">保存草稿</button>
      <button class="primary-btn" id="ticket-next-step">${activeStep.button}</button>
    </div>
  `;

  timelineRoot.innerHTML = ticketSteps
    .map((step, index) => `<li class="${index <= activeIndex ? "done" : ""}">${step.title}<span>${ticketState.timeline[index] || "待处理"}</span></li>`)
    .join("");

  statusRoot.textContent = ticketState.status || activeStep.status;
  titleRoot.textContent = ticketState.title;

  document.querySelectorAll("[data-ticket-step]").forEach((button) => {
    button.addEventListener("click", () => renderTicketStep(Number(button.dataset.ticketStep)));
  });

  document.querySelector("#ticket-next-step").addEventListener("click", () => {
    renderTicketStep(completeTicketStep(activeIndex));
  });

  document.querySelector("#ticket-save-draft").addEventListener("click", () => {
    saveTicketDraft(activeIndex);
  });

  document.querySelectorAll(".assignee-card input").forEach((input) => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".assignee-card").forEach((card) => card.classList.remove("active"));
      input.closest(".assignee-card").classList.add("active");
    });
  });

  const resolvedButton = document.querySelector("#user-confirm-resolved");
  const unresolvedButton = document.querySelector("#user-confirm-unresolved");
  if (resolvedButton) {
    resolvedButton.addEventListener("click", () => {
      ticketState.timeline.push("用户确认：已解决");
      ticketState.status = "用户已确认解决";
      statusRoot.textContent = ticketState.status;
      timelineRoot.insertAdjacentHTML("beforeend", `<li class="done">用户确认<span>用户确认已解决，可继续关闭工单</span></li>`);
      document.querySelector("#ticket-form-error").textContent = "用户已确认解决，可继续关闭工单。";
      showTicketSuccessModal("用户确认已记录", "用户已确认问题解决，当前工单可以进入关闭和知识沉淀步骤。");
    });
  }
  if (unresolvedButton) {
    unresolvedButton.addEventListener("click", () => {
      ticketState.timeline.push("用户反馈：未解决，工单需回退继续处理");
      ticketState.status = "用户反馈未解决";
      statusRoot.textContent = ticketState.status;
      updateCurrentTicketStatus("继续处理");
      timelineRoot.insertAdjacentHTML("beforeend", `<li class="done">用户反馈<span>用户反馈未解决，建议回到协同处理继续跟进</span></li>`);
      document.querySelector("#ticket-form-error").textContent = "用户反馈未解决，建议回到第4步继续协同处理。";
      showTicketSuccessModal("用户反馈已记录", "用户反馈未解决，工单状态已更新为继续处理。");
    });
  }
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => switchView(item.dataset.view));
});

document.querySelectorAll("[data-reply]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#reply-input").value = button.dataset.reply;
    document.querySelector("#reply-input").focus();
  });
});

document.querySelectorAll("[data-conversation-status]").forEach((button) => {
  button.addEventListener("click", () => {
    setConversationTab(button.dataset.conversationStatus);
  });
});

document.querySelectorAll(".route-card input").forEach((input) => {
  input.addEventListener("change", () => {
    const checkedRules = [...document.querySelectorAll(".route-card input:checked")].map((item) => item.parentElement.textContent.trim());
    const result = checkedRules.length
      ? `推荐：张伟 · 退款专员 · 当前负载30% · 已启用${checkedRules.join("、")}`
      : "推荐：张伟 · 退款专员 · 当前负载30% · 未启用附加策略";
    document.querySelector("#route-result").textContent = result;
    setAgentStep(1);
  });
});

document.querySelector("#reply-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#reply-input");
  addAgentMessage(input.value);
  input.value = "";
  setAgentStep(4);
});

document.querySelector("#reply-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addAgentMessage(event.currentTarget.value);
    event.currentTarget.value = "";
    setAgentStep(4);
  }
});

document.querySelector("#transfer-request").addEventListener("click", () => {
  document.querySelector("#session-status").textContent = "已转人工 · 排队中 · 推荐张伟接入";
  addAgentMessage("您好，AI已将您的问题转给人工客服，我会继续帮您处理。");
  setAgentStep(1);
  showTicketSuccessModal("转人工请求已进入队列", "系统已按 VIP优先、退款技能组、低负载策略推荐张伟接入。");
});

document.querySelector("#accept-session").addEventListener("click", () => {
  document.querySelector("#session-status").textContent = "进行中 · 张伟已接入 · VIP · APP";
  moveConversation("waiting", "active", { tag: "进行中", wait: "进行中 00:00", text: "课程退款问题，张伟已接入处理" });
  addAgentMessage("您好，我是售后客服张伟，已看到AI摘要和您的历史订单信息。");
  setAgentStep(2);
});

document.querySelectorAll("[data-customer-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-customer-tab]").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".customer-tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#customer-tab-${button.dataset.customerTab}`).classList.add("active");
  });
});

const customerProfileCard = document.querySelector("#customer-profile-card");
const customerProfileModal = document.querySelector("#customer-profile-modal");
function openCustomerProfileModal() {
  customerProfileModal.showModal();
  setAgentStep(3);
}
customerProfileCard.addEventListener("click", openCustomerProfileModal);
customerProfileCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openCustomerProfileModal();
  }
});

document.querySelector("#more-action").addEventListener("click", () => {
  addAgentMessage("我已为您标记问题状态：处理中，并开启未回复提醒。");
  setAgentStep(4);
});

document.querySelectorAll(".agent-step").forEach((button) => {
  button.addEventListener("click", () => {
    setAgentStep([...document.querySelectorAll(".agent-step")].indexOf(button));
  });
});

document.querySelectorAll(".ops-step").forEach((button) => {
  button.addEventListener("click", () => {
    setOpsStep([...document.querySelectorAll(".ops-step")].indexOf(button));
    document.querySelector("#ops-feedback").textContent = `当前演示：${button.querySelector("strong").textContent}`;
  });
});

function setOpsStep(activeIndex) {
  document.querySelectorAll(".ops-step").forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
}

document.querySelectorAll("[data-ops-source]").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll("[data-ops-source]").forEach((source) => source.classList.remove("active"));
    item.classList.add("active");
    setOpsStep(1);
    document.querySelector("#ops-feedback").textContent = `已采集${item.dataset.opsSource}，数据已进入清洗、建模和多维指标计算。`;
  });
});

document.querySelectorAll(".ops-action").forEach((button) => {
  button.addEventListener("click", () => {
    const actionText = button.dataset.opsAction;
    const feedback = document.querySelector("#ops-feedback");
    feedback.textContent = actionText;

    if (actionText.includes("洞察已生成")) {
      setOpsStep(2);
      showTicketSuccessModal("优化任务已生成", "系统已根据退款、发票、课程有效期问题生成优化任务，并进入策略优化流程。");
    } else if (actionText.includes("已进入")) {
      setOpsStep(3);
      feedback.textContent = `${actionText}，可继续保存为策略草稿。`;
    } else if (actionText.includes("草稿")) {
      setOpsStep(4);
      showTicketSuccessModal("策略草稿已保存", "策略已保存为 V2.3.2 草稿，可进入灰度发布与版本生效控制。");
    } else if (actionText.includes("灰度策略已发布")) {
      setOpsStep(5);
      showTicketSuccessModal("灰度策略已发布", "新策略已进入 10% 用户灰度，系统将持续监控解决率、转人工率和满意度。");
    } else if (actionText.includes("预警阈值")) {
      setOpsStep(5);
      showTicketSuccessModal("预警阈值已更新", "转人工率、知识命中率和工单积压阈值已更新，监控策略已生效。");
    }
  });
});

document.querySelector("#batch-knowledge-btn").addEventListener("click", () => {
  const feedback = document.querySelector("#knowledge-feedback");
  feedback.classList.remove("is-hidden");
  feedback.textContent = "已批量审核 4 条知识建议，并加入知识库待发布队列。";
});

document.querySelectorAll("[data-customer-segment]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-customer-segment]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const feedback = document.querySelector("#customer-segment-feedback");
    feedback.classList.remove("is-hidden");
    feedback.textContent = `已切换到「${button.dataset.customerSegment}」分群，右侧画像展示该分群的典型客户。`;
  });
});

document.querySelectorAll(".ai-step").forEach((button) => {
  button.addEventListener("click", () => {
    setAiStep([...document.querySelectorAll(".ai-step")].indexOf(button));
  });
});

function setAiStep(activeIndex) {
  document.querySelectorAll(".ai-step").forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
}

function setAgentStep(activeIndex) {
  document.querySelectorAll(".agent-step").forEach((item, index) => {
    item.classList.toggle("active", index === activeIndex);
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function getAiChannelAnswer(channel) {
  const applyPath = {
    APP: "APP 订单页",
    网页: "网页端个人中心的订单页",
    小程序: "小程序订单页",
    微信公众号: "微信公众号菜单的订单服务入口",
  }[channel] || "订单页";

  return `Python入门课如未开课，可申请全额退款。您可以在${applyPath}提交申请，审核通过后预计 1-3 个工作日到账。`;
}

function triggerAiTransfer() {
  document.querySelector("#ai-feedback").textContent = "用户要求转人工，已触发转人工，聊天记录和问题摘要将同步给客服。";
  setAiStep(5);
  const transferPanel = document.querySelector("#ai-transfer-panel");
  transferPanel.classList.remove("is-hidden");
  document.querySelector("#ai-transfer-status").textContent = "已进入待接入队列";
  document.querySelector("#ai-transfer-id").textContent = "U10099";
  if (!aiTransferCreated) {
    conversationsByStatus.waiting.unshift({
      id: "U10099",
      tag: "AI转人工",
      text: "Python入门课退款未解决，AI摘要已同步",
      wait: "排队中 00:00:05",
    });
    aiTransferCreated = true;
    updateConversationCounts();
  }
  showTicketSuccessModal("已触发转人工", "AI聊天记录、用户问题和摘要已同步到客服中心待接入队列。");
}

document.querySelectorAll("[data-ai-channel]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-ai-channel]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    document.querySelector("#ai-channel-name").textContent = button.dataset.aiChannel;
    const answer = getAiChannelAnswer(button.dataset.aiChannel);
    document.querySelector("#ai-answer-preview").value = answer;
    document.querySelector("#ai-final-answer").textContent = answer;
    document.querySelector("#ai-feedback").textContent = `已切换到${button.dataset.aiChannel}渠道，系统已接收该入口咨询。`;
    setAiStep(1);
  });
});

document.querySelector("#ai-question-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#ai-question-input");
  const messageRoot = document.querySelector("#ai-phone-messages");
  const question = input.value.trim();
  if (!question) return;
  messageRoot.insertAdjacentHTML("beforeend", `<div class="message">${escapeHtml(question)}</div>`);
  if (/转人工|人工客服|真人|客服/.test(question)) {
    messageRoot.insertAdjacentHTML("beforeend", `<div class="message agent">已为您转接人工客服，当前聊天记录和问题摘要会同步给客服人员，请稍等。</div>`);
    input.value = "";
    messageRoot.scrollTop = messageRoot.scrollHeight;
    triggerAiTransfer();
    return;
  }
  const channel = document.querySelector("[data-ai-channel].active").dataset.aiChannel;
  const answer = getAiChannelAnswer(channel);
  document.querySelector("#ai-answer-preview").value = answer;
  messageRoot.insertAdjacentHTML("beforeend", `<div class="message agent">${escapeHtml(answer)}</div>`);
  document.querySelector("#intent-result").textContent = "退款咨询 · 置信度 96%";
  document.querySelector("#ai-final-answer").textContent = answer;
  document.querySelector("#ai-feedback").textContent = "AI已完成意图识别、知识库检索并返回答案，等待用户选择满意或转人工。";
  input.value = "";
  messageRoot.scrollTop = messageRoot.scrollHeight;
  setAiStep(4);
});

document.querySelector("#ai-resolved").addEventListener("click", () => {
  document.querySelector("#ai-feedback").textContent = "用户反馈：已解决，进入满意度评价并结束会话。";
  document.querySelector("#ai-transfer-panel").classList.add("is-hidden");
  setAiStep(5);
  showTicketSuccessModal("会话已结束", "用户已确认满意，当前 AI 服务流程已完成闭环。");
});

document.querySelector("#ai-unresolved").addEventListener("click", () => {
  triggerAiTransfer();
});

document.querySelector("#go-workspace-transfer").addEventListener("click", () => {
  switchView("workspace");
  setConversationTab("waiting");
  document.querySelector("#session-status").textContent = "AI转人工 · 待接入 · 推荐张伟";
});

document.querySelector("#global-search").addEventListener("input", (event) => {
  const keyword = event.target.value.trim();
  renderSearchResults(keyword);
});

document.querySelector("#notify-btn").addEventListener("click", (event) => {
  event.stopPropagation();
  document.querySelector("#notify-panel").classList.toggle("is-hidden");
  document.querySelector("#search-results").classList.add("is-hidden");
});

document.querySelector("#mark-read-btn").addEventListener("click", () => {
  notificationItems.forEach((item) => {
    item.unread = false;
  });
  renderNotifications();
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".notify-panel") && !event.target.closest("#notify-btn")) {
    document.querySelector("#notify-panel").classList.add("is-hidden");
  }
  if (!event.target.closest(".search") && !event.target.closest("#search-results")) {
    document.querySelector("#search-results").classList.add("is-hidden");
  }
});

const modal = document.querySelector("#ticket-modal");
const sessionEndModal = document.querySelector("#session-end-modal");
document.querySelector("#quick-create").addEventListener("click", () => modal.showModal());
document.querySelector("#open-ticket-modal").addEventListener("click", () => modal.showModal());
document.querySelector("#make-ticket").addEventListener("click", () => modal.showModal());
document.querySelector("#end-session").addEventListener("click", () => sessionEndModal.showModal());

document.querySelector("#ticket-modal form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  ticketRows.unshift(["TK20260506002", "退款未到账问题", "高", "售后组", "待分配"]);
  ticketState.created = true;
  ticketState.timeline.push("快捷创建：顶部/会话入口提交了新工单");
  renderTable("#ticket-table", ["工单号", "标题", "优先级", "处理组", "状态"], ticketRows);
  renderTicketStep(1);
  showTicketSuccessModal("提交工单成功", "工单已创建并进入待分配列表，可在工单列表中继续跟进处理进度。");
});

document.querySelector("#session-end-form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  document.querySelector("#session-status").textContent = `已结束 · ${document.querySelector("#session-reason").value} · ${document.querySelector("#session-score").value}`;
  moveConversation("active", "closed", { tag: "已结束", wait: "已结束 刚刚", text: `会话已结束 · ${document.querySelector("#session-reason").value}` });
  addAgentMessage(`会话已结束，系统已沉淀标签：${document.querySelector("#session-tags").value}`);
  setAgentStep(5);
  showTicketSuccessModal("会话已结束", "会话标签、满意度和处理记录已完成沉淀，可在已结束列表查看。");
});

document.querySelector("#copy-sdk-btn").addEventListener("click", async () => {
  const code = `<script src="https://cdn.ai-service.example/sdk.js" data-tenant="demo-enterprise"></script>`;
  let copied = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(code);
      copied = true;
    } else {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      copied = document.execCommand("copy");
      document.body.removeChild(ta);
    }
  } catch {
    copied = false;
  }
  if (copied) {
    document.querySelector("#settings-feedback").textContent = "Web SDK接入代码已复制到剪贴板。";
    showTicketSuccessModal("复制成功", `Web SDK接入代码已复制到剪贴板，可直接粘贴到您的网站。\n${code}`);
  } else {
    document.querySelector("#settings-feedback").textContent = `复制失败，可手动复制：${code}`;
    showTicketSuccessModal("复制失败", `当前环境不支持自动复制，请手动复制以下代码：\n${code}`);
  }
});

const membersModal = document.querySelector("#members-modal");
const routingModal = document.querySelector("#routing-modal");
const logsModal = document.querySelector("#logs-modal");
document.querySelector("#manage-members-btn").addEventListener("click", () => membersModal.showModal());
document.querySelector("#configure-routing-btn").addEventListener("click", () => routingModal.showModal());
document.querySelector("#view-logs-btn").addEventListener("click", () => logsModal.showModal());

document.querySelector("#members-modal form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  document.querySelector("#settings-feedback").textContent = "已打开邀请成员流程，默认角色为售后客服。";
});

document.querySelector("#routing-modal form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  document.querySelector("#settings-feedback").textContent = "会话分配规则已保存：VIP优先、技能组匹配、低负载优先。";
});

document.querySelector("#logs-modal form").addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  document.querySelector("#settings-feedback").textContent = "系统日志已导出为审计报表。";
});

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const rememberLogin = document.querySelector("#remember-login");
  const rememberLine = document.querySelector("#remember-line");
  const rememberHelper = document.querySelector("#remember-helper");
  if (!rememberLogin.checked) {
    setLoginTip("请先勾选“7天内自动登录”，开启本设备 7 天免登录后即可进入系统演示。");
    rememberLine.classList.add("is-required");
    rememberHelper.textContent = "请勾选后再登录：系统会在本设备保留 7 天登录状态，便于连续体验完整原型。";
    rememberHelper.classList.add("is-error");
    rememberLogin.focus();
    return;
  }
  rememberLine.classList.remove("is-required");
  rememberHelper.classList.remove("is-error");
  rememberHelper.textContent = "已开启本设备 7 天免登录，正在进入系统演示。";
  showApp();
});

document.querySelector(".password-eye").addEventListener("click", () => {
  const password = document.querySelector("#login-password");
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  document.querySelector(".password-eye").setAttribute("aria-label", isPassword ? "隐藏密码" : "显示密码");
});

document.querySelector("#remember-login").addEventListener("change", (event) => {
  const rememberLine = document.querySelector("#remember-line");
  const rememberHelper = document.querySelector("#remember-helper");
  if (!event.target.checked) {
    rememberHelper.textContent = "勾选后，本设备 7 天内可免输入账号密码进入原型演示。";
    return;
  }
  rememberLine.classList.remove("is-required");
  rememberHelper.classList.remove("is-error");
  rememberHelper.textContent = "已开启本设备 7 天免登录，后续访问可快速进入原型。";
  setLoginTip("已开启7天内自动登录。");
});

let loginMode = "password";
let codeTimer = null;

function setLoginTip(message) {
  const tip = document.querySelector("#login-tip");
  tip.style.display = "flex";
  tip.textContent = message;
}

function sendLoginCode() {
  const button = document.querySelector("#send-code-btn");
  let seconds = 60;
  button.disabled = true;
  button.textContent = `${seconds}s`;
  setLoginTip("验证码已发送至当前账号绑定手机，演示验证码为 123456。");
  window.clearInterval(codeTimer);
  codeTimer = window.setInterval(() => {
    seconds -= 1;
    button.textContent = `${seconds}s`;
    if (seconds > 0) return;
    window.clearInterval(codeTimer);
    button.disabled = false;
    button.textContent = "重新获取";
  }, 1000);
}

document.querySelector("#forgot-password-btn").addEventListener("click", () => {
  const account = document.querySelector("#login-account").value.trim() || "当前账号";
  window.location.href = `./account-action.html?mode=forgot&account=${encodeURIComponent(account)}`;
});

document.querySelector("#sso-login-btn").addEventListener("click", () => {
  const passwordField = document.querySelector(".password-field");
  const verificationField = document.querySelector("#verification-field");
  const switchButton = document.querySelector("#sso-login-btn");
  loginMode = loginMode === "password" ? "code" : "password";
  passwordField.classList.toggle("is-hidden", loginMode === "code");
  verificationField.classList.toggle("is-hidden", loginMode !== "code");
  switchButton.textContent = loginMode === "code" ? "账号密码登录" : "短信验证码登录";
  setLoginTip(loginMode === "code" ? "已切换到短信验证码登录。" : "已切换到账号密码登录。");
  if (loginMode === "code") sendLoginCode();
});

document.querySelector("#send-code-btn").addEventListener("click", sendLoginCode);

document.querySelectorAll(".social-login button").forEach((button) => {
  button.addEventListener("click", () => {
    const provider = button.dataset.provider;
    window.location.href = `./social-login.html?provider=${encodeURIComponent(provider)}`;
  });
});

document.querySelector("#register-btn").addEventListener("click", () => {
  window.location.href = "./account-action.html?mode=register";
});

document.querySelector("#logout-btn").addEventListener("click", () => {
  showLogin();
});

updateConversationCounts();
renderConversations();
renderMessages();
renderNotifications();
renderTable("#knowledge-table", ["问题", "分类", "数据状态", "优化建议", "状态"], knowledgeRows);
renderTable("#ticket-table", ["工单号", "标题", "优先级", "处理组", "状态"], ticketRows);
renderTicketStep();

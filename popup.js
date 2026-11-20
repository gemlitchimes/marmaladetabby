const { DEFAULTS, play, lengthFor } = globalThis.TabbyChime;
let S = { ...DEFAULTS };
const inputs = [...document.querySelectorAll("[data-key]")];

function render() {
  for (const el of inputs) {
    const k = el.dataset.key;
    if (el.type === "checkbox") el.checked = !!S[k];
    else {
      el.value = S[k];
      el.style.setProperty("--p", `${S[k]}%`);
    }
  }
  document.querySelector('[data-out="volume"]').textContent = `${S.volume}%`;
  document.body.classList.toggle("disabled", !S.enabled);
}

chrome.storage.sync.get(DEFAULTS, (v) => {
  S = { ...DEFAULTS, ...v };
  render();
});

for (const el of inputs) {
  el.addEventListener(el.type === "range" ? "input" : "change", () => {
    const k = el.dataset.key;
    S[k] = el.type === "checkbox" ? el.checked : Number(el.value);
    render();
    chrome.storage.sync.set({ [k]: S[k] });
  });
}

document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest("button, label.row");
  if (el && S.sound) play(lengthFor(el), S.volume);
});

document.getElementById("test").addEventListener("click", () => play("done", S.volume));
document.getElementById("replay").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "tabby-intro" }, () => void chrome.runtime.lastError);
    window.close();
  });
});
document.getElementById("reset").addEventListener("click", () => {
  S = { ...DEFAULTS };
  chrome.storage.sync.set(S);
  render();
});

"use strict";

import { fighters, displayNameEn, displayNameJp } from "./fighter.js";

const numFighters = fighters.length;
const candidate = document.getElementById("candidateList");
let bannedFighters = new Set();
let usedFighters = new Set();
let useHistory = false;

// cookie保存期間
const maxAge = 604800;

// ファイル名取得
const getFileName = () => window.location.href.split("/").pop();

// fighterBox作成
const makeFighterBox = (i) => {
    const fighterBox = document.createElement("div");
    const imgDiv = document.createElement("div");

    const img = document.createElement("img");
    img.src = "./icon_imgs/" + fighters[i] + ".png";
    imgDiv.appendChild(img);
    imgDiv.classList.add("imgBox");

    const p = document.createElement("p");
    p.textContent = getFileName() === "index_en.html" ? displayNameEn[i].toUpperCase() : displayNameJp[i];
    p.classList.add("nameBox");

    fighterBox.appendChild(imgDiv);
    fighterBox.appendChild(p);
    fighterBox.classList.add("fighterBox");
    fighterBox.dataset.id = fighters[i];

    return fighterBox;
};

// 初期化
window.addEventListener("DOMContentLoaded", () => {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < numFighters; i++) {
        const li = document.createElement("li");
        const fighterBox = makeFighterBox(i);

        fighterBox.addEventListener("click", () => {
            if (fighterBox.classList.contains("clicked")) {
                fighterBox.classList.remove("clicked");
                bannedFighters.delete(i);
            } else {
                fighterBox.classList.add("clicked");
                bannedFighters.add(i);
            }
            updateRemainingCount();
        });

        li.appendChild(fighterBox);
        frag.appendChild(li);
    }

    candidate.appendChild(frag);

    getCookie();
    updateRemainingCount();
});

// 残りキャラ数更新
const updateRemainingCount = () => {
    const usedCountDisplay = document.getElementById("usedCountDisplay");
    const totalExcluded = useHistory ? bannedFighters.size + usedFighters.size : bannedFighters.size;
    usedCountDisplay.textContent = `残りキャラ数：${numFighters - totalExcluded} / ${numFighters}`;
};

// class操作系（data-id基準）
const addUsedClass = (i) => {
    const el = document.querySelector(`.fighterBox[data-id='${fighters[i]}']`);
    if (el) el.classList.add("used");
};

const removeUsedClass = (i) => {
    const el = document.querySelector(`.fighterBox[data-id='${fighters[i]}']`);
    if (el) el.classList.remove("used");
};

const banIthFighter = (i) => {
    const el = document.querySelector(`.fighterBox[data-id='${fighters[i]}']`);
    if (el) el.classList.add("clicked");
    bannedFighters.add(i);
};

const unbanIthFighter = (i) => {
    const el = document.querySelector(`.fighterBox[data-id='${fighters[i]}']`);
    if (el) el.classList.remove("clicked");
    bannedFighters.delete(i);
};

const deleteIthFighterHistory = (i) => {
    const el = document.querySelector(`.fighterBox[data-id='${fighters[i]}']`);
    if (el) el.classList.remove("used");
    usedFighters.delete(i);
};

// おまかせボタン
document.getElementById("randomButton").addEventListener("click", () => {
    const result = document.getElementById("resultList");
    while (result.firstChild) result.removeChild(result.firstChild);

    const radioButton = document.getElementsByName("radio");
    let numSelectedFighters = 1;
    for (let i = 0; i < 3; i++) if (radioButton[i].checked) numSelectedFighters = radioButton[i].value;

    const union = new Set([...bannedFighters, ...usedFighters]);
    const numAvailable = useHistory ? numFighters - union.size : numFighters - bannedFighters.size;

    if (numAvailable < numSelectedFighters) {
        alert(`キャラが足りません。`);
        const li = document.createElement("li");
        li.appendChild(document.createElement("div")); // 空ボックス
        result.appendChild(li);
        return;
    }

    const frag = document.createDocumentFragment();
    const selectedFighters = [];

    while (selectedFighters.length < numSelectedFighters) {
        const i = Math.floor(Math.random() * numFighters);
        if (selectedFighters.includes(i)) continue;
        if (bannedFighters.has(i) || (useHistory && usedFighters.has(i))) continue;

        const fighterBox = makeFighterBox(i);
        frag.appendChild(fighterBox);
        selectedFighters.push(i);
        usedFighters.add(i);
        fighterBox.classList.add("used");
    }

    result.appendChild(frag);
    setCookie();
});

// historyチェック
const checkIfUseHistory = () => {
    useHistory = historyCheckbox.checked;
    for (let i = 0; i < numFighters; i++) {
        useHistory ? addUsedClass(i) : removeUsedClass(i);
    }
    updateRemainingCount();
};

// ボタン操作
const historyCheckbox = document.getElementById("historyCheckbox");
historyCheckbox.addEventListener("click", checkIfUseHistory);

const allButton = document.getElementById("allButton");
allButton.addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) banIthFighter(i);
    updateRemainingCount();
});

const unbanButton = document.getElementById("unbanButton");
unbanButton.addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) unbanIthFighter(i);
    updateRemainingCount();
});

const deleteHistoryButton = document.getElementById("deleteHistoryButton");
deleteHistoryButton.addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) deleteIthFighterHistory(i);
    setCookie();
});

const resetButton = document.getElementById("resetButton");
resetButton.addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) {
        unbanIthFighter(i);
        deleteIthFighterHistory(i);
    }
    setCookie();
});

// エクスポート
document.getElementById("exportButton").addEventListener("click", () => {
    const state = fighters.map((fighter, i) => {
        const el = document.querySelector(`.fighterBox[data-id='${fighter}']`);
        if (!el) return 0;
        if (el.classList.contains("clicked")) return 1;
        if (el.classList.contains("used")) return 2;
        return 0;
    });
    navigator.clipboard.writeText(JSON.stringify(state))
        .then(() => alert("コピーしました"))
        .catch(() => alert("コピーに失敗しました"));
});

// インポート
document.getElementById("importButton").addEventListener("click", () => {
    const jsonStr = document.getElementById("importTextarea").value;
    if (!jsonStr) return alert("テキストが空です");

    let state;
    try {
        state = JSON.parse(jsonStr);
        if (!Array.isArray(state) || state.length !== fighters.length) throw "不正形式";
    } catch {
        return alert("JSON形式が不正です");
    }

    fighters.forEach((fighter, i) => {
        const el = document.querySelector(`.fighterBox[data-id='${fighter}']`);
        if (!el) return;
        el.classList.remove("clicked", "used");
        if (state[i] === 1) el.classList.add("clicked");
        if (state[i] === 2) el.classList.add("used");
        state[i] === 1 ? bannedFighters.add(i) : bannedFighters.delete(i);
        state[i] === 2 ? usedFighters.add(i) : usedFighters.delete(i);
    });

    updateRemainingCount();
    alert("インポートしました");
});

// Cookie操作
const setCookie = () => {
    document.cookie = "banned=" + JSON.stringify([...bannedFighters]) + "; max-age=" + maxAge + ";";
    document.cookie = "used=" + JSON.stringify([...usedFighters]) + "; max-age=" + maxAge + ";";
};

const getCookie = () => {
    if (!document.cookie) return;
    const cookieArr = document.cookie.split("; ");
    for (const c of cookieArr) {
        const [key, value] = c.split("=");
        if (key === "banned") bannedFighters = new Set(JSON.parse(value));
        if (key === "used") usedFighters = new Set(JSON.parse(value));
    }
    // クラス反映
    for (let i = 0; i < numFighters; i++) {
        if (bannedFighters.has(i)) banIthFighter(i);
        if (useHistory && usedFighters.has(i)) addUsedClass(i);
    }
};

getCookie();
updateRemainingCount();
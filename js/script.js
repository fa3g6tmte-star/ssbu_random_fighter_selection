"use strict";

import { fighters, displayNameEn, displayNameJp } from "./fighter.js";

const numFighters = fighters.length;
const candidate = document.getElementById("candidateList");
const resultList = document.getElementById("resultList");
let bannedFighters = new Set();
let usedFighters = new Set();
let useHistory = false;

// ボタン
const randomButton = document.getElementById("randomButton");
const historyCheckbox = document.getElementById("historyCheckbox");
const allButton = document.getElementById("allButton");
const unbanButton = document.getElementById("unbanButton");
const deleteHistoryButton = document.getElementById("deleteHistoryButton");
const resetButton = document.getElementById("resetButton");

// キャラボックス配列（候補リストのみ）
const fighterBoxes = [];

// cookie保存期間
const maxAge = 604800;

// ファイル名取得
const getFileName = () => window.location.href.split("/").pop();

// キャラボックス作成
const makeFighterBox = (i) => {
    const fighterBox = document.createElement("div");
    fighterBox.classList.add("fighterBox");
    if (i !== -1) fighterBox.dataset.id = fighters[i];

    const imgDiv = document.createElement("div");
    imgDiv.classList.add("imgBox");
    if (i !== -1) {
        const img = document.createElement("img");
        img.src = "./icon_imgs/" + fighters[i] + ".png";
        imgDiv.appendChild(img);
    }

    const p = document.createElement("p");
    p.classList.add("nameBox");
    if (i !== -1) {
        p.textContent = getFileName() === "index_en.html" ? displayNameEn[i].toUpperCase() : displayNameJp[i];
    }

    fighterBox.appendChild(imgDiv);
    fighterBox.appendChild(p);
    return fighterBox;
};

// 初期化
window.addEventListener("DOMContentLoaded", () => {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < numFighters; i++) {
        const li = document.createElement("li");
        const fighterBox = makeFighterBox(i);

        // 候補リストのクリックでban/unban
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
        fighterBoxes.push(fighterBox);
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
    const remaining = numFighters - totalExcluded;
    usedCountDisplay.textContent = `残りキャラ数：${remaining} / ${numFighters}`;
};

// 全キャラban/unban
const banAllFighters = () => {
    fighterBoxes.forEach((box, i) => {
        box.classList.add("clicked");
        bannedFighters.add(i);
    });
    updateRemainingCount();
};

const unbanAllFighters = () => {
    fighterBoxes.forEach((box, i) => {
        box.classList.remove("clicked");
        bannedFighters.delete(i);
    });
    updateRemainingCount();
};

// history
const addUsedClass = (i) => {
    if (usedFighters.has(i)) fighterBoxes[i].classList.add("used");
};
const removeUsedClass = (i) => {
    if (usedFighters.has(i)) fighterBoxes[i].classList.remove("used");
};
const checkIfUseHistory = () => {
    useHistory = historyCheckbox.checked;
    for (let i = 0; i < numFighters; i++) {
        useHistory ? addUsedClass(i) : removeUsedClass(i);
    }
    updateRemainingCount();
};

// 個別history削除
const deleteIthFighterHistory = (i) => {
    usedFighters.delete(i);
    fighterBoxes[i].classList.remove("used");
};

// 履歴削除
const deleteHistory = () => {
    if (!confirm(getFileName() === "index_en.html" ? "Are you sure you want to delete history?" : "履歴を削除してよろしいですか？")) return;
    for (let i = 0; i < numFighters; i++) deleteIthFighterHistory(i);
};

// リセット
const reset = () => {
    if (!confirm(getFileName() === "index_en.html" ? "Are you sure you want to reset?" : "リセットしてよろしいですか？")) return;
    for (let i = 0; i < numFighters; i++) {
        fighterBoxes[i].classList.remove("clicked", "used");
        bannedFighters.delete(i);
        usedFighters.delete(i);
    }
    updateRemainingCount();
};

// cookie
const setCookie = () => {
    document.cookie = `banned=${JSON.stringify([...bannedFighters])}; max-age=${maxAge};`;
    document.cookie = `used=${JSON.stringify([...usedFighters])}; max-age=${maxAge};`;
};
const getCookie = () => {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    cookies.forEach(c => {
        const [key, val] = c.split("=");
        if (key === "banned") bannedFighters = new Set(JSON.parse(val));
        if (key === "used") usedFighters = new Set(JSON.parse(val));
    });

    fighterBoxes.forEach((box, i) => {
        if (bannedFighters.has(i)) box.classList.add("clicked");
        if (useHistory && usedFighters.has(i)) box.classList.add("used");
    });
};

// おまかせボタン
randomButton.addEventListener("click", () => {
    const selectedFighters = [];
    const result = document.getElementById("resultList");
    while (result.firstChild) result.removeChild(result.firstChild);

    const radioButton = document.getElementsByName("radio");
    let numSelectedFighters = 1;
    for (let i = 0; i < radioButton.length; i++) {
        if (radioButton[i].checked) numSelectedFighters = Number(radioButton[i].value);
    }

    const union = new Set([...bannedFighters, ...usedFighters]);
    const numAvailable = useHistory ? numFighters - union.size : numFighters - bannedFighters.size;
    if (numAvailable < numSelectedFighters) {
        alert("選択可能なキャラが足りません");
        return;
    }

    const frag = document.createDocumentFragment();
    while (selectedFighters.length < numSelectedFighters) {
        const i = Math.floor(Math.random() * numFighters);
        if (selectedFighters.includes(i)) continue;
        if (bannedFighters.has(i) || (useHistory && usedFighters.has(i))) continue;

        // 結果欄用のボックス（色なし）
        const fighterBox = makeFighterBox(i);
        frag.appendChild(fighterBox);

        selectedFighters.push(i);

        // 候補リストの使用済みを更新
        usedFighters.add(i);
        if (useHistory) {
            const candidateBox = fighterBoxes[i].querySelector(".imgBox");
            candidateBox.classList.add("used"); // 候補リストだけ青
        }
    }

    result.appendChild(frag);
    setCookie();
});

// export/import
document.getElementById("exportButton").addEventListener("click", () => {
    const state = fighterBoxes.map((box, i) => {
        if (box.classList.contains("clicked")) return 1;
        if (box.classList.contains("used")) return 2;
        return 0;
    });
    navigator.clipboard.writeText(JSON.stringify(state))
        .then(() => alert("コピーしました"))
        .catch(() => alert("コピーに失敗しました"));
});

document.getElementById("importButton").addEventListener("click", () => {
    const jsonStr = document.getElementById("importTextarea").value;
    if (!jsonStr) return alert("テキストが空です");
    let state;
    try {
        state = JSON.parse(jsonStr);
        if (!Array.isArray(state) || state.length !== numFighters) throw "不正";
    } catch {
        return alert("JSON形式が不正です");
    }
    state.forEach((s, i) => {
        fighterBoxes[i].classList.remove("clicked", "used");
        if (s === 1) fighterBoxes[i].classList.add("clicked");
        if (s === 2) fighterBoxes[i].classList.add("used");
        if (s === 1) bannedFighters.add(i);
        if (s === 2) usedFighters.add(i);
    });
    updateRemainingCount();
    alert("インポートしました");
});

// イベント
historyCheckbox.addEventListener("click", checkIfUseHistory);
allButton.addEventListener("click", banAllFighters);
unbanButton.addEventListener("click", unbanAllFighters);
deleteHistoryButton.addEventListener("click", () => { deleteHistory(); setCookie(); });
resetButton.addEventListener("click", () => { reset(); setCookie(); });
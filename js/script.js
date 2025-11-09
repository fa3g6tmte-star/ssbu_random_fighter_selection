"use strict";

import { fighters, displayNameEn, displayNameJp } from "./fighter.js";

const numFighters = fighters.length;
const candidate = document.getElementById("candidateList");
let bannedFighters = new Set();
let usedFighters = new Set();
let useHistory = false;

// buttonがクリックされた時にキャラクターを選ぶ
const randomButton = document.getElementById("randomButton");

// キャラクタボックスの配列（候補リスト用）
const fighterBoxes = [];

// cookieの保存期間．1週間
const maxAge = 604800;

// ファイル名を取得
const getFileName = () => window.location.href.split("/").pop();

// i番目のキャラクターボックスを作成
// resultsOnly: true なら候補リスト用ではなく結果欄用
const makeFighterBox = (i, resultsOnly = false) => {
    const fighterBox = document.createElement("div");
    const imgDiv = document.createElement("div");
    imgDiv.classList.add("imgBox");

    if (i !== -1) {
        const img = document.createElement("img");
        img.src = "./icon_imgs/" + fighters[i] + ".png";
        imgDiv.appendChild(img);
    }

    const p = document.createElement("p");
    if (i !== -1) {
        p.textContent = getFileName() === "index_en.html" ? displayNameEn[i].toUpperCase() : displayNameJp[i];
    }
    p.classList.add("nameBox");

    fighterBox.appendChild(imgDiv);
    fighterBox.appendChild(p);
    fighterBox.classList.add("fighterBox");

    if (i !== -1) fighterBox.dataset.id = fighters[i];

    // 結果欄用ならクリックイベントなし
    if (!resultsOnly && i !== -1) {
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
    }

    return fighterBox;
};

// 初期化
window.addEventListener("DOMContentLoaded", () => {
    const frag = document.createDocumentFragment();
    for (let i = -1; i < numFighters; i++) {
        if (i === -1) {
            const result = document.getElementById("resultList");
            const li = document.createElement("li");
            li.appendChild(makeFighterBox(-1, true));
            result.appendChild(li);
            continue;
        }

        const li = document.createElement("li");
        const fighterBox = makeFighterBox(i);
        li.appendChild(fighterBox);
        fighterBoxes.push(fighterBox);
        frag.appendChild(li);
    }
    candidate.appendChild(frag);

    getCookie();
    updateRemainingCount();
});

// キャラが選択できない時にアラート
const alertWhenUnavaliable = (numSelectedFighters, numAvailable) => {
    const numUnavailable = numSelectedFighters - numAvailable;
    const fileName = getFileName();
    if (fileName === "index_en.html") {
        if (useHistory) {
            alert(`You have to unban at least ${numUnavailable} fighter(s) or reset your history.`);
        } else {
            alert(`You have to unban at least ${numUnavailable} fighter(s).`);
        }
    } else {
        if (useHistory) {
            alert(`少なくとも${numUnavailable}キャラ以上を使えるようにするか、履歴を削除してください。`);
        } else {
            alert(`少なくとも${numUnavailable}キャラ以上を使えるようにしてください。`);
        }
    }
};

// おまかせボタン
randomButton.addEventListener("click", () => {
    const selectedFighters = [];
    const result = document.getElementById("resultList");
    while (result.firstChild) result.removeChild(result.firstChild);

    // 選択数取得
    const radioButton = document.getElementsByName("radio");
    let numSelectedFighters = 1;
    for (let i = 0; i < radioButton.length; i++) {
        if (radioButton[i].checked) numSelectedFighters = Number(radioButton[i].value);
    }

    const union = new Set([...bannedFighters, ...usedFighters]);
    const numAvailable = useHistory ? numFighters - union.size : numFighters - bannedFighters.size;
    if (numAvailable < numSelectedFighters) {
        alertWhenUnavaliable(numSelectedFighters, numAvailable);
        return;
    }

    const frag = document.createDocumentFragment();
    while (selectedFighters.length < numSelectedFighters) {
        const i = Math.floor(Math.random() * numFighters);
        if (selectedFighters.includes(i)) continue;
        if (bannedFighters.has(i) || (useHistory && usedFighters.has(i))) continue;

        // 結果欄用ボックス（色なし）
        const fighterBox = makeFighterBox(i, true);
        frag.appendChild(fighterBox);
        selectedFighters.push(i);

        // 候補リストのみ使用済みに
        usedFighters.add(i);
        if (useHistory) {
            const candidateBox = fighterBoxes[i].querySelector(".imgBox");
            candidateBox.classList.add("used");
        }
    }
    result.appendChild(frag);
    setCookie();
});

// 使用済みクラス管理（候補リストのみ）
const addUsedClass = (i) => {
    if (usedFighters.has(i)) {
        const candidateBox = fighterBoxes[i].querySelector(".imgBox");
        candidateBox.classList.add("used");
    }
};
const removeUsedClass = (i) => {
    const candidateBox = fighterBoxes[i].querySelector(".imgBox");
    candidateBox.classList.remove("used");
};

// 履歴チェック
const historyCheckbox = document.getElementById("historyCheckbox");
const checkIfUseHistory = () => {
    useHistory = historyCheckbox.checked;
    for (let i = 0; i < numFighters; i++) {
        if (useHistory) addUsedClass(i);
        else removeUsedClass(i);
    }
    updateRemainingCount();
};
historyCheckbox.addEventListener("click", checkIfUseHistory);

// ban/unban 操作
const banIthFighter = (i) => {
    bannedFighters.add(i);
    fighterBoxes[i].classList.add("clicked");
};
const unbanIthFighter = (i) => {
    bannedFighters.delete(i);
    fighterBoxes[i].classList.remove("clicked");
};
const deleteIthFighterHistory = (i) => {
    usedFighters.delete(i);
    fighterBoxes[i].querySelector(".imgBox").classList.remove("used");
};

// 全ban/unban
document.getElementById("allButton").addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) banIthFighter(i);
    updateRemainingCount();
});
document.getElementById("unbanButton").addEventListener("click", () => {
    for (let i = 0; i < numFighters; i++) unbanIthFighter(i);
    updateRemainingCount();
});

// 履歴削除
document.getElementById("deleteHistoryButton").addEventListener("click", () => {
    if (confirm(getFileName() === "index_en.html" ? "Are you sure you want to delete history?" : "履歴を削除してよろしいですか？")) {
        for (let i = 0; i < numFighters; i++) deleteIthFighterHistory(i);
        setCookie();
    }
});

// リセット
document.getElementById("resetButton").addEventListener("click", () => {
    if (confirm(getFileName() === "index_en.html" ? "Are you sure you want to reset?" : "リセットしてよろしいですか？")) {
        for (let i = 0; i < numFighters; i++) {
            unbanIthFighter(i);
            deleteIthFighterHistory(i);
        }
        setCookie();
    }
});

// 残りキャラ数
const updateRemainingCount = () => {
    const totalExcluded = useHistory ? bannedFighters.size + usedFighters.size : bannedFighters.size;
    document.getElementById("usedCountDisplay").textContent = `残りキャラ数：${numFighters - totalExcluded} / ${numFighters}`;
};

// cookie操作
const setCookie = () => {
    document.cookie = `banned=${JSON.stringify([...bannedFighters])}; `;
    document.cookie = `used=${JSON.stringify([...usedFighters])}; `;
    document.cookie = `max-age=${maxAge}; `;
};
const getCookie = () => {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    cookies.forEach(c => {
        const [key, val] = c.split("=");
        if (key === "banned") bannedFighters = new Set(JSON.parse(val));
        if (key === "used") usedFighters = new Set(JSON.parse(val));
    });
    // クラス反映
    for (let i = 0; i < numFighters; i++) {
        if (bannedFighters.has(i)) banIthFighter(i);
        if (useHistory && usedFighters.has(i)) addUsedClass(i);
    }
};
getCookie();

// エクスポート/インポート
document.getElementById("exportButton").addEventListener("click", () => {
    const state = fighters.map(f => {
        const el = document.querySelector(`.fighterBox[data-id='${f}']`);
        if (!el) return 0;
        if (el.classList.contains("clicked")) return 1;
        if (el.classList.contains("used")) return 2;
        return 0;
    });
    navigator.clipboard.writeText(JSON.stringify(state)).then(() => alert("コピーしました"), () => alert("コピーに失敗しました"));
});
document.getElementById("importButton").addEventListener("click", () => {
    const jsonStr = document.getElementById("importTextarea").value;
    if (!jsonStr) return alert("テキストが空です");
    let state;
    try {
        state = JSON.parse(jsonStr);
        if (!Array.isArray(state) || state.length !== fighters.length) throw "不正な形式";
    } catch {
        return alert("JSON形式が不正です");
    }
    fighters.forEach((f, i) => {
        const el = document.querySelector(`.fighterBox[data-id='${f}']`);
        if (!el) return;
        el.classList.remove("clicked", "used");
        if (state[i] === 1) el.classList.add("clicked");
        if (state[i] === 2) el.classList.add("used");
    });
    alert("インポートしました");
});
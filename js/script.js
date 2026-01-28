// 厳密なエラーチェック
"use strict";

import { fighters, displayNameEn, displayNameJp } from "./fighter.js";

const numFighters = fighters.length;
const candidate = document.getElementById("candidateList");
let bannedFighters = new Set();
let usedFighters = new Set();
let useHistory = false;

// buttonがクリックされた時にキャラクターを選ぶ
const randomButton = document.getElementById("randomButton");

// キャラクタボックスの配列
const fighterBoxes = [];

// cookieの保存期間．1週間
const maxAge = 604800;

// ファイル名を取得
const getFileName = () => {
    return window.location.href.split("/").pop();
}

// i番目のキャラクターボックスを作成
// i=-1のときを含まない場合は空のキャラクタボックスを作成
const makeFighterBox = (i) => {
    // 全体
    const fighterBox = document.createElement("div");

    // 画像をいれる
    const imgDiv = document.createElement("div");

    // 空のボックスを作る場合はここは処理しない
    if (i !== -1) {
        const img = document.createElement("img");
        // 画像のパス
        img.src = "./icon_imgs/" + fighters[i] + ".png";
        // 画像を追加
        imgDiv.appendChild(img);
    }

    // クラスの付与
    imgDiv.classList.add("imgBox")

    // fighter名の追加
    const p = document.createElement("p");
    if (i !== -1) {
        if (getFileName() === "index_en.html") {
            p.textContent = displayNameEn[i].toUpperCase();
        } else {
            p.textContent = displayNameJp[i];
        }
    }
    p.classList.add("nameBox");

    fighterBox.appendChild(imgDiv)
    fighterBox.appendChild(p);
    fighterBox.classList.add("fighterBox");

    return fighterBox
}

// 初期化
window.addEventListener("DOMContentLoaded", () => {
    const frag = document.createDocumentFragment();
    for (let i = -1; i < numFighters; i++) {
        // 結果の一覧に追加 (レイアウト維持のため)
        if (i === -1) {
            const result = document.getElementById("resultList");
            const li = document.createElement("li");
            const fighterBox = makeFighterBox(-1);
            li.appendChild(fighterBox);
            result.appendChild(li);
            continue;
        }
        const li = document.createElement("li");

        const fighterBox = makeFighterBox(i);

        // クリックしたら色をつける
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

        // document fragment に一時的に保存
        frag.appendChild(li);
    }
    candidate.appendChild(frag);

    getCookie();
    
    updateRemainingCount();
})

// キャラが選択できない時にアラートを出す．
const alertWhenUnavaliable = (numSelectedFighters, numAvailable) => {
    const numUnavailable = numSelectedFighters - numAvailable;
    const fileName = getFileName();
    if (fileName === "index_en.html") {
        if (useHistory) {
            if (numUnavailable === 1) {
                alert(`You have to unban at least 1 fighter or reset your history.`);
            } else {
                alert(`You have to unban at least ${numUnavailable} fighters or reset your history.`);
            }
        } else {
            if (numUnavailable === 1) {
                alert(`You have to unban at least 1 fighter.`);
            } else {
                alert(`You have to unban at least ${numUnavailable} fighters.`);
            }
        }
    } else {
        if (useHistory) {
            alert(`少なくとも${numUnavailable}キャラ以上を使えるようにするか、履歴を削除してください。`);
        } else {
            alert(`少なくとも${numUnavailable}キャラ以上を使えるようにしてください。`);
        }
    }
}

// おまかせボタンが押されたときのイベントを作成
randomButton.addEventListener("click", () => {
    const selectedFighters = [];
    const result = document.getElementById("resultList");

    // もし子要素が存在したら削除
    while (result.firstChild) {
        result.removeChild(result.firstChild);
    }


        // radio button の値を取得
        const radioButton = document.getElementsByName("radio");
        let numSelectedFighters = 1;
        
        // 選択状態の値を取得（全てのボタンをチェック）
        for (let i = 0; i < radioButton.length; i++) {
            if (radioButton[i].checked) {
                numSelectedFighters = parseInt(radioButton[i].value);
                break;
            }
        }

    // もし指定された個数文表示できなかったら
    const union = new Set([...bannedFighters, ...usedFighters]);
    const numAvailable = useHistory ? numFighters - union.size : numFighters - bannedFighters.size;

    if (numAvailable < numSelectedFighters) {
        alertWhenUnavaliable(numSelectedFighters, numAvailable);
        // 結果の一覧に追加 (レイアウト維持のため)
        const result = document.getElementById("resultList");
        const li = document.createElement("li");
        const fighterBox = makeFighterBox(-1);
        li.appendChild(fighterBox);
        result.appendChild(li);
        return;
    }

    // 一時的に保存する場所
    const frag = document.createDocumentFragment();

    while (selectedFighters.length < numSelectedFighters) {
        const i = Math.floor(Math.random() * numFighters);
        if (useHistory) {
            if (bannedFighters.has(i) || selectedFighters.includes(i) || usedFighters.has(i)) {
                continue;
            } else {
                // キャラクタボックスを作成
                const fighterBox = makeFighterBox(i);

                frag.appendChild(fighterBox);

                // 決定済みキャラに追加
                selectedFighters.push(i);

                // 使用済みキャラに追加
                usedFighters.add(i);
                fighterBoxes[i].classList.add("used");
            }
        }
        else {
            if (bannedFighters.has(i) || selectedFighters.includes(i)) {
                continue;
            } else {
                // キャラクタボックスを作成
                const fighterBox = makeFighterBox(i);

                frag.appendChild(fighterBox);

                // 決定済みキャラに追加
                selectedFighters.push(i);

                // 使用済みキャラに追加
                usedFighters.add(i);
            }
        }
    }

    result.appendChild(frag);

    updateRemainingCount();

    // cookieを保存
    setCookie();
    
    
});

// historyを使う場合は，used class を付与
const addUsedClass = (i) => {
    const candidateChildren = candidate.children;
    if (usedFighters.has(i)) {
        const child = candidateChildren[i];

        // used class を削除
        const boxDiv = child.children[0];
        boxDiv.classList.add("used");
    }

    return;
}

// historyを使わない場合は，used class を削除する．set型の中身は消さない
const removeUsedClass = (i) => {
    const candidateChildren = candidate.children;
    if (usedFighters.has(i)) {
        const child = candidateChildren[i];

        // used class を削除
        const boxDiv = child.children[0];
        boxDiv.classList.remove("used");
    }

    return;
}

// historyを使うかどうか
const checkIfUseHistory = () => {
    if (historyCheckbox.checked) {
        useHistory = true;
        for (let i = 0; i < numFighters; i++) {
            addUsedClass(i);
        }
    } else {
        useHistory = false;
        for (let i = 0; i < numFighters; i++) {
            removeUsedClass(i);
        }
    }
    updateRemainingCount();
}

// i番目のキャラクターをbanする関数
const banIthFighter = (i) => {
    const candidateChildren = candidate.children;
    const child = candidateChildren[i];
    bannedFighters.add(i);

    // clicked classを削除
    const boxDiv = child.children[0];
    boxDiv.classList.add("clicked");
}

// i番目のキャラクターをunbanする関数
const unbanIthFighter = (i) => {
    const candidateChildren = candidate.children;
    const child = candidateChildren[i];
    bannedFighters.delete(i);

    // clicked classを削除
    const boxDiv = child.children[0];
    boxDiv.classList.remove("clicked");

}

// i番目のキャラクターのhistoryを削除する関数
const deleteIthFighterHistory = (i) => {
    const candidateChildren = candidate.children;
    const child = candidateChildren[i];
    usedFighters.delete(i);

    // used class を削除
    const boxDiv = child.children[0];
    boxDiv.classList.remove("used");
}

// allButtonがクリックされたら全てのiconをbanする
const banAllFighters = () => {
    const candidateChildren = candidate.children;
    for (let i = 0; i < numFighters; i++) {
        banIthFighter(i);
    }
    updateRemainingCount();
}

// 全てのキャラクターをunbanする
const unbanAllFighters = () => {
    for (let i = 0; i < numFighters; i++) {
        unbanIthFighter(i);
    }
    updateRemainingCount();
}

// historyを削除する
const deleteHistory = () => {
    let result;
    const fileName = getFileName();
    if (fileName === "index_en.html") {
        result = confirm("Are you sure you want to delete history?")
    } else {
        result = confirm("履歴を削除してよろしいですか？")
    }
    if (result) {
        for (let i = 0; i < numFighters; i++) {
            deleteIthFighterHistory(i);
        }
    }
}

// resetButtonがクリックされたら全てのiconをunbanする
const reset = () => {
    let result;
    const fileName = getFileName();
    if (fileName === "index_en.html") {
        result = confirm("Are you sure you want to reset?")
    } else {
        result = confirm("リセットしてよろしいですか？")
    }

    if (result) {
        for (let i = 0; i < numFighters; i++) {
            unbanIthFighter(i);
            deleteIthFighterHistory(i);
        }
    }
}
// 残りキャラ数の表示を更新する関数
const updateRemainingCount = () => {
    const usedCountDisplay = document.getElementById("usedCountDisplay");

    // 履歴を使う場合は使用済キャラも除外する
    const totalExcluded = useHistory
        ? bannedFighters.size + usedFighters.size
        : bannedFighters.size;

    const remaining = Math.max(numFighters - totalExcluded, 0);
    usedCountDisplay.textContent = `残りキャラ数：${remaining} / ${numFighters}`;
};

// --- エクスポート / インポート 機能 ---

const exportButton = document.getElementById("exportButton");
const importButton = document.getElementById("importButton");
const importTextarea = document.getElementById("importTextarea");

// エクスポート機能
exportButton.addEventListener("click", () => {
    const data = {
        banned: [...bannedFighters],
        used: [...usedFighters],
    };
    const jsonText = JSON.stringify(data);
    navigator.clipboard.writeText(jsonText)
        .then(() => {
            alert("クリップボードにコピーしました。");
        })
        .catch(() => {
            importTextarea.value = jsonText;
            alert("コピーに失敗しました。");
        });
});

// インポート機能
// ===============================
// ✅ インポート機能（プルダウン対応版）
// ===============================
importButton.addEventListener("click", async () => {
    const sourceSelect = document.getElementById("importSource");
    const source = sourceSelect ? sourceSelect.value : "text";
    const text = importTextarea.value.trim();
    let data;

    if (source === "text") {
        // ▼ テキストから読み込み（従来通り）
        if (!text) {
            alert("テキストを入力してください。");
            return;
        }

        try {
            data = JSON.parse(text);
        } catch (e) {
            alert("形式が正しくありません。");
            return;
        }
    } else {
        // ▼ JSONファイルをGitHubから取得
        const fileName = encodeURIComponent(source) + ".json";
        const url = `https://raw.githubusercontent.com/fa3g6tmte-star/ssbu_random_fighter_selection/master/json/${fileName}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error("ファイルが見つかりません。");
            data = await response.json();
        } catch (err) {
            console.error(err);
            alert("JSONファイルの取得に失敗しました。");
            return;
        }
    }

    // ▼ データの妥当性チェック
    if (!data.banned || !data.used) {
        alert("データが不完全です。");
        return;
    }

    // ▼ 現在の状態をリセット
    bannedFighters.clear();
    usedFighters.clear();

    // ▼ 新しいデータを反映
    data.banned.forEach(i => bannedFighters.add(i));
    data.used.forEach(i => usedFighters.add(i));

    // ▼ UI更新
    for (let i = 0; i < numFighters; i++) {
        if (bannedFighters.has(i)) {
            banIthFighter(i);
        } else {
            unbanIthFighter(i);
        }

        if (useHistory && usedFighters.has(i)) {
            addUsedClass(i);
        } else {
            removeUsedClass(i);
        }
    }

    setCookie();
    updateRemainingCount();

    //alert(`${source === "text" ? "テキスト" : source + ".json"} からインポートしました！`);
});

// --- インポートテキストエリア クリア機能 ---
const clearImportButton = document.getElementById("clearImportButton");

clearImportButton.addEventListener("click", () => {
    importTextarea.value = "";
    //alert("テキストエリアをクリアしました。");
});

// --- カウンター機能 ---
const counterDisplay = document.getElementById("counterDisplay");
const increaseCounter = document.getElementById("increaseCounter");
const decreaseCounter = document.getElementById("decreaseCounter");
const clearCounter = document.getElementById("clearCounter");

const MAX_COUNT = 999;
const MIN_COUNT = -999;

const updateCounter = (value) => {
    let val = parseInt(value);
    if (isNaN(val)) val = 0;
    if (val > MAX_COUNT) val = MAX_COUNT;
    if (val < MIN_COUNT) val = MIN_COUNT;
    counterDisplay.value = val;
}

increaseCounter.addEventListener("click", () => {
    updateCounter(parseInt(counterDisplay.value) + 1);
});

decreaseCounter.addEventListener("click", () => {
    updateCounter(parseInt(counterDisplay.value) - 1);
});

clearCounter.addEventListener("click", () => {
    updateCounter(0);
});

counterDisplay.addEventListener("input", (e) => {
    updateCounter(e.target.value);
});
// -------------------------------
// ▼ Miiキャラのみ除外
// -------------------------------
const banMiiFighters = () => {
    for (let i = 0; i < numFighters; i++) {
        // fighters[i] は画像ファイル名
        if (fighters[i].startsWith("mii_")) {
            banIthFighter(i);
        }
    }
    updateRemainingCount();
    setCookie();
};
//--------------------------------------------------
// ▼ チーム編成ランダム機能
//--------------------------------------------------
const players = ["Achilles", "ポリ2", "顔文字", "ショウ"];

// ▼ 親コンテナ生成
const teamContainer = document.createElement("div");
teamContainer.className = "team-random-container";
teamContainer.innerHTML = `
  <button id="generateTeamButton" class="team-random-button">
    チーム編成（ランダム）
  </button>
  <div id="teamResult" class="team-result"></div>
`;
document.querySelector("main .container").appendChild(teamContainer);

// ▼ ボタン処理
document.getElementById("generateTeamButton").addEventListener("click", () => {
  const rounds = generateTeamRounds(players, 3);
  const resultDiv = document.getElementById("teamResult");
  resultDiv.innerHTML = "";

  rounds.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "team-row";
    row.innerHTML = `
      <div class="round-label">${i + 1}回戦</div>
      <div class="team team-red">${r[0][0]} / ${r[0][1]}</div>
      <div class="vs">VS</div>
      <div class="team team-blue">${r[1][0]} / ${r[1][1]}</div>
    `;
    resultDiv.appendChild(row);
  });
});

// ▼ チーム編成生成関数
function generateTeamRounds(players, numRounds) {
  const allRounds = [];
  const usedCombos = new Set();

  while (allRounds.length < numRounds) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const team1 = [shuffled[0], shuffled[1]].sort();
    const team2 = [shuffled[2], shuffled[3]].sort();

    const key = JSON.stringify([team1, team2].sort());
    if (!usedCombos.has(key)) {
      usedCombos.add(key);
      allRounds.push([team1, team2]);
    }
    if (usedCombos.size >= 3) break;
  }

  return allRounds;
}


// cookieの追加や削除の関数
const setCookie = () => {
    const valueBanned = JSON.stringify([...bannedFighters]);
    const valueUsed = JSON.stringify([...usedFighters]);

    document.cookie = "banned=" + valueBanned + "; ";
    document.cookie = "used=" + valueUsed + "; ";
    document.cookie = "max-age=" + maxAge + "; ";
}

const getCookie = () => {
    const cookies = document.cookie;
    if (cookies !== "") {
        const cookieArr = cookies.split("; ");
        for (let i = 0; i < cookieArr.length; i++) {
            const cookie = cookieArr[i].split("=");
            if (cookie[0] === "banned") {
                const arr = JSON.parse(cookie[1]);
                bannedFighters = new Set(arr);
            }
            if (cookie[0] === "used") {
                const arr = JSON.parse(cookie[1]);
                usedFighters = new Set(arr);
            }
        }
    }

    // clicked, used クラスを付与
    for (let i = 0; i < numFighters; i++) {
        if (bannedFighters.has(i)) {
            banIthFighter(i);
        }
        if (useHistory) {
            if (usedFighters.has(i)) {
                addUsedClass(i);
            }
        }
    }
}

const historyCheckbox = document.getElementById("historyCheckbox");
const allButton = document.getElementById("allButton");
const unbanButton = document.getElementById("unbanButton");
const deleteHistoryButton = document.getElementById("deleteHistoryButton");
const resetButton = document.getElementById("resetButton");
const miiBanButton = document.getElementById("miiBanButton");

historyCheckbox.addEventListener("click", checkIfUseHistory);
allButton.addEventListener("click", banAllFighters);
unbanButton.addEventListener("click", unbanAllFighters);
miiBanButton.addEventListener("click", banMiiFighters);
deleteHistoryButton.addEventListener("click", () => {
    deleteHistory();
    updateRemainingCount();
    setCookie();
});
resetButton.addEventListener("click", () => {
    reset();
    updateRemainingCount();
    setCookie();
});
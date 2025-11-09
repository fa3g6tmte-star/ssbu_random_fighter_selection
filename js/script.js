const banIthFighter = (i) => {
    bannedFighters.add(i);
    const box = fighterBoxes[i].querySelector(".imgBox");
    box.classList.add("clicked");
    box.classList.remove("used"); // 除外が優先
};

const unbanIthFighter = (i) => {
    bannedFighters.delete(i);
    const box = fighterBoxes[i].querySelector(".imgBox");
    box.classList.remove("clicked");
    if (useHistory && usedFighters.has(i)) {
        box.classList.add("used"); // 除外解除で使用済み色を復活
    }
};

const addUsedClass = (i) => {
    if (usedFighters.has(i) && !bannedFighters.has(i)) {
        fighterBoxes[i].querySelector(".imgBox").classList.add("used");
    }
};

const removeUsedClass = (i) => {
    fighterBoxes[i].querySelector(".imgBox").classList.remove("used");
};

// 全キャラ除外
const banAllFighters = () => {
    for (let i = 0; i < numFighters; i++) banIthFighter(i);
    updateRemainingCount();
};

// 全キャラ除外解除
const unbanAllFighters = () => {
    for (let i = 0; i < numFighters; i++) unbanIthFighter(i);
    updateRemainingCount();
};
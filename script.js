const boardElement = document.getElementById('board');
const messageElement = document.getElementById('message');

const boardSize = 8;
let board = [];
let currentPlayer = 'black'; // 先攻は黒石

const directions = [
    [-1, 0],  // 上
    [1, 0],   // 下
    [0, -1],  // 左
    [0, 1],   // 右
    [-1, -1], // 左上
    [-1, 1],  // 右上
    [1, -1],  // 左下
    [1, 1]    // 右下
];

function initializeBoard() {
    board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

    board[3][3] = 'white';
    board[3][4] = 'black';
    board[4][3] = 'black';
    board[4][4] = 'white';

    renderBoard();
    updateMessage();
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', handleCellClick);

            if (board[r][c]) {
                const stone = document.createElement('div');
                stone.classList.add('stone', board[r][c]);
                cell.appendChild(stone);
            }
            boardElement.appendChild(cell);
        }
    }
}

function updateMessage() {
    messageElement.textContent = `現在のターン: ${currentPlayer === 'black' ? '黒' : '白'}`;
}

/**
 * 石を置いた際に反転する石をチェックし、反転させる関数
 * @param {number} r - 石を置いたマスの行
 * @param {number} c - 石を置いたマスの列
 * @param {string} player - 現在のプレイヤーの色 ('black' または 'white')
 * @param {boolean} isActualFlip - 実際に石を反転させるか（true）、または反転可能な石があるかだけをチェックするか（false）
 * @returns {{canPlace: boolean, flippedCount: number}} - 石を置けるかどうかの真偽値と、反転した石の数
 */
function checkAndFlipStones(r, c, player, isActualFlip) {
    const opponent = player === 'black' ? 'white' : 'black';
    let flippedStonesCount = 0;
    let canPlace = false;

    for (const [dr, dc] of directions) {
        let currentR = r + dr;
        let currentC = c + dc;
        const potentialFlips = [];

        while (currentR >= 0 && currentR < boardSize &&
               currentC >= 0 && currentC < boardSize &&
               board[currentR][currentC] === opponent) {
            potentialFlips.push({ row: currentR, col: currentC });
            currentR += dr;
            currentC += dc;
        }

        if (currentR >= 0 && currentR < boardSize &&
            currentC >= 0 && currentC < boardSize &&
            board[currentR][currentC] === player &&
            potentialFlips.length > 0) {
            
            canPlace = true;

            if (isActualFlip) {
                potentialFlips.forEach(pos => {
                    board[pos.row][pos.col] = player;
                    flippedStonesCount++;
                });
            }
        }
    }
    return { canPlace: canPlace, flippedCount: flippedStonesCount };
}

/**
 * 現在の盤面上の黒石と白石の数を数える
 * @returns {{black: number, white: number}} - 黒石と白石の数を含むオブジェクト
 */
function countStones() {
    let blackCount = 0;
    let whiteCount = 0;

    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === 'black') {
                blackCount++;
            } else if (board[r][c] === 'white') {
                whiteCount++;
            }
        }
    }
    return { black: blackCount, white: whiteCount };
}

/**
 * 特定のプレイヤーが打てる有効な手があるかをチェックする
 * @param {string} player - チェックするプレイヤーの色
 * @returns {boolean} - 有効な手があればtrue、なければfalse
 */
function hasValidMove(player) {
    for (let r = 0; r < boardSize; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (board[r][c] === null) {
                const { canPlace } = checkAndFlipStones(r, c, player, false);
                if (canPlace) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * ゲームの終了条件をチェックし、必要に応じてゲームを終了させる
 * @returns {boolean} - ゲームが終了した場合はtrue、そうでなければfalse
 */
function checkGameEnd() {
    const stones = countStones();

    // 1. 盤面が全て埋まっているか 
    if (stones.black + stones.white === boardSize * boardSize) {
        endGame(stones);
        return true;
    }

    // 2. 両者ともに打てる場所がないか 
    const canCurrentPlayerMove = hasValidMove(currentPlayer);
    const canOpponentMove = hasValidMove(currentPlayer === 'black' ? 'white' : 'black');

    if (!canCurrentPlayerMove && !canOpponentMove) {
        endGame(stones); // 両者打てない場合、ゲーム終了
        return true;
    } else if (!canCurrentPlayerMove) {
        // 現在のプレイヤーが打てない場合、パスして相手のターンにする 
        messageElement.textContent = `${currentPlayer === 'black' ? '黒' : '白'}はパスです。次のプレイヤーのターンです。`;
        currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
        updateMessage(); // パス後のメッセージを更新
        // パス後もまだ有効な手があるかチェックする必要がある
        // ここで再帰的に checkGameEnd を呼び出すか、次の handleCellClick のループでチェックさせる
        // ただし、無限ループにならないように注意
        if (!hasValidMove(currentPlayer)) { // パスされた側も打てない場合、ゲーム終了
            endGame(stones);
            return true;
        }
        return false; // ゲームはまだ終わっていない
    }
    return false; // ゲームはまだ終わっていない
}

/**
 * ゲーム終了時の処理と勝敗の表示
 * @param {{black: number, white: number}} finalStones - 最終的な黒石と白石の数
 */
function endGame(finalStones) {
    let winnerMessage = '';
    if (finalStones.black > finalStones.white) {
        winnerMessage = `黒の勝ち！ (${finalStones.black} 対 ${finalStones.white})`; // 個数が多い方が勝者 
    } else if (finalStones.white > finalStones.black) {
        winnerMessage = `白の勝ち！ (${finalStones.white} 対 ${finalStones.black})`; // 個数が多い方が勝者 
    } else {
        winnerMessage = `引き分け！ (${finalStones.black} 対 ${finalStones.white})`;
    }
    messageElement.textContent = `ゲーム終了！ ${winnerMessage}`;
    boardElement.removeEventListener('click', handleCellClick); // ゲーム終了後、クリックを無効にする
}

/**
 * セルがクリックされたときのイベントハンドラ
 * @param {Event} event - クリックイベントオブジェクト
 */
function handleCellClick(event) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    if (board[row][col] !== null) {
        alert('既に石が置かれています。');
        return;
    }

    // 石を置いた場合に反転する石があるかまずチェック（実際に反転させずに）
    const { canPlace } = checkAndFlipStones(row, col, currentPlayer, false);

    if (!canPlace) {
        alert('その場所には石を置けません。相手の石を挟める場所に置いてください。');
        return;
    }

    // 石を置く
    board[row][col] = currentPlayer;
    
    // 実際に石を反転させる
    checkAndFlipStones(row, col, currentPlayer, true);

    renderBoard(); // 盤面を再描画

    // ターンを切り替える前にゲーム終了チェックとパス処理
    // この時点ではまだcurrentPlayerは変更されていない
    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
    if (!hasValidMove(nextPlayer)) { // 次のプレイヤーに有効な手がない場合
        if (!hasValidMove(currentPlayer)) { // さらに現在のプレイヤーにも有効な手がない場合 (両者パス)
            checkGameEnd(); // ゲーム終了
            return;
        } else {
            // 次のプレイヤーはパス。現在のプレイヤーが再度打つ
            messageElement.textContent = `${nextPlayer === 'black' ? '黒' : '白'}はパスです。${currentPlayer === 'black' ? '黒' : '白'}のターンが続行します。`;
            // ターンは切り替えないので currentPlayer のまま
            updateMessage(); // メッセージ更新のみ
            return; // ターンは切り替えない
        }
    }

    // 通常のターン切り替え
    currentPlayer = nextPlayer;
    updateMessage(); // メッセージ更新

    // 石を置いた後、もし次のプレイヤーがパスになった場合を考慮して、改めてゲーム終了チェックを呼び出す
    checkGameEnd();
}

initializeBoard();
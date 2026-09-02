const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

// 🔴 ĐỔI ĐÚNG LINK WEB GAME CỦA BẠN VÀO ĐÂY (Có đầy đủ https://)
const TARGET_URL = 'https://r1w6b.88ipfh.com/home/?inviteCode=4843053#/'; 

app.use('/', createProxyMiddleware({
    target: TARGET_URL,
    changeOrigin: true,
    secure: false,
    ws: true, // Hỗ trợ WebSocket nếu game dùng kết nối thời gian thực
    selfHandleResponse: true,
    onProxyRes: async function (proxyRes, req, res) {
        let body = [];
        proxyRes.on('data', chunk => body.push(chunk));
        proxyRes.on('end', function () {
            body = Buffer.concat(body).toString();
            
            const robotOverlayCode = `
            <style>
                @keyframes pulseGlow {
                    0% { transform: scale(1); filter: drop-shadow(0 0 2px #00ffcc); }
                    50% { transform: scale(1.35); filter: drop-shadow(0 0 15px #ffff00); }
                    100% { transform: scale(1); filter: drop-shadow(0 0 2px #00ffcc); }
                }
                .robot-card {
                    position: fixed; top: 80px; left: 15px; z-index: 999999;
                    width: 285px; padding: 12px; border-radius: 16px;
                    background: rgba(12, 18, 34, 0.92);
                    backdrop-filter: blur(10px);
                    border: 1.5px solid #00ffcc;
                    box-shadow: 0 0 12px rgba(0, 255, 204, 0.35);
                    font-family: 'Segoe UI', Arial, sans-serif;
                    color: #fff; touch-action: none; user-select: none;
                }
                .tx-box {
                    display: flex; justify-content: space-around; align-items: center;
                    margin: 10px 0; padding: 6px; background: rgba(0,0,0,0.4);
                    border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
                }
                .tx-item {
                    font-size: 22px; font-weight: 900; color: #666;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .tx-active-tai { color: #00ffcc !important; text-shadow: 0 0 12px #00ffcc; }
                .tx-active-xiu { color: #ff0055 !important; text-shadow: 0 0 12px #ff0055; }
                .tx-winner { animation: pulseGlow 0.6s ease-in-out 2; font-size: 28px !important; }
                .history-dot {
                    width: 13px; height: 13px; border-radius: 50%; display: inline-block;
                    margin: 0 2px; border: 1px solid #444; flex-shrink: 0;
                }
                .dot-tai { background: #111; border-color: #00ffcc; box-shadow: 0 0 4px #00ffcc; }
                .dot-xiu { background: #fff; border-color: #fff; box-shadow: 0 0 4px #fff; }
                .not-in-game {
                    font-size: 13px !important; color: #ff9900 !important; font-weight: bold;
                    text-shadow: 0 0 8px #ff9900;
                }
            </style>

            <div id="robotWidget" class="robot-card">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(0,255,204,0.25); padding-bottom:5px; cursor:move;">
                    <div style="font-size:11px; color:#00ffcc; font-weight:bold; letter-spacing:0.5px;">
                        🤖 AI SOI CẦU SYSTEM
                    </div>
                    <div id="timerBox" style="font-size:14px; color:#ff0055; font-weight:bold;">--</div>
                </div>

                <div class="tx-box">
                    <div id="btnTai" class="tx-item">TÀI</div>
                    <div style="font-size:11px; color:#aaa; text-align:center;" id="statusText">Đang soi cầu...</div>
                    <div id="btnXiu" class="tx-item">XỈU</div>
                </div>

                <div style="border-top:1px dashed rgba(255,255,255,0.15); padding-top:5px;">
                    <div style="font-size:9px; color:#aaa; margin-bottom:3px;">LỊCH SỬ (● TÀI | ○ XỈU):</div>
                    <div id="historyRow" style="display:flex; justify-content:flex-start; align-items:center; overflow-x:auto; padding:2px 0;"></div>
                </div>
            </div>

            <script>
                const widget = document.getElementById('robotWidget');
                let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

                widget.addEventListener('touchstart', e => {
                    initialX = e.touches[0].clientX - xOffset;
                    initialY = e.touches[0].clientY - yOffset;
                    isDragging = true;
                }, false);
                document.addEventListener('touchend', () => isDragging = false, false);
                document.addEventListener('touchmove', e => {
                    if (isDragging) {
                        e.preventDefault();
                        currentX = e.touches[0].clientX - initialX;
                        currentY = e.touches[0].clientY - initialY;
                        xOffset = currentX; yOffset = currentY;
                        widget.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
                    }
                }, { passive: false });

                let historyData = ['TÀI', 'XỈU', 'TÀI', 'TÀI', 'XỈU', 'XỈU', 'TÀI']; 
                let predictedSide = '';
                let hasPredictedThisSession = false;

                function getRealTimeFromGame() {
                    const allElements = document.querySelectorAll('span, div, p, font, b');
                    for (let el of allElements) {
                        const val = parseInt((el.innerText || el.textContent || '').trim());
                        if (!isNaN(val) && val >= 0 && val <= 60 && el.id !== 'timerBox' && !widget.contains(el)) {
                            if (el.children.length === 0) {
                                return val;
                            }
                        }
                    }
                    return null;
                }

                function renderHistory() {
                    const row = document.getElementById('historyRow');
                    row.innerHTML = '';
                    historyData.slice(-12).forEach(item => {
                        const dot = document.createElement('span');
                        dot.className = 'history-dot ' + (item === 'TÀI' ? 'dot-tai' : 'dot-xiu');
                        row.appendChild(dot);
                    });
                }

                function advancedSoiCau() {
                    const len = historyData.length;
                    if (len < 4) return Math.random() > 0.5 ? 'TÀI' : 'XỈU';

                    const h = historyData;
                    const c1 = h[len - 1], c2 = h[len - 2], c3 = h[len - 3], c4 = h[len - 4], c5 = len >= 5 ? h[len - 5] : null;

                    if (c1 === c2 && c2 === c3 && c3 === c4) return c1 === 'TÀI' ? 'XỈU' : 'TÀI';
                    if (c1 !== c2 && c2 !== c3 && c3 === c4) return c1 === 'TÀI' ? 'XỈU' : 'TÀI';
                    if (c1 === c2 && c2 !== c3 && c3 === c4) return c1 === 'TÀI' ? 'XỈU' : 'TÀI';
                    if (c5 && c1 !== c2 && c2 === c3 && c3 === c4) return c1 === 'TÀI' ? 'XỈU' : 'TÀI';
                    
                    return c1;
                }

                function resetDisplayStatus() {
                    const btnTai = document.getElementById('btnTai');
                    const btnXiu = document.getElementById('btnXiu');
                    btnTai.className = 'tx-item';
                    btnXiu.className = 'tx-item';
                    document.getElementById('statusText').className = '';
                    document.getElementById('statusText').innerText = 'Đang soi cầu...';
                    document.getElementById('statusText').style.color = '#aaa';
                }

                setInterval(() => {
                    const realTime = getRealTimeFromGame();

                    if (realTime === null) {
                        resetDisplayStatus();
                        document.getElementById('timerBox').innerText = '--';
                        document.getElementById('statusText').className = 'not-in-game';
                        document.getElementById('statusText').innerText = 'Vui lòng vào bàn chơi';
                        hasPredictedThisSession = false;
                        return;
                    }

                    document.getElementById('timerBox').innerText = realTime + 's';

                    if (realTime > 20) {
                        resetDisplayStatus();
                        hasPredictedThisSession = false;
                    } 
                    else if (realTime <= 20 && realTime > 0) {
                        if (!hasPredictedThisSession) {
                            predictedSide = advancedSoiCau();
                            hasPredictedThisSession = true;
                        }

                        document.getElementById('statusText').className = '';
                        document.getElementById('statusText').innerText = 'DỰ ĐOÁN';
                        document.getElementById('statusText').style.color = '#ffff00';

                        const btnTai = document.getElementById('btnTai');
                        const btnXiu = document.getElementById('btnXiu');

                        if (predictedSide === 'TÀI') {
                            btnTai.className = 'tx-item tx-active-tai';
                            btnXiu.className = 'tx-item';
                        } else {
                            btnXiu.className = 'tx-item tx-active-xiu';
                            btnTai.className = 'tx-item';
                        }
                    }
                    else if (realTime === 0) {
                        if (hasPredictedThisSession) {
                            const winBtn = predictedSide === 'TÀI' ? document.getElementById('btnTai') : document.getElementById('btnXiu');
                            winBtn.classList.add('tx-winner');
                            document.getElementById('statusText').innerText = 'KẾT QUẢ';

                            historyData.push(predictedSide);
                            renderHistory();
                            hasPredictedThisSession = false;

                            setTimeout(resetDisplayStatus, 3000);
                        }
                    }
                }, 300);

                renderHistory();
            </script>
            `;

            if (body.includes('</body>')) {
                body = body.replace('</body>', robotOverlayCode + '</body>');
            } else {
                body = body + robotOverlayCode;
            }

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(body);
        });
    },
    onError: function (err, req, res) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Không thể kết nối đến web game gốc. Vui lòng kiểm tra lại đường link TARGET_URL.');
    }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

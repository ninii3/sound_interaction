// ==========================================
// Task 2: 动态控制 (带中间倒计时)
// ==========================================

// --- 阶段状态定义 ---
const T2_PHASE_IDLE = 0;
const T2_PHASE_RISE = 1;  // 0-8秒: 渐强
const T2_PHASE_REST = 2;  // 8-10秒: 休息 (2秒倒计时)
const T2_PHASE_FALL = 3;  // 10-18秒: 渐弱
const T2_PHASE_DONE = 4;
const T2_PHASE_FAIL = 5;  // 失败状态

// 全局状态变量
let t2State = T2_PHASE_IDLE;
let t2LocalTimer = 0; 
let t2FailTimer = 0;  
let t2FailReason = ""; 

// --- 配置参数 ---
const T2_RISE_TIME = 8.0;
const T2_REST_TIME = 2.0;
const T2_FALL_TIME = 8.0;

// 气压参数 
const T2_MIN_P = 15;  
const T2_MAX_P = 500; 
const T2_TOLERANCE = 150; 

// 颜色定义
const C_GRADIENT_LOW  = '#d2d8cd'; // 灰绿
const C_GRADIENT_HIGH = '#a4f76a'; // 亮绿
const C_GUIDE_LINE    = '#a4f76a'; // 引导线颜色

function drawTask2_Dynamics() {
  drawBackButton(); 

  // ============================
  // 1. 布局计算
  // ============================
  let leftMargin = windowWidth * 0.1;
  let chartW = windowWidth * 0.55; 
  let chartH = windowHeight * 0.5; 
  let chartY = windowHeight * 0.25; 
  let centerY = chartY + chartH / 2; 
  
  let uiX = leftMargin + chartW + windowWidth * 0.05;
  let uiY = chartY;

  let gap = 20; 
  let triangleW = (chartW - gap) / 2;

  let xStart = leftMargin;
  let xMid1 = xStart + triangleW; // 左三角结束
  let xMid2 = xMid1 + gap;        // 右三角开始
  let xEnd = xMid2 + triangleW;   // 右三角结束

  let axisBottomY = chartY + chartH;
  let axisTopY = chartY;

  // ============================
  // 2. 逻辑控制
  // ============================
  let targetP = 0;
  let isActive = false;

  // 状态流转
  if (t2State === T2_PHASE_IDLE) {
    if (sensorP > 20) {
      t2State = T2_PHASE_RISE;
      t2LocalTimer = 0;
      t2FailTimer = 0;
    }
  } 
  else if (t2State === T2_PHASE_RISE) {
    isActive = true;
    t2LocalTimer += deltaTime / 1000.0;
    let progress = t2LocalTimer / T2_RISE_TIME;
    targetP = lerp(T2_MIN_P, T2_MAX_P, progress);
    
    if (t2LocalTimer >= T2_RISE_TIME) {
      t2LocalTimer = 0;
      t2State = T2_PHASE_REST;
    }
  } 
  else if (t2State === T2_PHASE_REST) {
    isActive = false; // 休息阶段不检测失败
    t2LocalTimer += deltaTime / 1000.0;
    targetP = 0; 
    if (t2LocalTimer >= T2_REST_TIME) {
      t2LocalTimer = 0;
      t2State = T2_PHASE_FALL;
    }
  } 
  else if (t2State === T2_PHASE_FALL) {
    isActive = true;
    t2LocalTimer += deltaTime / 1000.0;
    let progress = t2LocalTimer / T2_FALL_TIME;
    targetP = lerp(T2_MAX_P, T2_MIN_P, progress);
    
    if (t2LocalTimer >= T2_FALL_TIME) {
      t2State = T2_PHASE_DONE;
    }
  }
  else if (t2State === T2_PHASE_FAIL || t2State === T2_PHASE_DONE) {
     isActive = false;
     if (t2FailTimer < 1.0) t2FailTimer += deltaTime / 1000.0; 
     else if (sensorP > 20) initTask2(); 
  }

  // --- 失败检测 ---
  if (isActive) {
    let currentFail = false;
    let reason = "";

    if (sensorP < 10) {
       currentFail = true; reason = "中途断气";
    } else if (abs(sensorP - targetP) > T2_TOLERANCE) {
       currentFail = true; reason = sensorP > targetP ? "力度过强" : "力度过弱";
    }

    if (currentFail) {
      t2FailTimer += deltaTime / 1000.0;
      if (t2FailTimer > 0.5) { 
        t2State = T2_PHASE_FAIL;
        t2FailReason = reason;
        t2FailTimer = 0; 
      }
    } else {
      t2FailTimer = 0;
    }
  }

  // ============================
  // 3. 绘制图形
  // ============================
  
  // A. 坐标轴
  stroke(0); strokeWeight(2);
  line(xStart, axisTopY, xStart, axisBottomY); 
  line(xStart, axisBottomY, xEnd, axisBottomY); 
  
  noStroke(); fill(0); textSize(18); textAlign(CENTER, TOP);
  text("吹气气柱", xStart + chartW/2, axisBottomY + 15);
  
  push();
  translate(xStart - 30, centerY);
  rotate(-HALF_PI);
  textAlign(CENTER, BOTTOM);
  text("气压", 0, 0);
  pop();

  // B. 三角形顶点
  let maxHalfH = chartH * 0.4; 
  let pL_Start = createVector(xStart, centerY);
  let pL_Top   = createVector(xMid1, centerY - maxHalfH);
  let pL_Bot   = createVector(xMid1, centerY + maxHalfH);
  let pR_Top   = createVector(xMid2, centerY - maxHalfH);
  let pR_Bot   = createVector(xMid2, centerY + maxHalfH);
  let pR_End   = createVector(xEnd, centerY);

  // C. 静态轮廓
  stroke(0); strokeWeight(1); fill(255);
  triangle(pL_Start.x, pL_Start.y, pL_Top.x, pL_Top.y, pL_Bot.x, pL_Bot.y);
  triangle(pR_Top.x, pR_Top.y, pR_Bot.x, pR_Bot.y, pR_End.x, pR_End.y);

  // D. 动态填充
  noStroke();
  
  // 左三角形
  if (t2State >= T2_PHASE_RISE) {
    let progress = 1.0;
    if (t2State === T2_PHASE_RISE) progress = t2LocalTimer / T2_RISE_TIME;
    if (t2State === T2_PHASE_FAIL && targetP > 0) progress = constrain(progress, 0, 1); 

    let currX = map(progress, 0, 1, xStart, xMid1);
    
    let gLeft = drawingContext.createLinearGradient(xStart, 0, xMid1, 0);
    gLeft.addColorStop(0, C_GRADIENT_LOW);   
    gLeft.addColorStop(1, C_GRADIENT_HIGH);  
    
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(xStart, axisTopY, currX - xStart, chartH);
    drawingContext.clip();
    
    drawingContext.fillStyle = gLeft;
    triangle(pL_Start.x, pL_Start.y, pL_Top.x, pL_Top.y, pL_Bot.x, pL_Bot.y);
    drawingContext.restore();
  }

  // 右三角形
  if (t2State >= T2_PHASE_FALL && t2State !== T2_PHASE_FAIL) {
    let progress = 0.0;
    if (t2State === T2_PHASE_FALL) progress = t2LocalTimer / T2_FALL_TIME;
    if (t2State === T2_PHASE_DONE) progress = 1.0;
    
    let currX = map(progress, 0, 1, xMid2, xEnd);
    
    let gRight = drawingContext.createLinearGradient(xMid2, 0, xEnd, 0);
    gRight.addColorStop(0, C_GRADIENT_HIGH); 
    gRight.addColorStop(1, C_GRADIENT_LOW);  
    
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(xMid2, axisTopY, currX - xMid2, chartH);
    drawingContext.clip();
    
    drawingContext.fillStyle = gRight;
    triangle(pR_Top.x, pR_Top.y, pR_Bot.x, pR_Bot.y, pR_End.x, pR_End.y);
    drawingContext.restore();
  }

  // E. 引导指示器
  if (isActive) {
    let guideX, guideY_Top, guideY_Bot;
    if (t2State === T2_PHASE_RISE) {
      let p = t2LocalTimer / T2_RISE_TIME;
      guideX = map(p, 0, 1, xStart, xMid1);
      let h = map(p, 0, 1, 0, maxHalfH);
      guideY_Top = centerY - h;
      guideY_Bot = centerY + h;
    } else {
      let p = t2LocalTimer / T2_FALL_TIME;
      guideX = map(p, 0, 1, xMid2, xEnd);
      let h = map(p, 0, 1, maxHalfH, 0);
      guideY_Top = centerY - h;
      guideY_Bot = centerY + h;
    }

    stroke(C_GUIDE_LINE); strokeWeight(3);
    line(guideX, guideY_Top, guideX, guideY_Bot);
    
    let userH = map(sensorP, 0, 600, 0, maxHalfH * 1.5);
    noStroke(); fill(50, 50, 50); 
    ellipse(guideX, centerY - userH, 10, 10);
    ellipse(guideX, centerY + userH, 10, 10);
  }

  // ============================
  // 4. 状态叠加文字 (半透明)
  // ============================
  // 【新增】中间倒计时逻辑放在这里
  if (t2State === T2_PHASE_DONE || t2State === T2_PHASE_FAIL) {
    push();
    textAlign(CENTER, CENTER); textSize(100); textStyle(BOLD); noStroke();
    
    if (t2State === T2_PHASE_DONE) {
      fill(0, 50); 
      text("任务完成", xStart + chartW/2, centerY);
    } else {
      fill(200, 0, 0, 50); 
      text("任务失败", xStart + chartW/2, centerY);
    }
    pop();
  } 
  else if (t2State === T2_PHASE_REST) {
    // === 这里是新增的倒计时代码 ===
    let restTime = ceil(T2_REST_TIME - t2LocalTimer); // 计算剩余秒数 (2, 1)
    
    push();
    textAlign(CENTER, CENTER); noStroke();
    
    // 倒计时数字
    textSize(140); textStyle(BOLD); fill(0, 100); // 半透明黑色
    text(restTime, xStart + chartW/2, centerY - 20);
    
    // 辅助提示文字
    textSize(32); textStyle(NORMAL); fill(0, 150);
    text("准备减弱...", xStart + chartW/2, centerY + 80);
    pop();
  }

  // ============================
  // 5. 右侧 UI
  // ============================
  drawT2RightPanel(uiX, uiY, uiY + chartH / 2);
}

function drawT2RightPanel(x, y, centerY) {
  let barW = 160; let barH = 50; 
  let radius = barH / 2;
  
  // 1. 胶囊进度条
  let totalProg = 0;
  if (t2State === T2_PHASE_RISE) totalProg = t2LocalTimer;
  else if (t2State === T2_PHASE_REST) totalProg = 8 + t2LocalTimer;
  else if (t2State === T2_PHASE_FALL) totalProg = 10 + t2LocalTimer;
  else if (t2State === T2_PHASE_DONE) totalProg = 18;
  
  let pct = map(totalProg, 0, 18, 0, barW);
  
  stroke(100); strokeWeight(2); noFill();
  rect(x, y + 40, barW, barH, radius);
  
  push();
  noStroke(); fill(100);
  drawingContext.beginPath();
  drawingContext.roundRect(x, y + 40, barW, barH, radius);
  drawingContext.clip();
  rect(x, y + 40, pct, barH);
  pop();

  // 2. 倒计时数字
  let displayTime = "8s"; 
  if (t2State === T2_PHASE_RISE) displayTime = ceil(8 - t2LocalTimer) + "s";
  else if (t2State === T2_PHASE_REST) displayTime = "-"; // 中间态右侧显示横杠
  else if (t2State === T2_PHASE_FALL) displayTime = ceil(8 - t2LocalTimer) + "s";
  else if (t2State === T2_PHASE_DONE) displayTime = "OK";
  else if (t2State === T2_PHASE_FAIL) displayTime = "-"; 
  
  noStroke(); fill(80); textSize(90); textStyle(BOLD); textAlign(CENTER, TOP);
  text(displayTime, x + barW / 2, y + barH + 60);

  // 3. 说明文字
  noStroke(); fill(0); textSize(22); textStyle(NORMAL); textAlign(LEFT, TOP); textLeading(34);
  let txtY = y + barH + 180;
  
  if (t2State === T2_PHASE_IDLE) {
    text("请吹气开始。\n目标：控制力度填\n充绿色区域。", x, txtY);
  } else if (t2State === T2_PHASE_FAIL) {
    fill(0); 
    text(`任务失败：\n${t2FailReason}\n\n再次吹气\n重新开始。`, x, txtY);
  } else if (t2State === T2_PHASE_DONE) {
    fill(0, 150, 0);
    text("任务完成！\n呼吸控制非常完美。\n\n再次吹气\n重新开始。", x, txtY);
  } else if (t2State === T2_PHASE_REST) {
    text("保持准备...\n即将开始减弱\n力度控制。", x, txtY);
  } else {
    text("请在8秒内完成吹\n气力度由弱至强的\n过渡，紧接着用8\n秒完成由强至弱的\n过渡。", x, txtY);
  }
}

function initTask2() {
  t2State = T2_PHASE_IDLE;
  t2LocalTimer = 0;
  t2FailTimer = 0;
  t2FailReason = "";
}
// ==========================================
// Task 4: 自由探索任务 (Free Exploration)
// [修复] 补全全局变量声明，解决报错
// ==========================================

let task4Timer = 0;        
let task4IsRunning = false;
let task4Completed = false;

// 配置参数
const TASK4_DURATION = 45.0; // 45秒
const START_THRESHOLD = 10;  // 启动阈值

function initTask4() {
  task4Timer = 0;
  task4IsRunning = false;
  task4Completed = false;
}

function drawTask4_Free() {
  drawBackButton();

  let leftMargin = windowWidth * 0.15;      
  let bottomMargin = windowHeight * 0.15;    
  let axisWidth = windowWidth * 0.55; 
  let axisHeight = windowHeight * 0.6; 
  
  let originX = leftMargin;
  let originY = height - bottomMargin;
  let topY = originY - axisHeight;     
  let centerX = originX + axisWidth / 2;
  let rightPanelX = originX + axisWidth + (windowWidth * 0.05);

  // 逻辑
  if (!task4Completed) {
      if (!task4IsRunning && sensorP > START_THRESHOLD) {
          task4IsRunning = true;
      }
      if (task4IsRunning) {
          task4Timer += deltaTime / 1000.0;
      }
      if (task4Timer >= TASK4_DURATION) {
          task4Completed = true;
      }
  }

  // 坐标轴
  stroke(0); strokeWeight(2);
  line(originX, topY, originX, originY); 
  line(originX, originY, originX + axisWidth, originY); 
  
  noStroke(); fill(0); textSize(18); textAlign(CENTER, TOP);
  text("吹气气柱", centerX, originY + 20);
  
  push(); 
  translate(originX - 30, originY - axisHeight/2); 
  rotate(-HALF_PI); 
  textAlign(CENTER, BOTTOM); 
  text("气压", 0, 0); 
  pop();

  // ============================
  // [修改] 气柱颜色更新
  // 下方: #d0d1ce -> 上方: #a5f76b
  // ============================
  let barW = 200; 
  let currentBarH = map(sensorP, 0, MAX_SENSOR_VAL, 0, axisHeight);
  currentBarH = constrain(currentBarH, 0, axisHeight);

  if (currentBarH > 0) {
      let gradient = drawingContext.createLinearGradient(centerX, originY, centerX, originY - currentBarH);
      
      gradient.addColorStop(0, '#d0d1ce'); // 底部浅灰
      gradient.addColorStop(1, '#a5f76b'); // 顶部亮绿
      
      drawingContext.fillStyle = gradient;
      noStroke();
      rectMode(CORNER);
      rect(centerX - barW/2, originY - currentBarH, barW, currentBarH);
  }

  // UI
  let uiBarW = 160; let uiBarH = 40; let uiRefY = topY + 40; let radius = uiBarH / 2;

  let timeLeft = max(0, TASK4_DURATION - task4Timer);
  let progressPct = map(timeLeft, 0, TASK4_DURATION, 0, uiBarW);
  
  push(); drawingContext.beginPath(); drawingContext.roundRect(rightPanelX, uiRefY, uiBarW, uiBarH, radius); drawingContext.clip(); 
  noStroke(); fill(240); rect(rightPanelX, uiRefY, uiBarW, uiBarH); 
  fill(100); rect(rightPanelX, uiRefY, progressPct, uiBarH);        
  pop(); noFill(); stroke(100); strokeWeight(2); rect(rightPanelX, uiRefY, uiBarW, uiBarH, radius);

  let timeStr = timeLeft.toFixed(0) + "s"; 
  noStroke(); fill(80); textSize(80); textStyle(BOLD); textAlign(CENTER, TOP);
  text(timeStr, rightPanelX + uiBarW / 2, uiRefY + uiBarH + 10);

  noStroke(); fill(0); textSize(22); textStyle(NORMAL); textAlign(LEFT, TOP); textLeading(34);
  
  let instruction = "随意吹奏感受，看\n看它能否吹出你想\n要的轻重变化。";
  
  if (task4Completed) {
      instruction = "探索结束！\n感谢您的参与。";
      fill(0, 150, 0);
  } else if (!task4IsRunning) {
      instruction = "请吹气开始计时...\n随意吹奏感受。";
      fill(100);
  }
  
  text(instruction, rightPanelX, uiRefY + uiBarH + 160);
}
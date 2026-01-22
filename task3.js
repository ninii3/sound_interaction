let task3Blocks = [];      
let task3TotalBlocks = 10; 
let task3Timer = 0;        
let task3IsRunning = false;
let task3Completed = false;
let task3HitCount = 0;     
let task3WaitingForReset = false; 


let currentBarHeight = 0;    
let barState = 0; // 0: IDLE, 1: RISING, 2: FALLING


const BAR_MAX_HEIGHT_RATIO = 0.8; 
const BAR_RISE_DURATION = 0.15;   
const BAR_FALL_DURATION = 0.4;    
const TRIGGER_THRESHOLD = 30;     

const MATCH_TOLERANCE = 15;       

const TOTAL_DURATION = 10.0; 
const BLOCK_COUNT = 10;      
const SPAWN_INTERVAL = 0.8;  

let BLOCK_SPEED = 0;         


class RhythmBlock {
  constructor(spawnTime) {
    this.spawnTime = spawnTime;
    this.active = false;
    this.y = -100;       
    this.w = 120;        
    this.h = 40;         
    
    this.isHit = false;    
    this.isMissed = false; 
    this.colorState = 0; 
  }

  update(currentTime, originY) {
    if (!this.active && currentTime >= this.spawnTime) {
      this.active = true;
      let timeDelta = currentTime - this.spawnTime;
      this.y = -50 + timeDelta * BLOCK_SPEED;
    }

    if (this.active) {
      this.y += BLOCK_SPEED * (deltaTime / 1000.0);
      if (!this.isHit && this.y > originY + 50) {
          this.isMissed = true;
      }
    }
  }

  checkCollision(targetLineY) {
      if (this.isHit || this.isMissed || !this.active) return false;
      let blockTopY = this.y - this.h / 2;
      let diff = abs(blockTopY - targetLineY);
      if (diff < MATCH_TOLERANCE) {
          this.isHit = true;
          this.colorState = 1;
          return true;
      }
      return false;
  }

  draw(centerX) {
    if (!this.active) return; 
    rectMode(CENTER);
    strokeWeight(2);
    if (this.isHit) {
      drawingContext.shadowBlur = 30;
      drawingContext.shadowColor = '#00ff00';
      fill('#00ff00'); stroke('#005500'); 
    } else if (this.isMissed) {
      drawingContext.shadowBlur = 0;
      fill(220); stroke(200); 
    } else {
      drawingContext.shadowBlur = 0;
      fill(255); stroke(0); 
    }
    rect(centerX, this.y, this.w, this.h);
    drawingContext.shadowBlur = 0; 
  }
}


function initTask3() {
  task3Blocks = [];
  task3IsRunning = false;
  task3Completed = false;
  task3HitCount = 0;
  task3Timer = 0;
  task3WaitingForReset = false; 
  currentBarHeight = 0; 
  barState = 0;
  for (let i = 0; i < BLOCK_COUNT; i++) {
    let spawnT = 0.5 + i * SPAWN_INTERVAL; 
    task3Blocks.push(new RhythmBlock(spawnT));
  }
}

function drawTask3_Rhythm() {
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

  let maxBarH = axisHeight * BAR_MAX_HEIGHT_RATIO;
  let targetHitY = originY - maxBarH; 
  
  if (BLOCK_SPEED === 0) {
      BLOCK_SPEED = (targetHitY - (-50)) / 2.0; 
  }


  let riseSpeed = maxBarH / BAR_RISE_DURATION;
  let fallSpeed = maxBarH / BAR_FALL_DURATION;

  if (barState === 0 && sensorP > TRIGGER_THRESHOLD) {
      barState = 1; 
  }

  if (barState === 1) { 
      currentBarHeight += riseSpeed * (deltaTime / 1000.0);
      if (currentBarHeight >= maxBarH) {
          currentBarHeight = maxBarH;
          checkAllCollisions(targetHitY); 
          barState = 2; 
      }
  } else if (barState === 2) {
      currentBarHeight -= fallSpeed * (deltaTime / 1000.0);
      if (currentBarHeight <= 0) {
          currentBarHeight = 0;
          barState = 0; 
      }
  } else {
      currentBarHeight = 0;
  }

  if (!task3Completed) {
      if (isSystemActive) { 
        if (!task3IsRunning && millis() > 1000) task3IsRunning = true;
      }
      if (task3IsRunning) {
          task3Timer += deltaTime / 1000.0;
      }
      for (let b of task3Blocks) {
          b.update(task3Timer, originY);
      }
      if (task3Timer > TOTAL_DURATION + 2.5) {
          task3Completed = true;
          task3WaitingForReset = true;
      }
  } else {
      if (task3WaitingForReset) {
          if (sensorP < 10) task3WaitingForReset = false; 
      } else {
          if (sensorP > 20) initTask3(); 
      }
  }

  //坐标轴 
  
  stroke(0); strokeWeight(2);
  line(originX, topY, originX, originY); 
  line(originX, originY, originX + axisWidth, originY); 
  
  // 判定线
  drawingContext.setLineDash([5, 5]);
  stroke(150); strokeWeight(1);
  line(originX, targetHitY, originX + axisWidth, targetHitY);
  drawingContext.setLineDash([]); 

  // 标签
  noStroke(); fill(0); textSize(18); textAlign(CENTER, TOP);
  text("吹气气柱", centerX, originY + 20);
  fill(150); textSize(14); textAlign(LEFT, BOTTOM);
  text("Target Line", originX + 5, targetHitY - 5);
  
  push(); 
  translate(originX - 30, originY - axisHeight/2); 
  rotate(-HALF_PI); 
  textAlign(CENTER, BOTTOM); fill(0);
  text("气压", 0, 0); 
  pop();


  let barW = 180; 
  if (currentBarHeight > 1) {
      let gradient = drawingContext.createLinearGradient(centerX, originY, centerX, originY - currentBarHeight);
      
      // Stop 0 (底部): #d0d1ce
      gradient.addColorStop(0, '#d0d1ce'); 
      // Stop 1 (顶部): #a5f76b
      gradient.addColorStop(1, '#a5f76b');   
      
      drawingContext.fillStyle = gradient;
      noStroke();
      rectMode(CORNER);
      rect(centerX - barW/2, originY - currentBarHeight, barW, currentBarHeight);
  }

  // 绘图：方块 
  push();
  drawingContext.beginPath();
  drawingContext.rect(originX, topY - 200, axisWidth, axisHeight + 200);
  drawingContext.clip();
  for (let b of task3Blocks) {
      b.draw(centerX);
  }
  pop();

  // UI
  drawTask3UI(rightPanelX, topY);
}

function checkAllCollisions(targetY) {
    for (let b of task3Blocks) {
        if (b.checkCollision(targetY)) {
            task3HitCount++;
            break; 
        }
    }
}

function drawTask3UI(x, topY) {
  let uiBarW = 160; let uiBarH = 40; let uiRefY = topY + 40; let radius = uiBarH / 2;

  let timeLeft = max(0, TOTAL_DURATION - task3Timer);
  let progressPct = map(timeLeft, 0, TOTAL_DURATION, 0, uiBarW);
  
  push(); drawingContext.beginPath(); drawingContext.roundRect(x, uiRefY, uiBarW, uiBarH, radius); drawingContext.clip(); 
  noStroke(); fill(240); rect(x, uiRefY, uiBarW, uiBarH); 
  fill(100); rect(x, uiRefY, progressPct, uiBarH);        
  pop(); noFill(); stroke(100); strokeWeight(2); rect(x, uiRefY, uiBarW, uiBarH, radius);

  let timeStr = timeLeft.toFixed(0) + "s"; 
  noStroke(); fill(80); textSize(80); textStyle(BOLD); textAlign(CENTER, TOP);
  text(timeStr, x + uiBarW / 2, uiRefY + uiBarH + 10);

  noStroke(); fill(0); textSize(22); textStyle(NORMAL); textAlign(LEFT, TOP); textLeading(34);
  let instruction = "请跟随节拍，吹奏\n发出十个短暂而快\n速的音。";
  
  if (task3Completed) {
      instruction = "任务结束！\n命中: " + task3HitCount + "/10\n再次吹气重新开始";
      fill(0, 150, 0); 
  }
  text(instruction, x, uiRefY + uiBarH + 160);
}
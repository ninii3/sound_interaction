let task5Timer = 0;          
let task5StableDuration = 0; 
let task5IsRunning = false;  
let task5Completed = false;

let stabilityBuffer = [];          
const BUFFER_SIZE = 30;            
const STABILITY_TOLERANCE = 40;    
const MIN_PRESSURE_THRESHOLD = 20; 
const PRE_STABLE_TIME = 2.0;       
const TARGET_DURATION = 10.0;      

function initTask5() {
  task5Timer = 0;
  task5StableDuration = 0;
  task5IsRunning = false;
  task5Completed = false;
  stabilityBuffer = [];
}

function drawTask5_Minimal() {
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
  let isCurrentlyStable = false;
  stabilityBuffer.push(sensorP);
  if (stabilityBuffer.length > BUFFER_SIZE) { stabilityBuffer.shift(); }
  if (stabilityBuffer.length > 5) {
      let minVal = 10000; let maxVal = -10000; let avgVal = 0;
      for (let val of stabilityBuffer) {
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
          avgVal += val;
      }
      avgVal /= stabilityBuffer.length;
      let range = maxVal - minVal;
      if (range < STABILITY_TOLERANCE && avgVal > MIN_PRESSURE_THRESHOLD) {
          isCurrentlyStable = true;
      }
  }

  if (!task5Completed) {
      if (isCurrentlyStable) {
          task5StableDuration += deltaTime / 1000.0;
          if (task5StableDuration >= PRE_STABLE_TIME) {
              task5IsRunning = true;
          }
          if (task5IsRunning) {
              task5Timer += deltaTime / 1000.0;
              if (task5Timer >= TARGET_DURATION) {
                  task5Timer = TARGET_DURATION;
                  task5Completed = true;
              }
          }
      } else {
          task5StableDuration = 0; 
          if (task5IsRunning) {
              task5IsRunning = false;
              task5Timer = 0; 
          }
      }
  }

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

  // 气柱 
  let barW = 200; 
  let currentBarH = map(sensorP, 0, 600, 0, axisHeight);
  currentBarH = constrain(currentBarH, 0, axisHeight);

  if (currentBarH > 0) {
      fill('#cccccc'); 
      noStroke();
      rectMode(CORNER);
      rect(centerX - barW/2, originY - currentBarH, barW, currentBarH);
  }

  let uiW = 160; let uiH = 50; 
  let uiRefY = topY + 40; 
  
  let uiX = rightPanelX + uiW / 2; 
  let uiY = uiRefY + uiH/2; 
  
  rectMode(CENTER);
  if (task5Completed) fill('#70e040'); 
  else if (task5IsRunning) fill('#555555'); 
  else fill('#e0e0e0'); 
  
  noStroke();
  drawingContext.beginPath(); 
  drawingContext.roundRect(uiX - uiW/2, uiY - uiH/2, uiW, uiH, 25); 
  drawingContext.fill();

  fill(task5IsRunning || task5Completed ? 255 : 100); 
  textSize(28); textStyle(BOLD); textAlign(CENTER, CENTER);
  
  if (task5Completed) {
      text("完成", uiX, uiY);
  } else if (task5IsRunning) {
      let remain = Math.ceil(TARGET_DURATION - task5Timer);
      text(remain + "s", uiX, uiY);
  } else {
      if (task5StableDuration > 0.5) {
          textSize(24);
          text("保持...", uiX, uiY); 
      } else {
          text("10s", uiX, uiY);
      }
  }

  fill(0); noStroke(); textAlign(LEFT, TOP);
  textSize(22); textStyle(NORMAL); textLeading(34); 
  
  let instruction = "请吹气将您的呼吸\n气柱维持在相对稳\n定的状态，并尝试\n保持10秒钟。";
  
  if (task5Completed) {
      instruction = "练习完成！\n您的气息控制\n非常稳定。";
      fill(0, 150, 0);
  } else if (!task5IsRunning && task5StableDuration < 0.1) {
      instruction = "请吹气将您的呼吸\n气柱维持在相对稳\n定的状态，并尝试\n保持10秒钟。";
  } else if (!task5IsRunning && task5StableDuration >= 0.1) {
       instruction = "正在检测稳定性...\n请保持当前力度\n不要波动。";
       fill(100);
  } else {
       instruction = "非常好，请保持！\n稳住气息...";
       fill(50);
  }
  
  text(instruction, rightPanelX, uiRefY + uiH + 120); 

}
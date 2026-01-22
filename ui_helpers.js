
function drawMenu() {
  textAlign(CENTER, CENTER);
  fill(50); noStroke();
  textSize(32); text("呼吸交互训练 - 主菜单", width / 2, height * 0.15); // 标题稍微上移
  
  let btnX = width / 2;
  let startY = height * 0.3; 
  let gap = 70; 
  
  // 按钮 1
  drawSimpleButton(btnX, startY, "任务 1: 长音控制", () => {
    currentState = "TASK1";
    if (typeof resetTask === 'function') resetTask();
  });
  
  // 按钮 2
  drawSimpleButton(btnX, startY + gap, "任务 2: 渐强渐弱", () => {
    currentState = "TASK2";
    if (typeof resetTask === 'function') resetTask();
  });
  
  // 按钮 3
  drawSimpleButton(btnX, startY + gap * 2, "任务 3: 节奏练习", () => {
    currentState = "TASK3";
    if (typeof initTask3 === 'function') initTask3();
  });

  // 按钮 4
  drawSimpleButton(btnX, startY + gap * 3, "任务 4: 自由探索", () => {
    currentState = "TASK4";
    if (typeof initTask4 === 'function') initTask4();
  });

  // 按钮 5
  drawSimpleButton(btnX, startY + gap * 4, "任务 5: 极简稳定", () => {
    currentState = "TASK5";
    if (typeof initTask5 === 'function') initTask5();
  });
}

function drawSimpleButton(x, y, label, onClick) {
  rectMode(CENTER);
  fill(240); stroke(0); strokeWeight(1);
  

  if (mouseX > x - 100 && mouseX < x + 100 && mouseY > y - 30 && mouseY < y + 30) {
    fill(220); // 悬停变深
    if (mouseIsPressed) {
       
        if (!window.isClicking) {
            onClick();
            window.isClicking = true;
            setTimeout(() => window.isClicking = false, 300);
        }
    }
  }
  
  rect(x, y, 200, 60, 10); 
  
  fill(0); noStroke(); textSize(18);
  text(label, x, y); 
  rectMode(CORNER); 
}


function drawBackButton() {
  fill(150); noStroke();

  if (mouseX < 80 && mouseY > 60 && mouseY < 100) fill(100);
  
  textSize(14); textAlign(LEFT, CENTER);
  text("← 返回菜单", 20, 80);
  
  if (mouseIsPressed && mouseX < 80 && mouseY > 60 && mouseY < 100) {
    currentState = "MENU";
 
    if (typeof task3IsRunning !== 'undefined') task3IsRunning = false;
  }
}


function drawDebugInfo() {
  fill(200); noStroke();
  textSize(12); textAlign(LEFT, BASELINE);
  let status = "进行中";
  if (typeof isTaskComplete !== 'undefined' && isTaskComplete) status = "任务完成";
  

  if (currentState === "TASK3" && typeof task3HitCount !== 'undefined') {
      status = `命中: ${task3HitCount}/10`;
  }

  text(`Sensor: ${int(sensorP)} | State: ${currentState} | ${status}`, 10, height - 10);
}
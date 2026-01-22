function drawTask1_Responsive() {
  drawBackButton();

  if (isTaskComplete) {
    if (sensorP < 10) waitingForNewBreath = true; 
    if (waitingForNewBreath && sensorP > 20) resetTask(); 
  }

  // 颜色
  const UI_COLORS = {
    targetZone: color(200, 200, 200),     
    progressBarFill: color(100, 100, 100),
    axisLine: color(0),                   
    gradientBottom: color('#d5d6d4'), 
    gradientTopHit: color('#a8f472'), 
    gradientTopMiss: color(150, 150, 150) 
  };

  let leftMargin = windowWidth * 0.15;      
  let bottomMargin = windowHeight * 0.15;    
  let axisWidth = windowWidth * 0.55; 
  let axisHeight = windowHeight * 0.6; 
  
  let originX = leftMargin;
  let originY = height - bottomMargin;
  let topY = originY - axisHeight;
  let rightPanelX = originX + axisWidth + (windowWidth * 0.05);
  let centerX = originX + axisWidth / 2; 

  stroke(0); strokeWeight(2);
  line(originX, topY, originX, originY); // Y轴
  line(originX, originY, originX + axisWidth, originY); // X轴
  
  // X轴标签
  noStroke(); fill(0); textSize(18); textAlign(CENTER, TOP);
  text("吹气气柱", centerX, originY + 20);
  
  // Y轴标签
  push(); 
  translate(originX - 30, originY - axisHeight/2); 
  rotate(-HALF_PI); 
  textAlign(CENTER, BOTTOM); 
  text("气压", 0, 0); 
  pop();

  let zoneH = axisHeight * 0.3; 
  let zoneY = topY + axisHeight * 0.2; 
  fill(UI_COLORS.targetZone); noStroke();
  rect(originX + 2, zoneY, axisWidth - 4, zoneH); 
  
  let breathPixelH = map(sensorP, 0, MAX_SENSOR_VAL, 0, axisHeight);
  let breathTopPixel = originY - breathPixelH;
  let isHit = (breathTopPixel >= zoneY && breathTopPixel <= zoneY + zoneH);

  let barWidth = axisWidth * 0.6; 
  let barX = originX + (axisWidth - barWidth) / 2; 
  
  let gradient = drawingContext.createLinearGradient(barX, originY, barX, breathTopPixel);
  gradient.addColorStop(0, UI_COLORS.gradientBottom.toString()); 
  if (isHit) {
      gradient.addColorStop(1, UI_COLORS.gradientTopHit.toString());
  } else {
      gradient.addColorStop(1, UI_COLORS.gradientTopMiss.toString());
  }
  
  drawingContext.fillStyle = gradient;
  noStroke();
  rect(barX, originY, barWidth, -breathPixelH);
  drawingContext.fillStyle = 'black'; 

  let barW = 160; let barH = 50; let barPosX = rightPanelX; let barPosY = topY + 40; let radius = barH / 2; 
  
  if (isHit && !isTaskComplete) {
    taskTimer += deltaTime / 1000.0;
    if (taskTimer >= 10.0) {
      taskTimer = 10.0;
      isTaskComplete = true;
      waitingForNewBreath = false; 
    }
  } 
  
  let progressW = map(taskTimer, 0, 10.0, 0, barW);
  
  push(); drawingContext.beginPath(); drawingContext.roundRect(barPosX, barPosY, barW, barH, radius); drawingContext.clip(); 
  noStroke(); fill(UI_COLORS.progressBarFill); rect(barPosX, barPosY, progressW, barH); pop(); 
  noStroke(); noFill(); stroke(100); strokeWeight(2); rect(barPosX, barPosY, barW, barH, radius);
  
  noStroke(); fill(80); textSize(90); textStyle(BOLD); textAlign(CENTER, TOP);
  text(int(taskTimer) + "s", barPosX + barW / 2, barPosY + barH + 20);
  
  noStroke(); fill(0); textSize(22); textStyle(NORMAL); textAlign(LEFT, TOP); textLeading(34); 
  let instructions = "请吹气将您的呼吸\n气柱吹至灰色目标\n区间，并尝试保持\n10秒钟。";
  if (isTaskComplete) instructions = ""; 
  
  text(instructions, barPosX, barPosY + barH + 160);

  if (isTaskComplete) {
    push();
    let barCenterX = barX + barWidth / 2;
    let chartCenterY = originY - axisHeight / 2;
    textAlign(CENTER, CENTER); textSize(120); textStyle(BOLD); noStroke();
    fill(0, 51); 
    text("任务结束", barCenterX, chartCenterY);
    pop();
  }
}
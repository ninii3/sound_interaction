
// 全局变量 
let port;
let mic; 
let sensorP = 0; // 气压值 (0-600)
let connectBtn;
let isSystemActive = false; 
let socket;


let currentState = "MENU"; 


let taskTimer = 0;       
let isTaskComplete = false;
let waitingForNewBreath = false; 


let task2Duration = 16.0; 
let task2History = [];    

const MAX_SENSOR_VAL = 600; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  socket = io('http://localhost:8081');
  

  port = createSerial();
  
  mic = new p5.AudioIn();

  connectBtn = createButton('点击开启系统 (连接 Arduino / 麦克风)');
  connectBtn.position(20, 20);
  
  connectBtn.style('padding', '10px 20px');
  connectBtn.style('font-size', '14px');
  connectBtn.style('border-radius', '5px');
  connectBtn.style('border', 'none');
  connectBtn.style('cursor', 'pointer');
  connectBtn.style('background-color', '#efefef'); // 浅灰
  connectBtn.style('color', 'black');
  connectBtn.style('transition', 'all 0.3s'); // 过渡动画
  
  connectBtn.mousePressed(toggleSystem);
}

function toggleSystem() {
  if (!isSystemActive) {
    
    getAudioContext().resume().then(() => {
      console.log('Audio Context Resumed');
      mic.start(); // 开启麦克风监听
    });

   // 尝试连接 Arduino
    if (!port.opened()) {
      port.open(115200); 
    }

    connectBtn.style('background-color', '#444444'); // 深灰
    connectBtn.style('color', 'white'); // 白字
    connectBtn.html('系统运行中 (点击断开)');
    
    isSystemActive = true;

  } else {
 
    if (port.opened()) {
      port.close();
    }
    
    connectBtn.style('background-color', '#efefef'); // 浅灰
    connectBtn.style('color', 'black'); // 黑字
    connectBtn.html('点击开启系统 (连接 Arduino / 麦克风)');
    
    isSystemActive = false;

    sensorP = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function draw() {
  background(255); 
  updateSensorData();

  if (currentState === "MENU") {
    drawMenu();              
  } else if (currentState === "TASK1") {
    drawTask1_Responsive();  
  } else if (currentState === "TASK2") {
    drawTask2_Dynamics();    
  } else if (currentState === "TASK3") {
    drawTask3_Rhythm(); 
  } else if (currentState === "TASK4") {
    drawTask4_Free();
  } else if (currentState === "TASK5") {

    drawTask5_Minimal();
  }
  
  drawDebugInfo();           
}
// 如果发现气柱抖动，这里可以调整平滑系数

function updateSensorData() {
  if (!isSystemActive) {
    sensorP = 0;
    return;
  }

  let rawVal = null; // 用于暂时存储从串口拿到的“最新”原始值

  // 获取目标值 (Arduino)
  if (port.opened()) {
    while (port.available() > 0) {
      let str = port.readUntil("\n");
      if (str.length > 0) {
        let parts = split(str.trim(), " ");
        if (parts.length >= 2) {
           let v = int(parts[1]);
           if (!isNaN(v)) rawVal = v; 
        }
      }
    }

  } 

  let targetP = sensorP; // 默认目标是当前值

  // 确定目标值：如果有读到新数据，就用新的；否则保持不变
  if (port.opened() && rawVal !== null) {
    targetP = rawVal;
  } else if (!port.opened()) {
    // 麦克风逻辑 (保持不变)
    let vol = 0;
    if (mic) { try { vol = mic.getLevel(); } catch(e) {} }
    targetP = map(vol, 0.0, 0.2, 0, MAX_SENSOR_VAL); 
  }

  // 2. 平滑处理 
  // 解决了积压问题后，这个 0.2 的平滑系数会让气柱看起来顺滑但不延迟
  sensorP = lerp(sensorP, constrain(targetP, 0, MAX_SENSOR_VAL), 0.2);
  
  // 3. 归零处理
  if (sensorP < 5) sensorP = 0; 
  if (socket && isSystemActive) {
      socket.emit('breath', sensorP);
  }
}
function resetTask() {
  taskTimer = 0;
  isTaskComplete = false;
  waitingForNewBreath = false;
  task2History = []; 
}
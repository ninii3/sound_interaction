
// 全局变量 
let port;
let mic; 
let sensorP = 0; // 气压值 (0-600)
let connectBtn;
let isSystemActive = false; 


let currentState = "MENU"; 


let taskTimer = 0;       
let isTaskComplete = false;
let waitingForNewBreath = false; 


let task2Duration = 16.0; 
let task2History = [];    

const MAX_SENSOR_VAL = 600; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  

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

  let targetP = sensorP; 

  // 1. 获取目标值 (Arduino 或 Mic)
  if (port.opened()) {
    if (port.available() > 0) {
      let str = port.readUntil("\n"); 
      if (str.length > 0) {
        let parts = split(str.trim(), " ");
        if (parts.length >= 2) {
          let val = int(parts[1]);
          // 只有当读取到的真的是数字时，才更新
          if (!isNaN(val)) {
            sensorP = val;
          }
        }
      }
    }
  } else {
    // 麦克风模拟逻辑
    let vol = 0;
    if (mic) { try { vol = mic.getLevel(); } catch(e) {} }
    targetP = map(vol, 0.0, 0.2, 0, MAX_SENSOR_VAL); 
  }

  // 2. 统一对 Arduino 和 Mic 进行平滑处理 (防止气柱抖动)
  // 0.2 是平滑系数，如果觉得 Arduino 反应慢了，可以改成 0.5 或更高
  sensorP = lerp(sensorP, constrain(targetP, 0, MAX_SENSOR_VAL), 0.2);
  
  // 3. 归零处理（当传感器读数小于某个阈值（比如 5）时，强制将其视为 0。）
  if (sensorP < 5) sensorP = 0; 
}

function resetTask() {
  taskTimer = 0;
  isTaskComplete = false;
  waitingForNewBreath = false;
  task2History = []; 
}
// bridge.js - 数据桥接器
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" } // 允许 p5.js 连接
});
const { Client } = require('node-osc');

// MaxMSP 的 IP 和 端口 (默认 127.0.0.1 : 3333)
const oscClient = new Client('127.0.0.1', 3333);

io.on('connection', (socket) => {
  console.log('p5.js 已连接');

  // 监听来自 p5 的 'breath' 消息
  socket.on('breath', (data) => {
    // 转发给 MaxMSP，地址是 /breath
    oscClient.send('/breath', data, (err) => {
      if (err) console.error(err);
    });
  });
});

http.listen(8081, () => {
  console.log('桥接服务运行在: http://localhost:8081');
});
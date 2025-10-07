import ZKLib from "zklib-js";

(async () => {
  // Use the correct IP from your device
  const zk = new ZKLib('192.168.88.3', 4370, 10000, 4000);

  try {
    console.log('🔄 Attempting to connect...');
    
    // Create socket
    await zk.createSocket();
    console.log('✅ Connected to ZKTeco device');

    // Get device information
    const info = await zk.getInfo();
    console.log('📋 Device Info:', info);

    // Get attendance logs
    const logs = await zk.getAttendances();
    console.log('📊 Attendance Logs Count:', logs.data.length);
    // console.log('Sample Logs:', logs.data.slice(0, 5));

    // Disconnect properly
    await zk.disconnect();
    console.log('🔌 Disconnected successfully');

  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    
    // More specific error handling
    if (err.code === 'EHOSTUNREACH') {
      console.log('🔍 Check if device IP is correct and network is properly configured');
    } else if (err.code === 'ECONNREFUSED') {
      console.log('🔍 Device is not accepting connections on port 4370');
    } else if (err.code === 'ETIMEDOUT') {
      console.log('🔍 Connection timeout - check network connectivity');
    }
  }
})();
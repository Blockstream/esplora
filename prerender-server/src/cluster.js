const cluster = require('cluster')
  , numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  let activeRenders = 0
  const MAX_TOTAL_RENDERS = parseInt(process.env.MAX_TOTAL_RENDERS || '1')

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('message', (worker, message) => {
    if (message.type === 'startRender') {
      if (activeRenders < MAX_TOTAL_RENDERS) {
        activeRenders++
        worker.send({ type: 'renderAllowed', requestId: message.requestId })
      } else {
        worker.send({ type: 'renderDenied', requestId: message.requestId })
      }
    } else if (message.type === 'endRender') {
      activeRenders = Math.max(0, activeRenders - 1)
    }
  })

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`, { worker, code, signal });
  });
} else {
  require('./server')
  console.log(`Worker ${process.pid} started`);
}

const cluster = require('cluster')
    , numCPUs = require('os').cpus().length

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`, { worker, code, signal });
  });
} else {
  require('./server')
  console.log(`Worker ${process.pid} started`);
}

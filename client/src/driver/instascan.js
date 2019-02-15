import { Observable as O } from '../rxjs'

const staticRoot = process.env.STATIC_ROOT || ''

// check for WebRTC camera support
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

  // load instascan.js on demand when used for the first time
  let loaded = false
  function load() {
    if (loaded) return;
    loaded = true;
    const script = document.createElement('script')
    script.src = `${staticRoot}instascan.min.js`
    document.body.appendChild(script)
  }

  const Instascan$ = O.fromEvent(document.body, 'load', true).filter(e => e.target.src.endsWith('/instascan.min.js')).map(_ => window.Instascan).share()
      , Scanner$   = Instascan$.map(Instascan => Instascan.Scanner)
      , Camera$    = Instascan$.map(Instascan => Instascan.Camera)

  const makeScanDriver = (opt={}) => {
    const video    = document.createElement('video')
        , scanner$ = Scanner$.map(Scanner => new Scanner({ ...opt, video })).shareReplay(1)
        , scan$    = scanner$.flatMap(scanner => O.fromEvent(scanner, 'scan')).share()
        , active$  = scanner$.flatMap(scanner => O.fromEvent(scanner, 'active')).share()

    video.className = 'qr-video'
    document.body.appendChild(video)

    function startScan(Camera, scanner) {
      load()
      Camera.getCameras().then(pickCam).then(cam => {
        document.body.classList.add('qr-scanning')
        scanner.start(cam)
      })
    }

    function stopScan(scanner) {
      document.body.classList.remove('qr-scanning')
      scanner.stop()
    }

    return _mode$ => {
      const mode$ = O.from(_mode$)

      mode$.filter(Boolean).subscribe(load)

      // start/stop scanner according to mode$
      O.combineLatest(mode$, Camera$, scanner$).subscribe(([ mode, Camera, scanner  ]) =>
        mode ? startScan(Camera, scanner) : stopScan(scanner))

      // if the scanner becomes active while mode$ is off, turn it off again
      // without this, starting the scanner then quickly stopping it before it fully initialized could get it stuck on screen
      active$.withLatestFrom(mode$, scanner$)
        .subscribe(([ active, mode, scanner ]) => (!mode && setTimeout(_ => scanner.stop(), 100)))

      return scan$
    }
  }

  const pickCam = cams =>
    cams.find(cam => cam.name && cam.name.includes('back'))
    || cams[0]

  module.exports = makeScanDriver
}

else {
  // if we don't have WebTC camera support, return a noop driver
  module.exports = _ => _ => O.empty()
}

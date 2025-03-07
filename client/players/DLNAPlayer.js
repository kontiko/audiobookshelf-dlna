import EventEmitter from 'events'

export default class DLNAPlayer extends EventEmitter {
  constructor(ctx) {
    super()

    this.ctx = ctx
    this.player = null
    this.playerController = null
    this.state = null
    this.libraryItem = null
    this.audioTracks = []
    this.currentTrackIndex = 0
    this.isHlsTranscode = null
    this.currentTime = 0
    this.playWhenReady = false
    this.defaultPlaybackRate = 1
    this.paused
    this.currentTime = null
    //This is stupid but the best way to keep the site loaded on Smartphones is to have a fake player playing in the background \(^_^)/
    this.playableMimeTypes = ['audio/flac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/aac', 'audio/x-ms-wma', 'audio/x-aiff', 'audio/webm']
    var audioEl = document.createElement('audio')
    audioEl.id = 'audio-player'
    audioEl.style.display = 'none'
    document.body.appendChild(audioEl)
    this.fake_player = audioEl
    this.fake_player.volume = 0.00001
    this.fake_player.addEventListener(
      'play',
      function () {
        setTimeout(
          function () {
            this.fake_player.muted = true
          }.bind(this),
          1000
        )
      }.bind(this)
    )

    // Supported audio codecs for chromecast

    this.supportedAudioCodecs = ['opus', 'mp3', 'aac', 'flac', 'webma', 'wav']

    this.initialize()
  }

  get currentTrack() {
    return this.audioTracks[this.currentTrackIndex] || {}
  }

  initialize() {
    this.ctx.$root.socket.on('dlna_status', (data) => this.setStatus(data))
    this.ctx.$root.socket.on('dlna_finished', () => this.emit('finished'))
    //this.player = this.ctx.$root.castPlayer
  }

  evtMediaInfoChanged() {}

  destroy() {
    this.ctx.$root.socket.emit('dlna_exit')
    if (this.fake_player) {
      this.fake_player.remove()
    }
  }

  async set(libraryItem, tracks, isHlsTranscode, startTime, playWhenReady = false) {
    this.libraryItem = libraryItem
    this.audioTracks = tracks
    this.isHlsTranscode = isHlsTranscode
    this.playWhenReady = playWhenReady
    this.currentTime = startTime
    var coverImg = this.ctx.$store.getters['globals/getLibraryItemCoverSrc'](libraryItem)
    if (process.env.NODE_ENV === 'development') {
      this.coverUrl = coverImg
    } else {
      this.coverUrl = `${window.location.origin}${coverImg}`
    }
    var serverAddress = window.origin
    this.ctx.$root.socket.emit('dlna_start', this.ctx.$store.state.globals.dlnaDevice, this.audioTracks, startTime, serverAddress)
    this.fake_player.src = tracks[0].relativeContentUrl
    this.fake_player.load()
    this.fake_player.play()
  }

  resetStream(startTime) {}

  playPause() {
    if (this.state == 'PLAYING') {
      this.pause()
    } else {
      this.play()
    }
  }

  play() {
    this.playWhenReady = true
    if (this.fake_player) this.fake_player.play()
    this.ctx.$root.socket.emit('dlna_play')
  }

  pause() {
    this.ctx.$root.socket.emit('dlna_pause')
    this.playWhenReady = false
    if (this.fake_player) this.fake_player.pause()
  }
  getCurrentTime() {
    //var currentTrackOffset = this.currentTrack.startOffset || 0
    return 0 //this.player ? currentTrackOffset + this.player.currentTime : 0
  }

  getDuration() {
    if (!this.audioTracks.length) return 0
    var lastTrack = this.audioTracks[this.audioTracks.length - 1]
    return lastTrack.startOffset + lastTrack.duration
  }

  setPlaybackRate(playbackRate) {
    this.defaultPlaybackRate = playbackRate
  }

  async seek(time, playWhenReady) {}
  setStatus(data) {
    console.log(data)
    this.state = data.status
    this.emit('stateChange', this.state)
    this.currentTrackIndex = data.track_idx
    this.currentTime = data.pos
    console.log(this.currentTrackIndex, this.currentTime)
  }

  getCurrentTime() {
    return this.currentTime + this.audioTracks[this.currentTrackIndex].startOffset
  }
  seek(time) {
    this.ctx.$root.socket.emit('dlna_seek', time)
  }
  setVolume(volume) {
    console.log('SetVolume')
    this.ctx.$root.socket.emit('dlna_set_volume', volume)
  }
}

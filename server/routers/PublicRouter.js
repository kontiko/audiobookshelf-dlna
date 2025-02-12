const express = require('express')
const ShareController = require('../controllers/ShareController')
const DLNAController = require('../controllers/DLNAController')

class PublicRouter {
  constructor(playbackSessionManager, DLNAManager) {
    /** @type {import('../managers/PlaybackSessionManager')} */
    this.playbackSessionManager = playbackSessionManager

    this.router = express()
    this.router.disable('x-powered-by')
    this.DLNAManager = DLNAManager
    this.init()
  }

  init() {
    this.router.get('/share/:slug', ShareController.getMediaItemShareBySlug.bind(this))
    this.router.get('/dlna/:session/:id/track.*', DLNAController.get_file.bind(this))
    this.router.get('/share/:slug/track/:index', ShareController.getMediaItemShareAudioTrack.bind(this))
    this.router.get('/share/:slug/cover', ShareController.getMediaItemShareCoverImage.bind(this))
    this.router.get('/share/:slug/download', ShareController.downloadMediaItemShare.bind(this))
    this.router.patch('/share/:slug/progress', ShareController.updateMediaItemShareProgress.bind(this))
  }
}
module.exports = PublicRouter

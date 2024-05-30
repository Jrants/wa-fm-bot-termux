import { readFile, unlink } from 'fs/promises'
import { createWriteStream } from 'fs'
import ytdl from 'ytdl-core'
import { tmpdir } from 'os'
import Utils from './Utils'
export class YTDownloader {
    constructor(private url: string, private type = 'video') {
        this.url = url
    }
 //i was not using this file bindWaitForConnectionUpdate, it was a dummy
 // ohh, yeah it was all from outube.
    validate = async () => ytdl.validateURL(this.url)


    getInfo = async () => await ytdl.getInfo(this.url)



    download = async (quality = 'medium') => {
        if (this.type === 'audio' || quality === 'medium') {
            let filename = `${tmpdir()}/${Math.random().toString(36)}.${this.type === 'audio' ? 'mp3' : 'mp4'}`
            const stream = createWriteStream(filename)
            ytdl(this.url, {
                quality: this.type === 'audio' ? 'highestaudio' : 'highest'
            }).pipe(stream)
            filename = await new Promise((resolve, reject) => {
                stream.on('finish', () => resolve(filename))
                stream.on('error', (error) => reject(error && console.log(error)))
            })
            const buffer = await readFile(filename)
            await unlink(filename)
            return buffer
        }
        let audioFilename = `${tmpdir()}/${Math.random().toString(36)}.mp3`
        let videoFilename = `${tmpdir()}/${Math.random().toString(36)}.mp4`
        const filename = `${tmpdir()}/${Math.random().toString(36)}.mp4`
        const audioStream = createWriteStream(audioFilename)
        ytdl(this.url, {
            quality: 'highestaudio'
        }).pipe(audioStream)
        audioFilename = await new Promise((resolve, reject) => {
            audioStream.on('finish', () => resolve(audioFilename))
            audioStream.on('error', (error) => reject(error && console.log(error)))
        })
        const stream = createWriteStream(videoFilename)
        ytdl(this.url, {
            quality: quality === 'high' ? 'highestvideo' : 'lowestvideo'
        }).pipe(stream)
        videoFilename = await new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(videoFilename))
            stream.on('error', (error) => reject(error && console.log(error)))
        })
        await this.utils.exec(`ffmpeg -i ${videoFilename} -i ${audioFilename} -c:v copy -c:a aac ${filename}`)
        const buffer = await readFile(filename)
        Promise.all([unlink(videoFilename), unlink(audioFilename), unlink(filename)])
        return buffer
    }

    utils = new Utils()
}
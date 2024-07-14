import { google, youtube_v3 } from 'googleapis'
import { readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import youtubedl from 'youtube-dl-exec'
import Utils from './Utils'

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
})

export const searchTrackOnYouTube = async (track: string, artist?: string) => {
    try {
        const query = artist ? `${track} ${artist}` : track
        const res = await youtube.search.list({
            part: ['snippet'],
            q: query,
            maxResults: 1,
            type: ['video']
        })

        const items = res.data.items

        if (!items || items.length === 0) {
            throw new Error('No video found')
        }

        return items[0]
    } catch (error) {
        console.error('Error searching YouTube:', error)
        throw new Error('Failed to search YouTube')
    }
}

export class YTDownloader {
    private utils = new Utils()

    constructor(private url: string, private type = 'video') {
        this.url = url
    }

    validate = async () => {
        const result = await youtubedl(this.url, { getId: true, quiet: true })
        return !!result 
    }

    getInfo = async () => {
        const result = await youtubedl(this.url, { dumpSingleJson: true, quiet: true })
        return result
    }

    download = async (quality = 'medium') => {
        const filename = `${tmpdir()}/${Math.random().toString(36)}.${this.type === 'audio' ? 'mp3' : 'mp4'}`
        const options = this.type === 'audio'
            ? { format: 'bestaudio', output: filename }
            : { format: quality === 'high' ? 'bestvideo+bestaudio' : 'worstvideo+bestaudio', output: filename }

        await youtubedl(this.url, options)

        const buffer = await readFile(filename)
        await unlink(filename)
        return buffer
    }

    parseId = (): string => {
        const split = this.url.split('/')
        if (this.url.includes('youtu.be')) return split[split.length - 1]
        return this.url.split('=')[1]
    }
}

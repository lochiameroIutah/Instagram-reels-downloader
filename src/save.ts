import type { NextApiRequest, NextApiResponse } from 'next'
import { google } from 'googleapis'
import fetch from 'node-fetch'
import { Readable } from 'stream'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Usa POST' })

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL mancante' })

  try {
    const metaRes = await fetch(
      `${process.env.DOWNLOADER_URL}/api/video?postUrl=${encodeURIComponent(url)}`
    )
    const meta = await metaRes.json()
    const fileUrl = meta.data.videoUrl as string
    const filename = meta.data.filename ?? `reel_${Date.now()}.mp4`

    const videoBuf = await fetch(fileUrl).then(r => r.arrayBuffer())

    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob'
    )
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
    const drive = google.drive({ version: 'v3', auth: oauth2 })

    const upload = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_FOLDER_ID],
      },
      media: {
        mimeType: 'video/mp4',
        body: Readable.from(Buffer.from(videoBuf)),
      },
    })

    return res.json({ ok: true, fileId: upload.data.id })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Errore interno' })
  }
}

import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL mancante" }, { status: 400 });
    }

    /* ottengo info e link del video */
    const metaRes = await fetch(
      `${process.env.DOWNLOADER_URL}/api/video?postUrl=${encodeURIComponent(url)}`
    );
    if (!metaRes.ok) {
      return NextResponse.json(
        { error: "Downloader non disponibile" },
        { status: 502 }
      );
    }
    const meta = await metaRes.json();
    const fileUrl = meta.data.videoUrl as string;
    const filename = meta.data.filename ?? `reel_${Date.now()}.mp4`;

    /* scarico il file */
    const buffer = await fetch(fileUrl).then((r) => r.arrayBuffer());

    /* preparo Drive */
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "urn:ietf:wg:oauth:2.0:oob"
    );
    oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2 });

    // 4. carico nella cartella Reels
    const upload = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_FOLDER_ID as string], // <-- cast esplicito
      },
      media: {
        mimeType: "video/mp4",
        body: Buffer.from(buffer), // <-- Buffer anziché Readable
      },
      fields: "id", // <-- opzionale ma chiarisce il tipo di risposta
    });

    return NextResponse.json({ ok: true, fileId: upload.data.id });
  } catch (err: any) {
    console.error("Errore nel salvataggio", err);
    return NextResponse.json(
      { error: err.message ?? "Errore interno" },
      { status: 500 }
    );
  }
}

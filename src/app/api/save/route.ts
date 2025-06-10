import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export const dynamic = "force-dynamic"; // evita il caching su Vercel

export async function POST(req: NextRequest) {
  try {
    /* 1. estraggo l'URL dal body */
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: "URL mancante",
        message: "È necessario fornire l'URL del reel da salvare"
      }, { status: 400 });
    }

    /* 2. chiedo al downloader il link diretto del video */
    const metaRes = await fetch(
      `${process.env.DOWNLOADER_URL}/api/video?postUrl=${encodeURIComponent(url)}`
    );
    if (!metaRes.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Downloader non disponibile",
          message: "Il servizio di download non è raggiungibile. Riprova più tardi."
        },
        { status: 502 }
      );
    }
    const meta = await metaRes.json();
    const fileUrl = meta.data.videoUrl as string;
    const filename = meta.data.filename ?? `reel_${Date.now()}.mp4`;

    /* 3. scarico il video in un Buffer e lo trasformo in stream */
    const videoResponse = await fetch(fileUrl);
    if (!videoResponse.ok) {
      return NextResponse.json({
        success: false,
        error: "Download fallito",
        message: "Impossibile scaricare il video. Verifica che l'URL sia corretto."
      }, { status: 502 });
    }
    
    const buffer = await videoResponse.arrayBuffer();
    const stream = Readable.from(Buffer.from(buffer));

    /* 4. preparo le credenziali Google Drive usando l'account di servizio */
    const serviceAccountCreds = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT as string
    );
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountCreds,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    const drive = google.drive({ version: "v3", auth });

    /* 5. carico il file nella cartella Reels */
    const upload = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_FOLDER_ID as string],
      },
      media: {
        mimeType: "video/mp4",
        body: stream as any, // lo stream possiede .pipe()
      },
      fields: "id",
    });

    return NextResponse.json({ 
      success: true, 
      fileId: upload.data.id,
      filename: filename,
      message: "Video salvato con successo su Google Drive!"
    });
  } catch (err: any) {
    console.error("🔥 Errore nel salvataggio:", err);
    return NextResponse.json(
      { 
        success: false, 
        error: err.message ?? "Errore interno",
        message: "Si è verificato un errore durante il salvataggio del video. Riprova più tardi."
      },
      { status: 500 }
    );
  }
}

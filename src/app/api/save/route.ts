import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // evita il caching su Vercel

export async function POST(req: NextRequest) {
  try {
    /* 1. estraggo l'URL dal body */
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL mancante" }, { status: 400 });
    }

    /* 2. chiedo al downloader il link diretto del video */
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

    /* 3. scarico il video in un Buffer */
    const videoResponse = await fetch(fileUrl);
    if (!videoResponse.ok) {
      return NextResponse.json(
        { error: "Impossibile scaricare il video" },
        { status: 502 }
      );
    }
    const videoBuffer = await videoResponse.arrayBuffer();

    /* 4. invio il video al webhook di Make */
    if (!process.env.MAKE_WEBHOOK_URL) {
      return NextResponse.json(
        { error: "MAKE_WEBHOOK_URL non configurato" },
        { status: 500 }
      );
    }

    // Creo un FormData per inviare il file al webhook
    const formData = new FormData();
    formData.append(
      'file', 
      new Blob([Buffer.from(videoBuffer)], { type: 'video/mp4' }), 
      filename
    );
    formData.append('source_url', url);

    // Invio il file al webhook di Make
    const makeResponse = await fetch(process.env.MAKE_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!makeResponse.ok) {
      const errorText = await makeResponse.text();
      console.error("🔥 Errore nell'invio a Make:", errorText);
      return NextResponse.json(
        { error: "Errore nell'invio a Make" },
        { status: 502 }
      );
    }

    const makeResult = await makeResponse.json();
    return NextResponse.json({ ok: true, result: makeResult });
  } catch (err: any) {
    console.error("🔥 Errore nel salvataggio:", err);
    return NextResponse.json(
      { error: err.message ?? "Errore interno" },
      { status: 500 }
    );
  }
}

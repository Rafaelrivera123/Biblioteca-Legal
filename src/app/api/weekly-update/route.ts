import { resend } from "@/lib/resend";
import { processPendingGacetas, type GacetaRunSummary } from "@/lib/gaceta-processor";
import { NextResponse } from "next/server";

// Con Fluid Compute (activado por defecto en Vercel), el plan Hobby permite
// hasta 300 segundos de duración real — dejamos margen para que el
// procesador de Gacetas corte antes de que Vercel mate la función.
export const maxDuration = 300;

function buildSummaryEmailHtml(summary: GacetaRunSummary[]): string {
  const rows = summary
    .map((s) => {
      if (s.ok) {
        return `<p>✅ <strong>La Gaceta N° ${s.gacetaNumber}</strong>: ${s.updatesCreated} actualización(es) creada(s) como borrador.</p>`;
      }
      return `<p>❌ <strong>La Gaceta N° ${s.gacetaNumber}</strong>: falló — ${s.error ?? "error desconocido"}</p>`;
    })
    .join("");

  const body =
    summary.length > 0
      ? rows
      : `<p>No había Gacetas pendientes en la biblioteca (/dashboard/gacetas) para procesar en este ciclo.</p>`;

  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="650" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:12px;overflow:hidden;box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    <tr>
                      <td style="background-color:#0f3460;padding:35px 30px;text-align:center;">
                        <h1 style="color:#4CAF50;margin:0;font-size:26px;font-weight:bold;letter-spacing:0.5px;">📚 Biblioteca Legal HN</h1>
                        <p style="color:#ffffff;margin:10px 0 0;font-size:15px;opacity:0.95;">Procesamiento de Gacetas Oficiales</p>
                        <p style="color:#aaaaaa;margin:6px 0 0;font-size:12px;text-transform:capitalize;">
                          ${new Date().toLocaleDateString("es-HN", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:35px;color:#ffffff;line-height:1.6;font-size:15px;">
                        ${body}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color:#0f3460;padding:25px;text-align:center;border-top:1px solid #252545;">
                        <p style="color:#aaaaaa;margin:0 0 8px;font-size:12px;">
                          Este correo fue generado automáticamente por el subsistema de Gacetas de Biblioteca Legal HN.
                        </p>
                        <a href="https://www.bibliotecalegalhn.com/dashboard/gacetas" style="color:#4CAF50;font-size:13px;text-decoration:none;font-weight:bold;">
                          Ver biblioteca de Gacetas
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    // Deja ~40s de margen sobre los 300s de maxDuration para que la función
    // alcance a responder antes de que Vercel la corte a la fuerza.
    const summary = await processPendingGacetas(260_000);

    await resend.emails.send({
      from: "Biblioteca Legal HN <noreply@bibliotecalegalhn.com>",
      to: "rafariveras10@gmail.com",
      subject: `📋 Procesamiento de Gacetas - ${new Date().toLocaleDateString(
        "es-HN",
        { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      )}`,
      html: buildSummaryEmailHtml(summary),
    });

    return NextResponse.json({
      success: true,
      processed: summary.length,
      drafts_created: summary.reduce((sum, s) => sum + s.updatesCreated, 0),
      details: summary,
    });
  } catch (error) {
    console.error("Error en weekly-update:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

import { skillManifest } from "@/lib/skill-manifest";

export function GET() {
  return Response.json(skillManifest, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

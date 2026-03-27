import { rulesDoc } from "@/lib/rules-doc";

export function GET() {
  return new Response(rulesDoc, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

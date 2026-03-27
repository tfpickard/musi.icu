import { messagingDoc } from "@/lib/messaging-doc";

export function GET() {
  return new Response(messagingDoc, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

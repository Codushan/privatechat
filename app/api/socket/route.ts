import { NextRequest } from "next/server";
import { initSocketServer, NextApiResponseWithSocket } from "@/lib/socket";

export async function GET(req: NextRequest, res: NextApiResponseWithSocket) {
  initSocketServer(req, res);
  
  return new Response("Socket initialized", {
    status: 200,
  });
}
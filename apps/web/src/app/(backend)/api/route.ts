export async function GET() {
  return Response.json({
    ok: true,
    message: 'Serverless API is running',
    timestamp: new Date().toISOString(),
  });
}

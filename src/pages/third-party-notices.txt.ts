import notices from '../../THIRD_PARTY_NOTICES.md?raw'

// Ship attribution with the static distribution, not only the source repo.
export function GET() {
  return new Response(notices, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}

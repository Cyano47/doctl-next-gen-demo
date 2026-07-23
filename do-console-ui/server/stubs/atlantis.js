/**
 * Stub: Atlantis read-only account/resource metadata.
 * Real implementation will call Atlantis API with auth.
 */
export async function getTechnicalMetadata(req) {
  return {
    region: 'NYC1',
    tier: 'basic',
    resources: [{ type: 'database', id: 'db-postgres', region: 'NYC1' }]
  }
}

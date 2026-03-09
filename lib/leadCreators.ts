export type LeadCreatorInfo = {
  createdByUserId?: string | null
  creatorName?: string | null
}

export function getInitials(name?: string | null) {

  if (!name) return "?"

  const parts = name
    .trim()
    .split(" ")
    .filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0,2).toUpperCase()
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase()
}

export function isOwnedByUser(
  lead: { ownerUserId?: string | null },
  userId?: string | null
) {

  if (!lead || !userId) return false

  return lead.ownerUserId === userId
}

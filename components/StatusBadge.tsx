const MAP: Record<string, { cls: string; label: string }> = {
  COMPLETED:        { cls: 'badge-green', label: 'Completed' },
  PENDING_STEP_UP:  { cls: 'badge-amber', label: 'PIN Required' },
  PENDING_BIOMETRIC:{ cls: 'badge-amber', label: 'Biometric' },
  COOLING_OFF:      { cls: 'badge-blue',  label: 'Cooling Off' },
  PENDING_ADMIN:    { cls: 'badge-amber', label: 'Under Review' },
  BLOCKED:          { cls: 'badge-red',   label: 'Blocked' },
  CANCELLED:        { cls: 'badge-gray',  label: 'Cancelled' },
}

export default function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { cls: 'badge-gray', label: status }
  return <span className={`badge ${m.cls}`}>{m.label}</span>
}

type AdminNoticeProps = {
  value?: string | undefined;
  entity: string;
};

export function AdminNotice({ value, entity }: AdminNoticeProps) {
  if (value !== "created" && value !== "updated" && value !== "deleted") return null;
  return (
    <p
      role="status"
      className="mt-5 border-l-4 border-highlight bg-surface px-4 py-3 text-sm font-semibold text-text"
    >
      {entity} {value} successfully.
    </p>
  );
}

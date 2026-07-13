type AdminNoticeProps = {
  value?: string | undefined;
  entity: string;
};

export function AdminNotice({ value, entity }: AdminNoticeProps) {
  if (value !== "created" && value !== "updated" && value !== "deleted") return null;
  return (
    <p
      role="status"
      className="mt-5 border-l-2 border-highlight bg-highlight/5 px-4 py-3 text-sm text-text"
    >
      {entity} {value} successfully.
    </p>
  );
}

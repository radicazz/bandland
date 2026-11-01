import { AdminNotice } from "@/components/admin/AdminNotice";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { normalizeWidgets } from "@/content/settings-defaults";
import { updateSettingsAction } from "@/lib/admin-actions";
import { readSettings } from "@/lib/content-store";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const stored = await readSettings();
  const settings = { ...stored, widgets: normalizeWidgets(stored.widgets) };
  const readOnly = isReadOnlyDeployment();

  return (
    <section>
      <h2 className="text-lg font-semibold text-text">Site settings</h2>
      <p className="mt-2 text-sm text-text-muted">
        Control the home page layout, the latest release, the footer and social links.
      </p>
      <AdminNotice value={saved} entity="Settings" />
      {readOnly ? (
        <p className="mt-4 text-sm text-text-muted">Settings cannot be changed in preview mode.</p>
      ) : null}
      <SettingsForm action={updateSettingsAction} settings={settings} />
    </section>
  );
}

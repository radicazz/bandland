import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { AdminNav } from "@/components/admin/AdminNav";
import { isReadOnlyDeployment } from "@/lib/runtime-environment";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/admin");
  }

  return (
    <section className="min-h-[calc(100dvh-4rem)] border-b border-border/60 bg-surface/30">
      <Container className="py-4 sm:py-8">
        <AdminNav />
        {isReadOnlyDeployment() ? (
          <p
            className="mt-5 border border-highlight/50 bg-highlight/10 px-4 py-3 text-sm text-highlight"
            role="status"
          >
            Preview mode is read-only. This deployment displays production content but cannot change
            it.
          </p>
        ) : null}
        <div className="mt-5 sm:mt-8">{children}</div>
      </Container>
    </section>
  );
}

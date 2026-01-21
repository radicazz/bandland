import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Container } from "@/components/Container";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session) {
    redirect("/admin");
  }

  return (
    <section className="border-b border-border/60 bg-surface/30">
      <Container className="py-10">
        <AdminNav />
        <div className="mt-10">{children}</div>
      </Container>
    </section>
  );
}

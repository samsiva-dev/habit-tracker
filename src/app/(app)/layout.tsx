import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { SessionProvider } from "next-auth/react";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-20 pb-24 w-full min-h-screen">
        {children}
      </main>
    </SessionProvider>
  );
}

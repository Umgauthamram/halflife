import { auth } from "../auth";
import { redirect } from "next/navigation";
import HalfLifeLandingPage from "./landing-client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await auth();
  if (session?.user) {
    redirect("/app");
  }

  return <HalfLifeLandingPage />;
}

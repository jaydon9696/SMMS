"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StandingOrderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/order/table/0");
  }, [router]);

  return <div className="p-8 text-center">Redirecting to standing order...</div>;
}

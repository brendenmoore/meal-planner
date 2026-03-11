"use client";

import dynamic from "next/dynamic";

const ScheduleClient = dynamic(() => import("./ScheduleClient"), { ssr: false });

export default function SchedulePage() {
  return <ScheduleClient />;
}

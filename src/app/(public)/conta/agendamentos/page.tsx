import type { Metadata } from "next";
import { MyAppointments } from "@/features/account/components/MyAppointments";

export const metadata: Metadata = { title: "Meus agendamentos" };

export default function MyAppointmentsPage() {
  return <MyAppointments />;
}

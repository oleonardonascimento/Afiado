/** Arquivo .ics para "adicionar ao calendário" (RF-06). */
type IcsEvent = {
  uid: string;
  start: string;
  end: string;
  title: string;
  location: string;
  description: string;
};

const escape = (text: string) => text.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function buildIcs(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Afiado//Agendamento//PT-BR",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape(event.location)}`,
    `DESCRIPTION:${escape(event.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map((l) => `${l}\r\n`).join("");
}

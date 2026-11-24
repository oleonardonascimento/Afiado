/**
 * C12: página de texto legal (Termos, Privacidade). Server Component, conteúdo estático.
 * O aviso no topo deixa claro que o texto é um modelo da V1 e precisa de revisão jurídica.
 */
type LegalSection = { title: string; paragraphs: string[] };

type LegalPageProps = {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
};

export function LegalPage({ title, updatedAt, sections }: LegalPageProps) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl uppercase">{title}</h1>
        <p className="text-text-muted text-sm">Atualizado em {updatedAt}.</p>
        <p className="rounded-control border-border-strong border px-3 py-2 text-sm">
          Texto-modelo desta versão de demonstração. Antes de publicar, peça a
          revisão de um advogado.
        </p>
      </header>
      {sections.map((s) => (
        <section key={s.title} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          {s.paragraphs.map((p) => (
            <p key={p} className="max-w-prose leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

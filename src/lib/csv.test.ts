import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("usa ponto e vírgula e escapa aspas, quebras e separador", () => {
    expect(
      toCsv(
        ["Nome", "Valor"],
        [
          ["Ana; Souza", "45,00"],
          ['Diz "oi"', "1"],
        ],
      ),
    ).toBe('Nome;Valor\r\n"Ana; Souza";45,00\r\n"Diz ""oi""";1');
  });
});

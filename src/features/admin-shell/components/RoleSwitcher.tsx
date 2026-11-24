"use client";

/**
 * RoleSwitcher — troca o papel da demonstração (Dono/Barbeiro/Recepção) e
 * reseta os dados. Só existe na V1 (RF-52). Teclado: setas no menu (Radix).
 */
import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffRoleSchema } from "@/domain/entities";
import { ROLE_LABEL } from "@/lib/labels";
import { useResetDemo } from "@/features/demo/hooks/useResetDemo";
import { useStaffRole, useUpdateSession } from "@/hooks/useSession";

export function RoleSwitcher() {
  const role = useStaffRole();
  const updateSession = useUpdateSession();
  const resetDemo = useResetDemo();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" aria-label={`Papel: ${ROLE_LABEL[role]}`}>
          <span className="text-text-muted">Papel:</span> {ROLE_LABEL[role]}
          <ChevronDown strokeWidth={1.75} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Ver o painel como</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={role}
          onValueChange={(value) => {
            const parsed = StaffRoleSchema.safeParse(value);
            if (parsed.success) updateSession.mutate({ role: parsed.data });
          }}
        >
          {StaffRoleSchema.options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {ROLE_LABEL[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={resetDemo.isPending} onSelect={() => resetDemo.mutate()}>
          <RotateCcw strokeWidth={1.75} aria-hidden />
          Resetar dados de demonstração
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

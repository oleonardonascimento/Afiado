/** Avatar com foto ou iniciais (fallback desenhado para quem não tem foto). */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/labels";

type PersonAvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZES = { sm: "size-9", md: "size-12", lg: "size-20" } as const;
const TEXT = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const;

export function PersonAvatar({ name, photoUrl, size = "md", className }: PersonAvatarProps) {
  return (
    <Avatar className={cn(SIZES[size], className)}>
      {photoUrl && <AvatarImage src={photoUrl} alt="" />}
      <AvatarFallback className={cn("bg-club font-semibold text-club-fg", TEXT[size])}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}

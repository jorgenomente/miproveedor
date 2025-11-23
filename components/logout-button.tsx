"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      window.location.href = "/auth/logout";
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={pending}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Salir
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { enUS, tr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@/types";
import type { InvitationWithRelations } from "@/types";
import { cancelInvitation, resendInvitation } from "@/app/actions/invitation";
import { MoreHorizontal, X, RefreshCw, Clock, Mail } from "lucide-react";

type Props = {
  invitations: InvitationWithRelations[];
  locale: string;
  isAdmin: boolean;
};

export function PendingInvitationsList({ invitations, locale, isAdmin }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dateLocale = locale === "tr" ? tr : enUS;

  const handleCancel = async () => {
    if (!selectedInvitation) return;

    setIsLoading(true);
    try {
      const result = await cancelInvitation(selectedInvitation.id);
      if (result.error) {
        toast.error(t("settings.members.messages.cancelError"));
      } else {
        toast.success(t("settings.members.messages.cancelSuccess"));
        router.refresh();
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
    }
  };

  const handleResend = async (invitation: InvitationWithRelations) => {
    setIsLoading(true);
    try {
      const result = await resendInvitation(invitation.id);
      if ("error" in result) {
        toast.error(t("settings.members.messages.resendError"));
      } else {
        toast.success(t("settings.members.messages.resendSuccess"));
        router.refresh();
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Mail className="mx-auto h-8 w-8 mb-2 opacity-50" />
        <p>{t("settings.members.noPendingInvitations")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.members.table.email")}</TableHead>
              <TableHead>{t("settings.members.table.role")}</TableHead>
              <TableHead>{t("settings.members.table.invitedBy")}</TableHead>
              <TableHead>{t("settings.members.table.expires")}</TableHead>
              {isAdmin && <TableHead className="w-[70px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => {
              const isExpiringSoon =
                new Date(invitation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000;

              return (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <Badge variant={invitation.role === Role.ADMIN ? "default" : "secondary"}>
                      {invitation.role === Role.ADMIN
                        ? t("organization.roles.admin")
                        : t("organization.roles.member")}
                    </Badge>
                  </TableCell>
                  <TableCell>{invitation.invitedBy.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${isExpiringSoon ? "text-orange-500" : "text-muted-foreground"}`} />
                      <span className={isExpiringSoon ? "text-orange-500" : ""}>
                        {formatDistanceToNow(new Date(invitation.expiresAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleResend(invitation)}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            {t("settings.members.actions.resend")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setCancelDialogOpen(true);
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            {t("settings.members.actions.cancel")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.members.cancelDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.members.cancelDialog.description", {
                email: selectedInvitation?.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.members.cancelDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

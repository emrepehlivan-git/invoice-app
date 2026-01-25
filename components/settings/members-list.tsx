"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@/types";
import type { OrganizationMemberWithUser } from "@/app/actions/organization";
import { removeMember, updateMemberRole } from "@/app/actions/organization";
import { MoreHorizontal, UserMinus, Shield, User } from "lucide-react";

type Props = {
  members: OrganizationMemberWithUser[];
  currentUserId: string;
  isAdmin: boolean;
};

export function MembersList({ members, currentUserId, isAdmin }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrganizationMemberWithUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRemove = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const result = await removeMember(selectedMember.id);
      if (result.error) {
        const errorMessage = result.message || t("settings.members.messages.removeError");
        toast.error(errorMessage);
      } else {
        toast.success(t("settings.members.messages.removeSuccess"));
        router.refresh();
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
      setRemoveDialogOpen(false);
      setSelectedMember(null);
    }
  };

  const handleRoleChange = async (member: OrganizationMemberWithUser, newRole: Role) => {
    setIsLoading(true);
    try {
      const result = await updateMemberRole(member.id, newRole);
      if (result.error) {
        toast.error(t("settings.members.messages.roleChangeError"));
      } else {
        toast.success(t("settings.members.messages.roleChangeSuccess"));
        router.refresh();
      }
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.members.table.member")}</TableHead>
              <TableHead>{t("settings.members.table.role")}</TableHead>
              {isAdmin && <TableHead className="w-[70px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const canModify = isAdmin && !isCurrentUser;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.user.image || undefined} alt={member.user.name} />
                        <AvatarFallback className="text-xs">
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.user.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t("settings.members.you")})
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === Role.ADMIN ? "default" : "secondary"}>
                      {member.role === Role.ADMIN
                        ? t("organization.roles.admin")
                        : t("organization.roles.member")}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {canModify && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.role === Role.MEMBER ? (
                              <DropdownMenuItem onClick={() => handleRoleChange(member, Role.ADMIN)}>
                                <Shield className="mr-2 h-4 w-4" />
                                {t("settings.members.actions.makeAdmin")}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRoleChange(member, Role.MEMBER)}>
                                <User className="mr-2 h-4 w-4" />
                                {t("settings.members.actions.makeMember")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedMember(member);
                                setRemoveDialogOpen(true);
                              }}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              {t("settings.members.actions.remove")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.members.removeDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.members.removeDialog.description", {
                name: selectedMember?.user.name || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.members.removeDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

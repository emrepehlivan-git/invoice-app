"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Link } from "@/i18n/navigation";
import { deleteCustomer } from "@/app/actions/customer";
import type { Customer } from "@/types";

type CustomerTableProps = {
  customers: Customer[];
  orgSlug: string;
  locale: string;
};

export function CustomerTable({
  customers,
  orgSlug,
  locale,
}: CustomerTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const dateLocale = locale === "tr" ? tr : enUS;

  function handleDeleteClick(customer: Customer) {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!customerToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCustomer(customerToDelete.id);

      if (result?.error) {
        toast.error(t("customers.messages.deleteError"));
        return;
      }

      toast.success(t("customers.messages.deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  }

  if (customers.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        {t("customers.list.empty")}
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("customers.table.name")}</TableHead>
            <TableHead>{t("customers.table.email")}</TableHead>
            <TableHead>{t("customers.table.phone")}</TableHead>
            <TableHead>{t("customers.table.city")}</TableHead>
            <TableHead>{t("customers.table.createdAt")}</TableHead>
            <TableHead className="w-[70px]">
              {t("customers.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell>{customer.email || "-"}</TableCell>
              <TableCell>{customer.phone || "-"}</TableCell>
              <TableCell>{customer.city || "-"}</TableCell>
              <TableCell>
                {format(new Date(customer.createdAt), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">{t("customers.table.actions")}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/${orgSlug}/customers/${customer.id}`}>
                        <Eye className="mr-2 size-4" />
                        {t("customers.view")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${orgSlug}/customers/${customer.id}/edit`}>
                        <Pencil className="mr-2 size-4" />
                        {t("customers.edit")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteClick(customer)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      {t("customers.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("customers.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("customers.deleteDialog.description", {
                name: customerToDelete?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("customers.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("customers.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

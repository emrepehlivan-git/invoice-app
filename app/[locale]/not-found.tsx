import { getTranslations } from "next-intl/server";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>{t("errors.notFoundTitle")}</CardTitle>
          <CardDescription>{t("errors.notFoundDescription")}</CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter className="flex gap-2 justify-center">
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.goBack")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              {t("common.goHome")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

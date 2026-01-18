import { setRequestLocale } from "next-intl/server";
import { CreateOrganizationForm } from "./create-organization-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CreateOrganizationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <CreateOrganizationForm />;
}

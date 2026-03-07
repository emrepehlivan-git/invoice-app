import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InvoiceNotesCardProps {
  notes: string;
  title: string;
}

export function InvoiceNotesCard({ notes, title }: InvoiceNotesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{notes}</p>
      </CardContent>
    </Card>
  );
}

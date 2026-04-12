import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PersonalInformationCardProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

function IconInput({
  icon,
  value,
  id,
}: {
  icon: React.ReactNode;
  value: string;
  id: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <Input
        id={id}
        value={value}
        disabled
        readOnly
        className="h-14 bg-gray-100 pl-11 disabled:opacity-100"
      />
    </div>
  );
}

export function PersonalInformationCard({
  firstName,
  lastName,
  email,
  phone,
}: PersonalInformationCardProps) {
  return (
    <section>
      <h2 className="font-angkor font-bold text-4xl mb-4">
        Personal Information
      </h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-bold">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                disabled
                readOnly
                className="h-14 bg-gray-100 disabled:opacity-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-bold">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                disabled
                readOnly
                className="h-14 bg-gray-100 disabled:opacity-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold">
              Email Address
            </Label>
            <IconInput
              id="email"
              value={email}
              icon={<Mail className="h-5 w-5" aria-hidden="true" />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-bold">
              Phone Number
            </Label>
            <IconInput
              id="phone"
              value={phone}
              icon={<Phone className="h-5 w-5" aria-hidden="true" />}
            />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

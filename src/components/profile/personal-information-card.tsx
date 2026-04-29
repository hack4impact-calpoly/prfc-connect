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

function IconInput({ icon, value, id }: { icon: React.ReactNode; value: string; id: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <Input
        id={id}
        value={value}
        disabled
        readOnly
        className="rounded-lg bg-paso-grey border-gray-200/90 shadow-none pl-11 h-10 font-khula py-0 leading-[2.5rem] disabled:opacity-100"
      />
    </div>
  );
}

export function PersonalInformationCard({ firstName, lastName, email, phone }: PersonalInformationCardProps) {
  return (
    <section>
      <h2 className="font-angkor text-2xl mb-4">Personal Information</h2>
      <Card>
        <CardContent className="p-6 space-y-4 font-khula">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="font-bold">
                First Name
              </Label>
              <Input
                id="firstName"
                value={firstName}
                disabled
                readOnly
                className="rounded-lg bg-paso-grey border-gray-200/90 shadow-none h-10 font-khula py-0 leading-[2.5rem] disabled:opacity-100"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="font-bold">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={lastName}
                disabled
                readOnly
                className="rounded-lg bg-paso-grey border-gray-200/90 shadow-none h-10 font-khula py-0 leading-[2.5rem] disabled:opacity-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="font-bold">
              Email Address
            </Label>
            <IconInput id="email" value={email} icon={<Mail className="h-4 w-4" aria-hidden="true" />} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="font-bold">
              Phone Number
            </Label>
            <IconInput id="phone" value={phone} icon={<Phone className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

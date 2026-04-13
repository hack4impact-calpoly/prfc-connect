import { PersonalInformationCard } from "@/components/profile/personal-information-card";

export default function SnehilkPage() {
  return (
    <div className="p-20 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <PersonalInformationCard
          firstName="Snehil"
          lastName="Kakani"
          email="skakani@calpoly.edu"
          phone="(408) 398-3436"
        />
      </div>
    </div>
  );
}

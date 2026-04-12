import { PersonalInformationCard } from "@/components/profile/personal-information-card";

export default function SnehilkPage() {
  return (
    <div className="p-20 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Personal Information Card Preview</h1>
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

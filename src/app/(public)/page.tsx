import { Suspense } from "react";
import Image from "next/image";
import { ReferralForm } from "@/components/referral/referral-form";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col text-prfc-dark-brown overflow-x-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1 w-full max-w-[1400px] mx-auto">
        <div className="bg-prfc-tan py-8 px-8 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="font-angkor text-prfc-red mb-2 text-[clamp(0.8rem,3.4vw,2rem)]">
              Invite Others to Join the Co-Op!
            </h1>
            <h2 className="font-angkor text-prfc-brown text-[clamp(0.8rem,3vw,1.8rem)]">
              Refer a Family Member or Friend
            </h2>
          </div>
          <Suspense
            fallback={
              <div role="status" aria-live="polite">
                Loading...
              </div>
            }
          >
            <ReferralForm />
          </Suspense>
        </div>
        <div className="relative min-h-[400px] max-md:hidden">
          <Image src="/assets/produce.jpg" alt="Fresh produce display" fill className="object-cover" />
        </div>

        <div className="relative min-h-[300px] max-md:hidden">
          <Image src="/assets/produce_2.jpg" alt="Variety of fresh produce" fill className="object-cover" />
        </div>
        <div className="bg-prfc-red text-white p-8 flex flex-col justify-center">
          <h2 className="text-[1.8rem] font-angkor max-md:text-[1.4rem] max-md:mb-[0.8rem] max-md:mt-6 max-md:first:mt-0">
            Why Should I Refer?
          </h2>
          <p className="max-md:text-[0.9rem] max-md:mb-4 max-md:mt-0">
            Each new member brings fresh ideas, helps us offer more events, and keeps our shelves stocked with an even
            wider variety of products.
          </p>
          <h2 className="text-[1.8rem] font-angkor max-md:text-[1.4rem] max-md:mb-[0.8rem] max-md:mt-6">Prizes</h2>
          <p className="max-md:text-[0.9rem] max-md:mb-0 max-md:mt-0">
            For each new member you bring in, you'll earn points to redeem special prizes. Past prizes have included
            bottles of wine, engraved bricks, and more.
          </p>
        </div>
      </div>
    </main>
  );
}

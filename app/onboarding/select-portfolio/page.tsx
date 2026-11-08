"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Building2Icon, LeafIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import clsx from "clsx";

const portfolios = [
  {
    key: "real-estate",
    title: "Real Estate",
    description:
      "Invest in premium real estate portfolios with high returns and low risk.",
    icon: <Building2Icon className="w-12 h-12 text-blue-600" />,
    cta: "Select Real Estate",
  },
  {
    key: "agriculture",
    title: "Agriculture",
    description:
      "Diversify with sustainable agriculture investments and stable growth.",
    icon: <LeafIcon className="w-12 h-12 text-green-600" />,
    cta: "Select Agriculture",
  },
];

export default function SelectPortfolioPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (key: string) => {
    setSelected(key);
  };

  const handleContinue = () => {
    if (selected && session?.user?.id) {
      // Persist selection and mark onboarding complete, scoped to this user
      localStorage.setItem("portfolioType", selected);
      localStorage.setItem(`onboarded_${session.user.id}`, "true");
      // Route to appropriate dashboard
      if (selected === "real-estate") {
        router.push("/dashboard/realestate");
      } else {
        router.push("/dashboard/agriculture");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-200 px-4">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Select Your Portfolio Type
      </h1>
      <div className="flex gap-8 w-full max-w-3xl">
        {portfolios.map((p) => (
          <div
            key={p.key}
            className={clsx(
              "flex-1 bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center transition-transform duration-300 cursor-pointer border-2",
              selected === p.key
                ? "border-blue-600 scale-105 shadow-2xl"
                : "border-transparent hover:scale-105 hover:shadow-2xl hover:border-blue-300",
            )}
            onClick={() => handleSelect(p.key)}
          >
            <div className="mb-4">{p.icon}</div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              {p.title}
            </h2>
            <p className="text-gray-500 mb-6 text-center">{p.description}</p>
            <Button
              className={clsx(
                "w-full mt-auto text-lg py-2 px-4 rounded-lg transition-all duration-200",
                selected === p.key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-blue-700 hover:bg-blue-50",
              )}
              onClick={handleContinue}
              disabled={selected !== p.key}
            >
              {p.cta}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

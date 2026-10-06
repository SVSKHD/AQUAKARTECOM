import Link from "next/link";
import {
  ChevronRight,
  FileText,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
  User,
} from "lucide-react";
import AquaUserDashbordLayout from "./layout/layout";
import { useAuth } from "@/context/AuthContext";

const SECTIONS = [
  {
    title: "Account",
    items: [
      {
        href: "/dashboard/profile",
        label: "Personal details",
        hint: "Name, email and phone",
        icon: User,
      },
      {
        href: "/dashboard/profile",
        label: "Delivery addresses",
        hint: "Add or change where we deliver",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Help",
    items: [
      {
        href: "/find-invoice",
        label: "Find an invoice",
        hint: "Download a GST invoice for any order",
        icon: FileText,
      },
      {
        href: "/contact-us",
        label: "Contact support",
        hint: "Installation, service and order help",
        icon: Mail,
      },
      {
        href: "/privacy-policy",
        label: "Privacy policy",
        hint: "How we handle your data",
        icon: ShieldCheck,
      },
    ],
  },
];

const AquaUserSettingsPageComponent = () => {
  const { signOut } = useAuth();

  return (
    <AquaUserDashbordLayout>
      <div className="max-w-2xl space-y-5">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              {section.title}
            </h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-3xl border border-slate-200 bg-white">
              {section.items.map(({ href, label, hint, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">
                      {label}
                    </span>
                    <span className="block text-xs text-slate-500">{hint}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={() => signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-rose-200 bg-white px-4 py-3.5 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </AquaUserDashbordLayout>
  );
};

export default AquaUserSettingsPageComponent;

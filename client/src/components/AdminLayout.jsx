import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  // Orders and Users are added in Part B
];

export default function AdminLayout() {
  return (
    <div className="grid gap-6 md:grid-cols-[200px_1fr]">
      <aside>
        <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground md:block">
          Admin panel
        </p>
        <nav className="flex gap-2 overflow-x-auto md:flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
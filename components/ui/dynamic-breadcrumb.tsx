"use client";

import { usePathname } from "next/navigation";
import Breadcrumb, { BreadcrumbItem } from "@/components/ui/breadcrumb";

// Mapping cho các route và tên hiển thị tương ứng
const routeLabels: Record<string, string> = {
    "/": "Home",
    "/auth": "Authentication",
    "/auth/login": "Login",
    "/dashboard": "Dashboard",
    "/profile": "Profile",
    "/passport": "Passport",
    "/market": "Market",
};

// Mapping cho các route cha
const routeParents: Record<string, string> = {
    "/auth/login": "/auth",
};

export default function DynamicBreadcrumb() {
    const pathname = usePathname();

    // Nếu là trang chủ, không hiển thị breadcrumb
    if (pathname === "/") {
        return null;
    }

    const pathSegments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Tạo breadcrumb items từ path segments
    let currentPath = "";

    pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 1;

        // Lấy label từ mapping hoặc capitalize segment
        const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);

        items.push({
            label,
            href: isLast ? undefined : currentPath,
            isCurrentPage: isLast,
        });
    });

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-20 pb-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <Breadcrumb items={items} />
            </div>
        </div>
    );
}

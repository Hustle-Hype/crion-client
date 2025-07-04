import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbItem {
    label: string;
    href?: string;
    isCurrentPage?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className={`flex items-center space-x-1 text-sm ${className}`}>
            <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Home"
            >
                <Home className="w-4 h-4" />
            </Link>

            {items.map((item, index) => (
                <Fragment key={index}>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    {item.href && !item.isCurrentPage ? (
                        <Link
                            href={item.href}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span
                            className={item.isCurrentPage ? "text-foreground font-medium" : "text-muted-foreground"}
                            aria-current={item.isCurrentPage ? "page" : undefined}
                        >
                            {item.label}
                        </span>
                    )}
                </Fragment>
            ))}
        </nav>
    );
}

import React from 'react';
import { useTheme } from '../theme';
import { Palette } from '../theme/palette';

// ── Curated Lucide icon imports (tree-shake safe) ────────────────────────────
import Target from 'lucide-react-native/dist/esm/icons/target';
import Bell from 'lucide-react-native/dist/esm/icons/bell';
import MessageSquare from 'lucide-react-native/dist/esm/icons/message-square';
import User from 'lucide-react-native/dist/esm/icons/user';
import Check from 'lucide-react-native/dist/esm/icons/check';
import AlertTriangle from 'lucide-react-native/dist/esm/icons/alert-triangle';
import Clock from 'lucide-react-native/dist/esm/icons/clock';
import BarChart3 from 'lucide-react-native/dist/esm/icons/bar-chart-3';
import CircleDollarSign from 'lucide-react-native/dist/esm/icons/circle-dollar-sign';
import CreditCard from 'lucide-react-native/dist/esm/icons/credit-card';
import Search from 'lucide-react-native/dist/esm/icons/search';
import Landmark from 'lucide-react-native/dist/esm/icons/landmark';
import Wallet from 'lucide-react-native/dist/esm/icons/wallet';
import Star from 'lucide-react-native/dist/esm/icons/star';
import Lightbulb from 'lucide-react-native/dist/esm/icons/lightbulb';
import Settings from 'lucide-react-native/dist/esm/icons/settings';
import Pencil from 'lucide-react-native/dist/esm/icons/pencil';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import ChevronLeft from 'lucide-react-native/dist/esm/icons/chevron-left';
import Plus from 'lucide-react-native/dist/esm/icons/plus';
import Trash2 from 'lucide-react-native/dist/esm/icons/trash-2';
import XCircle from 'lucide-react-native/dist/esm/icons/x-circle';
import Info from 'lucide-react-native/dist/esm/icons/info';
import Zap from 'lucide-react-native/dist/esm/icons/zap';
import Lock from 'lucide-react-native/dist/esm/icons/lock';
import HelpCircle from 'lucide-react-native/dist/esm/icons/help-circle';

// ── Icon registry ────────────────────────────────────────────────────────────
const ICONS = {
    target: Target,
    bell: Bell,
    'message-square': MessageSquare,
    user: User,
    check: Check,
    'alert-triangle': AlertTriangle,
    clock: Clock,
    'bar-chart-3': BarChart3,
    'circle-dollar-sign': CircleDollarSign,
    'credit-card': CreditCard,
    search: Search,
    landmark: Landmark,
    wallet: Wallet,
    star: Star,
    lightbulb: Lightbulb,
    settings: Settings,
    pencil: Pencil,
    'chevron-right': ChevronRight,
    'chevron-left': ChevronLeft,
    plus: Plus,
    'trash-2': Trash2,
    'x-circle': XCircle,
    info: Info,
    zap: Zap,
    lock: Lock,
    'help-circle': HelpCircle,
} as const;

export type IconName = keyof typeof ICONS;

// ── Size scale ───────────────────────────────────────────────────────────────
const SIZE_MAP = {
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
} as const;

export type IconSize = keyof typeof SIZE_MAP;

// ── Props ────────────────────────────────────────────────────────────────────
interface IconProps {
    /** One of the curated icon names from the registry. */
    name: IconName;
    /** Token-based size: sm (14) | md (16) | lg (20) | xl (24). Default: md. */
    size?: IconSize;
    /** A Palette key, or a raw colour string. Default: 'ink2'. */
    color?: keyof Palette | string;
    /** Override strokeWidth. Default: 1.8. */
    strokeWidth?: number;
}

/**
 * Thin wrapper around Lucide icons.
 *
 * - Guarantees a clamped 4-token size scale (sm/md/lg/xl).
 * - Resolves Palette keys automatically via useTheme.
 * - Standardizes strokeWidth to 1.8 app-wide.
 *
 * Usage:
 *   <Icon name="target" size="md" />
 *   <Icon name="bell" color="accent" size="lg" />
 *   <Icon name="check" color="#00FF00" />
 */
export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    color = 'ink2',
    strokeWidth = 1.8,
}) => {
    const { colors } = useTheme();
    const LucideIcon = ICONS[name];

    // Resolve palette key → hex, or pass through raw colour strings
    const resolvedColor = (color in colors)
        ? colors[color as keyof Palette]
        : color;

    const resolvedSize = SIZE_MAP[size];

    return (
        <LucideIcon
            size={resolvedSize}
            color={resolvedColor}
            strokeWidth={strokeWidth}
        />
    );
};

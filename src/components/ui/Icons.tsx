import type { SVGProps } from 'react'

/** Icone a tratto, 24x24, colorate con `currentColor`. Nessuna libreria esterna. */

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10v9.5h13V10" />
    <path d="M10 19.5v-5h4v5" />
  </Icon>
)

export const BodyIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="5.5" r="2.5" />
    <path d="M7 11c1.5-1.5 3.3-2 5-2s3.5.5 5 2" />
    <path d="M9 21l1-8h4l1 8" />
    <path d="M8.5 13.5h7" />
  </Icon>
)

export const RunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="15.5" cy="4.5" r="2" />
    <path d="M9 20l2.5-5.5L9 12l3.5-4 2.5 3 3.5 1" />
    <path d="M12.5 8 9.5 9.5 7 12.5" />
    <path d="M14.5 13.5 16 16l3 3" />
  </Icon>
)

export const GymIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4" />
    <path d="M6.5 12h11" />
  </Icon>
)

export const ReportIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5Z" />
    <path d="M14 3.5V8h4" />
    <path d="M9.5 12h5M9.5 15.5h5" />
  </Icon>
)

export const SettingsIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
  </Icon>
)

export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m14.5 6-6 6 6 6" />
  </Icon>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9.5 6 6 6-6 6" />
  </Icon>
)

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
)

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
)

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
)

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M7 7l.8 12.5h8.4L17 7" />
    <path d="M10 11v5M14 11v5" />
  </Icon>
)

export const EditIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4.5 19.5h4l10-10-4-4-10 10v4Z" />
    <path d="m12.5 7.5 4 4" />
  </Icon>
)

export const HeartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10A4 4 0 0 1 12 7.5 4 4 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  </Icon>
)

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </Icon>
)

export const UploadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4.5 19.5h15" />
  </Icon>
)

export const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5v11M8 7.5l4-4 4 4" />
    <path d="M6.5 11.5H5v9h14v-9h-1.5" />
  </Icon>
)

export const CopyIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5" />
  </Icon>
)

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
  </Icon>
)

export const ScaleIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <path d="M8.5 10.5a4.5 4.5 0 0 1 7 0" />
    <path d="M12 12.5 14 9" />
  </Icon>
)

export const RulerIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.5 15.5 12-12 5 5-12 12-5-5Z" />
    <path d="m8 11 1.5 1.5M10.5 8.5 12 10M13 6l1.5 1.5" />
  </Icon>
)

export const ClockIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.5" />
  </Icon>
)

export const RouteIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
  </Icon>
)

export const NoteIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4h11A1.5 1.5 0 0 1 19 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-13Z" />
    <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
  </Icon>
)

export const SmileIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9 10h.01M15 10h.01" strokeWidth={2.4} />
    <path d="M8.8 14a4 4 0 0 0 6.4 0" />
  </Icon>
)

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Icon>
)

export const TargetIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Icon>
)

export const RepeatIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 3.5 20 6.5l-3 3" />
    <path d="M4 12V9.5a3 3 0 0 1 3-3h13" />
    <path d="m7 20.5-3-3 3-3" />
    <path d="M20 12v2.5a3 3 0 0 1-3 3H4" />
  </Icon>
)

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </Icon>
)

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z" />
  </Icon>
)

export const TreadmillIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3.5 17.5h17" />
    <path d="M5 17.5V9l3-1.5" />
    <path d="M9 17.5 13 8l5 1" />
    <circle cx="18.5" cy="5.5" r="1.5" />
  </Icon>
)

export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 6.5h11M8.5 12h11M8.5 17.5h11" />
    <path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" strokeWidth={2.6} />
  </Icon>
)

export const ArrowUpIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
)

export const ArrowDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M6 13l6 6 6-6" />
  </Icon>
)

export const ArchiveIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3.5" y="4.5" width="17" height="4" rx="1" />
    <path d="M5 8.5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-10" />
    <path d="M10 12.5h4" />
  </Icon>
)

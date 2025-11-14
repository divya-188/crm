/**
 * Icon Library Integration
 * Centralized icon exports from Lucide React
 * 
 * Usage:
 * import { Icons } from '@/lib/icons';
 * <Icons.User size={20} />
 */

import {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  MoreHorizontal,
  
  // Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Settings,
  
  // Status & Alerts
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  
  // User & Account
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Communication
  MessageSquare,
  MessageCircle,
  Send,
  Mail,
  Phone,
  PhoneCall,
  Video,
  Mic,
  MicOff,
  
  // Files & Media
  File,
  FileText,
  Image,
  Video as VideoIcon,
  Music,
  Paperclip,
  Folder,
  FolderOpen,
  
  // Business & CRM
  Briefcase,
  Building,
  Calendar,
  Clock,
  Tag,
  Tags,
  Star,
  Heart,
  Bookmark,
  
  // Analytics & Charts
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  
  // Social & Sharing
  Share2,
  Link,
  ExternalLink,
  Globe,
  
  // System & Settings
  Loader2,
  Zap,
  Bell,
  BellOff,
  Power,
  LogOut,
  LogIn,
  Home,
  
  // WhatsApp Specific
  MessageSquare as WhatsApp,
  Smartphone,
  QrCode,
  
  // Automation & Flows
  GitBranch,
  Workflow,
  Play,
  Pause,
  Square,
  
  // Data & Database
  Database,
  Server,
  HardDrive,
  
  // Misc
  Package,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Percent,
  Target,
  Award,
  Gift,
} from 'lucide-react';

export const Icons = {
  // Navigation & UI
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  moreVertical: MoreVertical,
  moreHorizontal: MoreHorizontal,
  
  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  delete: Trash2,
  save: Save,
  download: Download,
  upload: Upload,
  copy: Copy,
  check: Check,
  search: Search,
  filter: Filter,
  refresh: RefreshCw,
  settings: Settings,
  
  // Status & Alerts
  alertCircle: AlertCircle,
  alertTriangle: AlertTriangle,
  info: Info,
  checkCircle: CheckCircle,
  xCircle: XCircle,
  helpCircle: HelpCircle,
  
  // User & Account
  user: User,
  users: Users,
  userPlus: UserPlus,
  userMinus: UserMinus,
  userCheck: UserCheck,
  shield: Shield,
  lock: Lock,
  unlock: Unlock,
  eye: Eye,
  eyeOff: EyeOff,
  
  // Communication
  message: MessageSquare,
  messageCircle: MessageCircle,
  send: Send,
  mail: Mail,
  phone: Phone,
  phoneCall: PhoneCall,
  video: Video,
  mic: Mic,
  micOff: MicOff,
  
  // Files & Media
  file: File,
  fileText: FileText,
  image: Image,
  videoFile: VideoIcon,
  music: Music,
  paperclip: Paperclip,
  folder: Folder,
  folderOpen: FolderOpen,
  
  // Business & CRM
  briefcase: Briefcase,
  building: Building,
  calendar: Calendar,
  clock: Clock,
  tag: Tag,
  tags: Tags,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  
  // Analytics & Charts
  barChart: BarChart,
  lineChart: LineChart,
  pieChart: PieChart,
  trendingUp: TrendingUp,
  trendingDown: TrendingDown,
  activity: Activity,
  
  // Social & Sharing
  share: Share2,
  link: Link,
  externalLink: ExternalLink,
  globe: Globe,
  
  // System & Settings
  loader: Loader2,
  zap: Zap,
  bell: Bell,
  bellOff: BellOff,
  power: Power,
  logout: LogOut,
  login: LogIn,
  home: Home,
  
  // WhatsApp Specific
  whatsapp: WhatsApp,
  smartphone: Smartphone,
  qrCode: QrCode,
  
  // Automation & Flows
  gitBranch: GitBranch,
  workflow: Workflow,
  play: Play,
  pause: Pause,
  stop: Square,
  
  // Data & Database
  database: Database,
  server: Server,
  hardDrive: HardDrive,
  
  // Misc
  package: Package,
  shoppingCart: ShoppingCart,
  creditCard: CreditCard,
  dollarSign: DollarSign,
  percent: Percent,
  target: Target,
  award: Award,
  gift: Gift,
};

export type IconName = keyof typeof Icons;

export default Icons;

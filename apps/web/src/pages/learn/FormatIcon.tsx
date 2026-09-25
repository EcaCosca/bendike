import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PodcastsOutlinedIcon from '@mui/icons-material/PodcastsOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SubscriptionsOutlinedIcon from '@mui/icons-material/SubscriptionsOutlined';
import type { SvgIconProps } from '@mui/material';
import type { LearnFormat } from '@bendike/shared';

const ICONS: Record<LearnFormat, typeof ArticleOutlinedIcon> = {
  video: PlayCircleOutlineIcon,
  article: ArticleOutlinedIcon,
  podcast: PodcastsOutlinedIcon,
  book: MenuBookOutlinedIcon,
  channel: SubscriptionsOutlinedIcon,
  course: SchoolOutlinedIcon,
  page: LanguageOutlinedIcon,
  film: MovieOutlinedIcon,
};

export function FormatIcon({ format, ...props }: { format: LearnFormat } & SvgIconProps) {
  const Icon = ICONS[format];
  return <Icon {...props} />;
}

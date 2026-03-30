/**
 * Ícones de marcas via react-icons (Simple Icons).
 * @see https://react-icons.github.io/react-icons/icons/si/
 */
import type { IconBaseProps } from "react-icons";
import {
  SiMeta,
  SiGoogleads,
  SiGooglemaps,
  SiInstagram,
  SiFacebook,
  SiYoutube,
  SiTiktok,
  SiX,
  SiGoogleanalytics,
} from "react-icons/si";

type Props = IconBaseProps;

export function IconMeta(props: Props) {
  return <SiMeta {...props} title="Meta" />;
}

export function IconGoogleAds(props: Props) {
  return <SiGoogleads {...props} title="Google Ads" />;
}

/** Google Meu Negócio / perfil local — pin do Maps (identidade Google local). */
export function IconGoogleBusiness(props: Props) {
  return <SiGooglemaps {...props} title="Google Meu Negócio" />;
}

export function IconInstagram(props: Props) {
  return <SiInstagram {...props} title="Instagram" />;
}

export function IconFacebook(props: Props) {
  return <SiFacebook {...props} title="Facebook" />;
}

export function IconYouTube(props: Props) {
  return <SiYoutube {...props} title="YouTube" />;
}

export function IconTikTok(props: Props) {
  return <SiTiktok {...props} title="TikTok" />;
}

export function IconX(props: Props) {
  return <SiX {...props} title="X" />;
}

export function IconGoogleAnalytics(props: Props) {
  return <SiGoogleanalytics {...props} title="Google Analytics" />;
}

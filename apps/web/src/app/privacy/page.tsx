import { MenuPage } from '../../components/MenuPage';
import { copy } from '@rakshak/game-ui';

export default function PrivacyPage() {
  return <MenuPage title={copy.privacy} body={`${copy.privacyBody} ${copy.webSaveNotice}`} />;
}
